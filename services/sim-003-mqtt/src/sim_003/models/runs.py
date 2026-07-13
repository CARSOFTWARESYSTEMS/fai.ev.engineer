from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

from .events import Anomaly, DetectionResult, Scenario, TelemetryEvent

CONTRACT_VERSION = "simulator.run.v1"
SIMULATOR_ID = "SIM-003"


class RunStatus(str, Enum):
    pending = "PENDING"
    running = "RUNNING"
    passed = "PASSED"
    failed = "FAILED"
    degraded = "DEGRADED"
    stopped = "STOPPED"


class PublishStatus(str, Enum):
    acknowledged = "ACKNOWLEDGED"
    failed = "FAILED"
    skipped = "SKIPPED"  # in_memory transport / publish=false


class PublishReceipt(BaseModel):
    status: PublishStatus
    message_id: int | None = None
    published_at: datetime | None = None
    latency_ms: float | None = None


class Observation(BaseModel):
    received_at: datetime
    schema_valid: bool
    anomalies: list[Anomaly]
    primary_anomaly: Anomaly
    anomaly_detail: str | None = None


class ObservedEvent(BaseModel):
    """One fully round-tripped telemetry event: generated payload +
    transport envelope + independent detection result."""

    topic: str
    qos: int
    retain: Literal[False] = False
    payload: TelemetryEvent
    publish: PublishReceipt
    observation: Observation
    detection: DetectionResult


class SimulationRun(BaseModel):
    """Internal, mutable run state held by the RunRepository."""

    contract_version: Literal["simulator.run.v1"] = CONTRACT_VERSION
    simulator_id: Literal["SIM-003"] = SIMULATOR_ID
    run_id: str
    organisation_slug: str
    battery_id: str
    scenario: Scenario
    status: RunStatus = RunStatus.pending
    transport: str
    broker_connected: bool = False
    topic: str
    seed: int
    profile_id: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    generated_count: int = 0
    published_count: int = 0
    observed_count: int = 0
    valid_count: int = 0
    invalid_schema_count: int = 0
    anomaly_counts: dict[str, int] = Field(default_factory=dict)
    events: list[ObservedEvent] = Field(default_factory=list)
    simulated: Literal[True] = True

    def to_run_result(self) -> "RunResult":
        return RunResult(
            contract_version=self.contract_version,
            simulator_id=self.simulator_id,
            run_id=self.run_id,
            scenario=self.scenario,
            status=self.status,
            transport=self.transport,
            broker_connected=self.broker_connected,
            started_at=self.started_at,
            completed_at=self.completed_at,
            generated_count=self.generated_count,
            published_count=self.published_count,
            observed_count=self.observed_count,
            valid_count=self.valid_count,
            invalid_schema_count=self.invalid_schema_count,
            anomaly_counts=self.anomaly_counts,
            events=self.events,
            simulated=True,
            seed=self.seed,
        )


class RunResult(BaseModel):
    """SIM-010-compatible envelope returned by the API/CLI."""

    contract_version: Literal["simulator.run.v1"] = CONTRACT_VERSION
    simulator_id: Literal["SIM-003"] = SIMULATOR_ID
    run_id: str
    scenario: Scenario
    status: RunStatus
    transport: str
    broker_connected: bool
    started_at: datetime | None
    completed_at: datetime | None
    generated_count: int
    published_count: int
    observed_count: int
    valid_count: int
    invalid_schema_count: int = 0
    anomaly_counts: dict[str, int]
    events: list[ObservedEvent]
    simulated: Literal[True] = True
    seed: int
