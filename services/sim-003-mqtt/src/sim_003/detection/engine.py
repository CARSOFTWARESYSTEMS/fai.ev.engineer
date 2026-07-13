"""TelemetryDetectionEngine — independent of the generator.

The detector never reads `TelemetryEvent.scenario` or `replay_of_event_id`
as its verdict. It derives every finding from observable fields
(timestamp/sent_at age, sequence-number history, registered vs payload
battery_id, and profile thresholds) plus its own per-run DetectionState.
`scenario`/`replay_of_event_id` exist on the event purely as simulation
metadata for building test evidence and are ignored by evaluate().
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from ..core.profiles import BatteryProfile
from ..models.events import ANOMALY_PRECEDENCE, Anomaly, DetectionResult, FieldFinding, TelemetryEvent

_DELAY_TOLERANCE_SECONDS = 0.0


@dataclass
class _SequenceRecord:
    timestamp: datetime | None
    voltage_v: float
    current_a: float
    temperature_c: float
    soc_percent: float


@dataclass
class DetectionState:
    """Per-run mutable state. One instance per SimulationRun."""

    replay_window_seconds: int = 300
    _seen_sequences: dict[int, _SequenceRecord] = field(default_factory=dict)

    def record_if_new(self, event: TelemetryEvent) -> _SequenceRecord | None:
        """Returns the prior record for this sequence number, if any, and
        registers this event as the canonical first-seen record when none
        existed yet."""
        prior = self._seen_sequences.get(event.sequence_number)
        if prior is None:
            self._seen_sequences[event.sequence_number] = _SequenceRecord(
                timestamp=event.timestamp,
                voltage_v=event.voltage_v,
                current_a=event.current_a,
                temperature_c=event.temperature_c,
                soc_percent=event.soc_percent,
            )
        return prior


def select_primary_anomaly(anomalies: list[Anomaly]) -> Anomaly:
    for candidate in ANOMALY_PRECEDENCE:
        if candidate in anomalies:
            return candidate
    return Anomaly.none


class TelemetryDetectionEngine:
    def evaluate(self, event: TelemetryEvent, state: DetectionState, profile: BatteryProfile) -> DetectionResult:
        anomalies: list[Anomaly] = []
        findings: list[FieldFinding] = []
        detail_parts: list[str] = []

        # Identity spoofing — registered vs payload battery_id.
        if event.battery_id != event.registered_battery_id:
            anomalies.append(Anomaly.spoofed_identity)
            detail_parts.append(
                f"Payload battery_id {event.battery_id!r} does not match registered "
                f"battery_id {event.registered_battery_id!r}"
            )

        # Missing timestamp.
        if event.timestamp is None:
            anomalies.append(Anomaly.missing_timestamp)
            detail_parts.append("timestamp field is missing")

        # Sequence-number history: duplicate vs replay.
        prior = state.record_if_new(event)
        if prior is not None:
            age_seconds = None
            if event.timestamp is not None:
                age_seconds = (event.sent_at - event.timestamp).total_seconds()
            if age_seconds is not None and age_seconds > state.replay_window_seconds:
                anomalies.append(Anomaly.replay_detected)
                detail_parts.append(
                    f"Sequence {event.sequence_number} previously observed; timestamp is "
                    f"{age_seconds:.0f}s old, exceeding the {state.replay_window_seconds}s replay window"
                )
            else:
                anomalies.append(Anomaly.duplicate)
                detail_parts.append(f"Sequence {event.sequence_number} previously observed (duplicate delivery)")

        # Out-of-range thresholds (independent of scenario label).
        if event.voltage_v > profile.maximum_valid_voltage_v:
            anomalies.append(Anomaly.out_of_range)
            findings.append(FieldFinding(
                field="voltage_v", value=event.voltage_v, threshold=profile.maximum_valid_voltage_v,
                operator=">", unit="V",
            ))
        if event.temperature_c > profile.maximum_valid_temperature_c:
            anomalies.append(Anomaly.out_of_range)
            findings.append(FieldFinding(
                field="temperature_c", value=event.temperature_c, threshold=profile.maximum_valid_temperature_c,
                operator=">", unit="°C",
            ))
        if abs(event.current_a) > profile.maximum_absolute_current_a:
            anomalies.append(Anomaly.out_of_range)
            findings.append(FieldFinding(
                field="current_a", value=abs(event.current_a), threshold=profile.maximum_absolute_current_a,
                operator=">", unit="A",
            ))
        if findings:
            detail_parts.append(
                "Out-of-range fields: " + ", ".join(f"{f.field}={f.value}{f.unit} (> {f.threshold}{f.unit})" for f in findings)
            )

        # Delayed telemetry — only meaningful for genuinely new sequences;
        # duplicate/replay already explain any timestamp/sent_at gap.
        if prior is None and event.timestamp is not None:
            age_seconds = (event.sent_at - event.timestamp).total_seconds()
            if age_seconds > _DELAY_TOLERANCE_SECONDS:
                anomalies.append(Anomaly.delayed_telemetry)
                detail_parts.append(f"Timestamp is {age_seconds:.0f}s older than sent_at")

        if not anomalies:
            anomalies.append(Anomaly.none)

        # De-duplicate while preserving order (out-of-range can append twice).
        seen: set[Anomaly] = set()
        unique_anomalies = [a for a in anomalies if not (a in seen or seen.add(a))]

        return DetectionResult(
            event_id=event.event_id,
            anomalies=unique_anomalies,
            primary_anomaly=select_primary_anomaly(unique_anomalies),
            anomaly_detail="; ".join(detail_parts) if detail_parts else None,
            field_findings=findings,
            schema_valid=True,
        )
