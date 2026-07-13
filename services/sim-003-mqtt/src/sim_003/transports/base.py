from __future__ import annotations

from typing import Awaitable, Callable, Protocol

from pydantic import BaseModel

from ..models.runs import PublishReceipt

MessageHandler = Callable[[bytes, str], Awaitable[None]]


class PublishMessage(BaseModel):
    topic: str
    payload: bytes
    qos: int
    retain: bool = False


class Subscription(Protocol):
    async def unsubscribe(self) -> None: ...


class EventTransport(Protocol):
    async def connect(self) -> None: ...
    async def disconnect(self) -> None: ...
    async def publish(self, message: PublishMessage) -> PublishReceipt: ...
    async def subscribe(self, topic_filter: str, handler: MessageHandler) -> Subscription: ...

    @property
    def is_connected(self) -> bool: ...

    @property
    def mode(self) -> str: ...
