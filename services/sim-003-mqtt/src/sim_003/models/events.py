from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SCHEMA_VERSION = "sim003.telemetry.v1"
SIMULATION_LABEL = "EDUCATIONAL_SIMULATION_ONLY"


class Scenario(str, Enum):
    normal = "normal"
    delayed_telemetry = "delayed_telemetry"
    duplicate_packet = "duplicate_packet"
    out_of_range = "out_of_range"
    missing_timestamp = "missing_timestamp"
    spoofed_identity = "spoofed_identity"
    replay_attack = "replay_attack"


class Anomaly(str, Enum):
    none = "NONE"
    delayed_telemetry = "DELAYED_TELEMETRY"
    duplicate = "DUPLICATE"
    out_of_range = "OUT_OF_RANGE"
    missing_timestamp = "MISSING_TIMESTAMP"
    spoofed_identity = "SPOOFED_IDENTITY"
    replay_detected = "REPLAY_DETECTED"


# Worst-first precedence — see detection/engine.py::select_primary_anomaly.
ANOMALY_PRECEDENCE: list[Anomaly] = [
    Anomaly.spoofed_identity,
    Anomaly.replay_detected,
    Anomaly.missing_timestamp,
    Anomaly.duplicate,
    Anomaly.out_of_range,
    Anomaly.delayed_telemetry,
    Anomaly.none,
]


class TelemetryEvent(BaseModel):
    """The simulated BMS payload. Never carries broker credentials or a
    producer-supplied anomaly verdict — the detector derives that
    independently from this payload plus detection state."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["sim003.telemetry.v1"] = SCHEMA_VERSION
    event_id: str
    run_id: str
    registered_battery_id: str
    battery_id: str
    sequence_number: int
    timestamp: datetime | None = None
    sent_at: datetime
    voltage_v: float
    current_a: float
    temperature_c: float
    soc_percent: float
    simulated: Literal[True] = True
    scenario: Scenario
    simulation_label: Literal["EDUCATIONAL_SIMULATION_ONLY"] = SIMULATION_LABEL

    # Simulation-only metadata used by the (independent) detector and by
    # test evidence — never treated as the detector's verdict.
    replay_of_event_id: str | None = None


class FieldFinding(BaseModel):
    field: str
    value: float
    threshold: float
    operator: Literal[">", "<", ">=", "<="]
    unit: str


class DetectionResult(BaseModel):
    event_id: str
    anomalies: list[Anomaly]
    primary_anomaly: Anomaly
    anomaly_detail: str | None = None
    field_findings: list[FieldFinding] = Field(default_factory=list)
    schema_valid: bool = True
