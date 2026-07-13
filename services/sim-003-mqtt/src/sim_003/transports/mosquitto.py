"""Real local Mosquitto transport (loopback only in POC mode).

Uses aiomqtt (asyncio-native paho-mqtt wrapper). connect()/disconnect() are
implemented by manually driving aiomqtt's async context manager, since our
EventTransport protocol exposes explicit lifecycle methods rather than
requiring callers to use `async with`.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from contextlib import AsyncExitStack
from datetime import datetime, timezone

import aiomqtt

from ..models.runs import PublishReceipt, PublishStatus
from ..settings import Settings
from .base import EventTransport, MessageHandler, PublishMessage
from .in_memory import _topic_filter_to_regex

logger = logging.getLogger("sim_003.transport.mosquitto")


class MosquittoConnectionError(RuntimeError):
    pass


class _MosquittoSubscription:
    def __init__(self, transport: "MosquittoTransport", topic_filter: str):
        self._transport = transport
        self._topic_filter = topic_filter

    async def unsubscribe(self) -> None:
        self._transport._handlers.pop(self._topic_filter, None)


class MosquittoTransport(EventTransport):
    """One MosquittoTransport instance owns exactly one publisher connection
    and one subscriber connection (separate credentials where configured),
    matching the "separate publisher/subscriber credentials" requirement.
    """

    def __init__(self, settings: Settings):
        settings.enforce_local_only()
        self._settings = settings
        self._connected = False
        self._exit_stack = AsyncExitStack()
        self._pub_client: aiomqtt.Client | None = None
        self._sub_client: aiomqtt.Client | None = None
        self._handlers: dict[str, tuple[MessageHandler, "re.Pattern[str]"]] = {}
        self._listen_task: asyncio.Task | None = None
        self._message_id_counter = 0

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def mode(self) -> str:
        return "mqtt"

    async def connect(self) -> None:
        s = self._settings
        try:
            self._pub_client = aiomqtt.Client(
                hostname=s.mqtt_broker_host,
                port=s.mqtt_broker_port,
                username=s.mqtt_publisher_username,
                password=s.mqtt_publisher_password,
                keepalive=s.mqtt_keepalive_seconds,
                identifier=f"sim003-pub-{int(time.time())}",
            )
            self._sub_client = aiomqtt.Client(
                hostname=s.mqtt_broker_host,
                port=s.mqtt_broker_port,
                username=s.mqtt_subscriber_username or s.mqtt_publisher_username,
                password=s.mqtt_subscriber_password or s.mqtt_publisher_password,
                keepalive=s.mqtt_keepalive_seconds,
                identifier=f"sim003-sub-{int(time.time())}",
            )
            await self._exit_stack.enter_async_context(self._pub_client)
            await self._exit_stack.enter_async_context(self._sub_client)
            self._connected = True
            self._listen_task = asyncio.create_task(self._listen())
        except Exception as exc:  # noqa: BLE001 - report truthfully, never crash the API process
            self._connected = False
            logger.warning("Mosquitto connect failed: %s", exc)
            raise MosquittoConnectionError(str(exc)) from exc

    async def disconnect(self) -> None:
        self._connected = False
        if self._listen_task is not None:
            self._listen_task.cancel()
            self._listen_task = None
        await self._exit_stack.aclose()
        self._pub_client = None
        self._sub_client = None
        self._handlers.clear()

    async def subscribe(self, topic_filter: str, handler: MessageHandler):
        if not self._connected or self._sub_client is None:
            raise MosquittoConnectionError("Cannot subscribe: not connected to broker")
        await self._sub_client.subscribe(topic_filter)
        self._handlers[topic_filter] = (handler, _topic_filter_to_regex(topic_filter))
        return _MosquittoSubscription(self, topic_filter)

    async def publish(self, message: PublishMessage) -> PublishReceipt:
        if not self._connected or self._pub_client is None:
            return PublishReceipt(status=PublishStatus.failed)
        started = time.monotonic()
        try:
            await self._pub_client.publish(
                message.topic, payload=message.payload, qos=message.qos, retain=message.retain,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Mosquitto publish failed: %s", exc)
            return PublishReceipt(status=PublishStatus.failed)
        latency_ms = (time.monotonic() - started) * 1000
        self._message_id_counter += 1
        return PublishReceipt(
            status=PublishStatus.acknowledged,
            message_id=self._message_id_counter,
            published_at=datetime.now(timezone.utc),
            latency_ms=round(latency_ms, 3),
        )

    async def _listen(self) -> None:
        assert self._sub_client is not None
        try:
            async for message in self._sub_client.messages:
                topic_str = str(message.topic)
                for handler, pattern in list(self._handlers.values()):
                    if pattern.match(topic_str):
                        payload = message.payload if isinstance(message.payload, (bytes, bytearray)) else bytes(str(message.payload), "utf-8")
                        await handler(payload, topic_str)
        except asyncio.CancelledError:
            pass
        except Exception as exc:  # noqa: BLE001
            logger.warning("Mosquitto listen loop ended: %s", exc)
            self._connected = False
