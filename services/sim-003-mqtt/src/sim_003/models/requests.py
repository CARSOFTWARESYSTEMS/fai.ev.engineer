from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .events import Scenario

_BATTERY_ID_RE = re.compile(r"^SIM-[A-Za-z0-9_-]{1,60}$")


class GenerateEventsRequest(BaseModel):
    """Client-facing request. Never accepts organisation_id, auth identity,
    broker host/credentials, final topic, simulated=false, or retain=true —
    those are either server-resolved or rejected outright by omission from
    this schema (extra='forbid')."""

    model_config = ConfigDict(extra="forbid")

    battery_id: str = Field(min_length=5, max_length=64)
    scenario: Scenario
    num_events: int = Field(default=10, ge=1, le=1000)
    delay_seconds: int | None = Field(default=None, ge=1, le=300)
    replay_window_seconds: int = Field(default=300, ge=1, le=3600)
    interval_ms: int = Field(default=500, ge=50, le=10000)
    qos: int = Field(default=1, ge=0, le=2)
    publish: bool = True
    transport: str | None = Field(default=None, pattern="^(mqtt|in_memory)$")
    profile_id: str = "sim003_48v_demo"
    seed: int = 42
    topic_prefix: str | None = Field(default=None, max_length=128)

    @field_validator("battery_id")
    @classmethod
    def validate_battery_id(cls, value: str) -> str:
        if not _BATTERY_ID_RE.match(value):
            raise ValueError("battery_id must use the reserved 'SIM-' prefix, e.g. SIM-BAT-001")
        return value
