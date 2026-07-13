from __future__ import annotations

from fastapi import Request

from ..core.repository import InMemoryRunRepository
from ..settings import Settings, get_settings
from ..transports.base import EventTransport


def get_settings_dep() -> Settings:
    return get_settings()


def get_transport(request: Request) -> EventTransport:
    return request.app.state.transport


def get_repository(request: Request) -> InMemoryRunRepository:
    return request.app.state.repository
