"""Deterministic, broker-free transport — the mandatory fallback per the
SIM-003 requirement. Used for unit tests, CI, and offline demos when no
local Mosquitto broker is available."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from itertools import count

from ..models.runs import PublishReceipt, PublishStatus
from .base import EventTransport, MessageHandler, PublishMessage


def _topic_filter_to_regex(topic_filter: str) -> re.Pattern[str]:
    parts = topic_filter.split("/")
    regex_parts = []
    for part in parts:
        if part == "#":
            regex_parts.append(".*")
            break
        elif part == "+":
            regex_parts.append("[^/]+")
        else:
            regex_parts.append(re.escape(part))
    return re.compile("^" + "/".join(regex_parts) + "$")


class _InMemorySubscription:
    def __init__(self, transport: "InMemoryTransport", topic_filter: str, handler: MessageHandler):
        self._transport = transport
        self._topic_filter = topic_filter
        self._handler = handler

    async def unsubscribe(self) -> None:
        self._transport._subscriptions.pop(self, None)


class InMemoryTransport(EventTransport):
    def __init__(self) -> None:
        self._connected = False
        self._subscriptions: dict[_InMemorySubscription, re.Pattern[str]] = {}
        self._message_id = count(1)

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def mode(self) -> str:
        return "in_memory"

    async def connect(self) -> None:
        self._connected = True

    async def disconnect(self) -> None:
        self._connected = False
        self._subscriptions.clear()

    async def subscribe(self, topic_filter: str, handler: MessageHandler):
        sub = _InMemorySubscription(self, topic_filter, handler)
        self._subscriptions[sub] = _topic_filter_to_regex(topic_filter)
        return sub

    async def publish(self, message: PublishMessage) -> PublishReceipt:
        if not self._connected:
            return PublishReceipt(status=PublishStatus.failed)

        message_id = next(self._message_id)
        published_at = datetime.now(timezone.utc)

        for sub, pattern in list(self._subscriptions.items()):
            if pattern.match(message.topic):
                await sub._handler(message.payload, message.topic)

        return PublishReceipt(
            status=PublishStatus.acknowledged,
            message_id=message_id,
            published_at=published_at,
            latency_ms=0.0,
        )
