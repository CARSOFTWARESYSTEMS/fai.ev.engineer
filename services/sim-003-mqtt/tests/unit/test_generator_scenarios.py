from datetime import datetime, timedelta, timezone

import pytest

from sim_003.core.clock import FixedClock
from sim_003.core.generator import RunContext, TelemetryScenarioFactory
from sim_003.core.profiles import SIM003_48V_DEMO
from sim_003.detection.engine import DetectionState, TelemetryDetectionEngine
from sim_003.models.events import Anomaly
from sim_003.models.requests import GenerateEventsRequest

EPOCH = datetime(2026, 1, 1, tzinfo=timezone.utc)
generator = TelemetryScenarioFactory()
detector = TelemetryDetectionEngine()


def _context(run_id="SIM003-RUN-TEST"):
    return RunContext(
        run_id=run_id, registered_battery_id="SIM-BAT-001", profile=SIM003_48V_DEMO,
        clock=FixedClock(start=EPOCH, step=timedelta(seconds=1)),
    )


def _run_detection(events):
    state = DetectionState(replay_window_seconds=300)
    return [detector.evaluate(e, state, SIM003_48V_DEMO) for e in events]


# ── TC-003-01 — Normal telemetry generation ─────────────────────────────────

def test_tc_003_01_normal_telemetry():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=42)
    events = generator.generate(request, _context())

    assert len(events) == 10
    for e in events:
        assert e.timestamp is not None and e.timestamp.tzinfo is not None
        assert e.simulated is True
        assert 0 <= e.voltage_v <= SIM003_48V_DEMO.maximum_valid_voltage_v
        assert 0 <= e.temperature_c <= SIM003_48V_DEMO.maximum_valid_temperature_c
        assert abs(e.current_a) <= SIM003_48V_DEMO.maximum_absolute_current_a

    sequences = [e.sequence_number for e in events]
    assert sequences == sorted(sequences)
    assert len(set(sequences)) == len(sequences)

    results = _run_detection(events)
    assert all(r.primary_anomaly == Anomaly.none for r in results)


# ── TC-003-02 — Replay attack ────────────────────────────────────────────────

def test_tc_003_02_replay_attack():
    request = GenerateEventsRequest(
        battery_id="SIM-BAT-001", scenario="replay_attack", num_events=5, seed=42, replay_window_seconds=300,
    )
    events = generator.generate(request, _context())
    original, replays = events[0], events[1:]

    for replay in replays:
        assert replay.replay_of_event_id == original.event_id
        assert replay.timestamp == original.timestamp  # old timestamp preserved
        assert replay.sent_at > original.timestamp + timedelta(seconds=request.replay_window_seconds)

    results = _run_detection(events)
    assert results[0].primary_anomaly == Anomaly.none
    assert all(r.primary_anomaly == Anomaly.replay_detected for r in results[1:])
    assert all("EDUCATIONAL_SIMULATION_ONLY" == e.simulation_label for e in events)


# ── TC-003-03 — Duplicate packet ─────────────────────────────────────────────

def test_tc_003_03_duplicate_packet():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="duplicate_packet", num_events=5, seed=42)
    events = generator.generate(request, _context())
    original, duplicate = events[0], events[1]

    assert duplicate.sequence_number == original.sequence_number
    assert duplicate.voltage_v == original.voltage_v
    assert duplicate.current_a == original.current_a
    assert duplicate.temperature_c == original.temperature_c
    assert duplicate.soc_percent == original.soc_percent

    results = _run_detection(events)
    assert results[0].primary_anomaly == Anomaly.none
    assert results[1].primary_anomaly == Anomaly.duplicate


# ── TC-003-04 — Out of range ─────────────────────────────────────────────────

def test_tc_003_04_out_of_range():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="out_of_range", num_events=6, seed=42)
    events = generator.generate(request, _context())
    results = _run_detection(events)

    assert all(r.primary_anomaly == Anomaly.out_of_range for r in results)
    all_fields = {f.field for r in results for f in r.field_findings}
    assert {"voltage_v", "temperature_c", "current_a"} <= all_fields
    for r in results:
        for f in r.field_findings:
            assert f.value > f.threshold


# ── TC-003-05 — Missing timestamp ────────────────────────────────────────────

def test_tc_003_05_missing_timestamp():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="missing_timestamp", num_events=4, seed=42)
    events = generator.generate(request, _context())

    assert all(e.timestamp is None for e in events)
    results = _run_detection(events)  # must not raise
    assert all(r.primary_anomaly == Anomaly.missing_timestamp for r in results)


# ── Additional required unit tests ──────────────────────────────────────────

def test_spoofed_identity_uses_reserved_prefix_and_is_detected():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="spoofed_identity", num_events=3, seed=42)
    events = generator.generate(request, _context())

    assert all(e.battery_id.startswith("SIM-SPOOF-") for e in events)
    assert all(e.registered_battery_id == "SIM-BAT-001" for e in events)

    results = _run_detection(events)
    assert all(r.primary_anomaly == Anomaly.spoofed_identity for r in results)


@pytest.mark.parametrize("delay", [1, 300])
def test_delayed_telemetry_detected_at_boundaries(delay):
    request = GenerateEventsRequest(
        battery_id="SIM-BAT-001", scenario="delayed_telemetry", num_events=3, seed=42, delay_seconds=delay,
    )
    events = generator.generate(request, _context())
    results = _run_detection(events)
    assert all(r.primary_anomaly == Anomaly.delayed_telemetry for r in results)


def test_deterministic_seed_and_clock_produce_identical_output():
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=42)
    events_a = generator.generate(request, _context())
    events_b = generator.generate(request, _context())
    assert [e.model_dump() for e in events_a] == [e.model_dump() for e in events_b]


def test_different_seeds_produce_different_values():
    request_a = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=1)
    request_b = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=2)
    events_a = generator.generate(request_a, _context())
    events_b = generator.generate(request_b, _context())
    voltages_a = [e.voltage_v for e in events_a]
    voltages_b = [e.voltage_v for e in events_b]
    assert voltages_a != voltages_b


def test_anomaly_precedence_preserves_all_findings_but_picks_worst_primary():
    """A spoofed + missing-timestamp event should keep both findings, with
    SPOOFED_IDENTITY winning as primary per the documented precedence."""
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="spoofed_identity", num_events=1, seed=42)
    events = generator.generate(request, _context())
    event = events[0].model_copy(update={"timestamp": None})

    state = DetectionState(replay_window_seconds=300)
    result = detector.evaluate(event, state, SIM003_48V_DEMO)

    assert Anomaly.spoofed_identity in result.anomalies
    assert Anomaly.missing_timestamp in result.anomalies
    assert result.primary_anomaly == Anomaly.spoofed_identity
