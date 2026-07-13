"""TelemetryScenarioFactory — deterministic synthetic BMS telemetry generation.

Generation and detection are intentionally separate modules (see
detection/engine.py). A scenario may carry simulation-only metadata (e.g.
`replay_of_event_id`) for test evidence, but the detector must derive its
verdict from the event/state independently — it must never trust a
producer-supplied anomaly label.
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import timedelta

from ..models.events import Scenario, TelemetryEvent
from ..models.requests import GenerateEventsRequest
from .clock import Clock
from .ids import make_event_id, make_spoofed_battery_id
from .profiles import BatteryProfile

_SEQUENCE_START = 1000


@dataclass
class RunContext:
    run_id: str
    registered_battery_id: str
    profile: BatteryProfile
    clock: Clock


def _baseline(rng: random.Random, profile: BatteryProfile) -> tuple[float, float, float, float]:
    voltage = round(profile.nominal_voltage_v + rng.uniform(-1.5, 1.5), 2)
    current = round(rng.uniform(5.0, 25.0), 2)
    temperature = round(20.0 + rng.uniform(0.0, 15.0), 2)
    soc = round(rng.uniform(40.0, 95.0), 2)
    return voltage, current, temperature, soc


class TelemetryScenarioFactory:
    def generate(self, request: GenerateEventsRequest, context: RunContext) -> list[TelemetryEvent]:
        rng = random.Random(request.seed)
        handler = getattr(self, f"_generate_{request.scenario.value}")
        return handler(request, context, rng)

    # ── normal ────────────────────────────────────────────────────────────

    def _generate_normal(self, request, context, rng) -> list[TelemetryEvent]:
        events = []
        for i in range(request.num_events):
            sent_at = context.clock.now()
            voltage, current, temperature, soc = _baseline(rng, context.profile)
            events.append(self._make_event(context, request, i, sent_at, sent_at, voltage, current, temperature, soc))
        return events

    # ── delayed_telemetry ────────────────────────────────────────────────

    def _generate_delayed_telemetry(self, request, context, rng) -> list[TelemetryEvent]:
        delay = request.delay_seconds or 60
        events = []
        for i in range(request.num_events):
            sent_at = context.clock.now()
            timestamp = sent_at - timedelta(seconds=delay)
            voltage, current, temperature, soc = _baseline(rng, context.profile)
            events.append(self._make_event(context, request, i, timestamp, sent_at, voltage, current, temperature, soc))
        return events

    # ── duplicate_packet ─────────────────────────────────────────────────

    def _generate_duplicate_packet(self, request, context, rng) -> list[TelemetryEvent]:
        events = []
        last_payload: tuple[float, float, float, float] | None = None
        last_sequence: int | None = None
        for i in range(request.num_events):
            sent_at = context.clock.now()
            if i == 1 and last_payload is not None:
                # Duplicate: same sequence number and canonical payload as event 0.
                voltage, current, temperature, soc = last_payload
                sequence_number = last_sequence
            else:
                voltage, current, temperature, soc = _baseline(rng, context.profile)
                sequence_number = _SEQUENCE_START + i
            if i == 0:
                last_payload = (voltage, current, temperature, soc)
                last_sequence = sequence_number
            events.append(
                self._make_event(
                    context, request, i, sent_at, sent_at, voltage, current, temperature, soc,
                    sequence_number=sequence_number,
                )
            )
        return events

    # ── out_of_range ─────────────────────────────────────────────────────

    def _generate_out_of_range(self, request, context, rng) -> list[TelemetryEvent]:
        events = []
        violations = ["voltage", "temperature", "current"]
        for i in range(request.num_events):
            sent_at = context.clock.now()
            voltage, current, temperature, soc = _baseline(rng, context.profile)
            violation = violations[i % len(violations)]
            if violation == "voltage":
                voltage = context.profile.maximum_valid_voltage_v + rng.uniform(1.0, 10.0)
            elif violation == "temperature":
                temperature = context.profile.maximum_valid_temperature_c + rng.uniform(1.0, 10.0)
            else:
                current = context.profile.maximum_absolute_current_a + rng.uniform(1.0, 50.0)
            events.append(self._make_event(context, request, i, sent_at, sent_at, voltage, current, temperature, soc))
        return events

    # ── missing_timestamp ────────────────────────────────────────────────

    def _generate_missing_timestamp(self, request, context, rng) -> list[TelemetryEvent]:
        events = []
        for i in range(request.num_events):
            sent_at = context.clock.now()
            voltage, current, temperature, soc = _baseline(rng, context.profile)
            events.append(
                self._make_event(context, request, i, None, sent_at, voltage, current, temperature, soc)
            )
        return events

    # ── spoofed_identity ─────────────────────────────────────────────────

    def _generate_spoofed_identity(self, request, context, rng) -> list[TelemetryEvent]:
        spoofed_id = make_spoofed_battery_id(request.scenario.value, request.seed, context.registered_battery_id)
        events = []
        for i in range(request.num_events):
            sent_at = context.clock.now()
            voltage, current, temperature, soc = _baseline(rng, context.profile)
            events.append(
                self._make_event(
                    context, request, i, sent_at, sent_at, voltage, current, temperature, soc,
                    battery_id_override=spoofed_id,
                )
            )
        return events

    # ── replay_attack ────────────────────────────────────────────────────

    def _generate_replay_attack(self, request, context, rng) -> list[TelemetryEvent]:
        events: list[TelemetryEvent] = []
        original: TelemetryEvent | None = None
        # Replays must land clearly outside the replay window so the detector's
        # age-based check is unambiguous — a real replay is "much later", not
        # one clock tick later, so we compute sent_at explicitly rather than
        # relying on the injected clock's (small, uniform) step size.
        replay_gap = timedelta(seconds=request.replay_window_seconds + 30)
        for i in range(request.num_events):
            if i == 0:
                sent_at = context.clock.now()
                voltage, current, temperature, soc = _baseline(rng, context.profile)
                event = self._make_event(context, request, i, sent_at, sent_at, voltage, current, temperature, soc)
                original = event
            else:
                assert original is not None
                sent_at = original.timestamp + replay_gap + timedelta(seconds=i)
                event = self._make_event(
                    context, request, i, original.timestamp, sent_at,
                    original.voltage_v, original.current_a, original.temperature_c, original.soc_percent,
                    sequence_number=original.sequence_number,
                    replay_of_event_id=original.event_id,
                )
            events.append(event)
        return events

    # ── shared event builder ─────────────────────────────────────────────

    def _make_event(
        self, context: RunContext, request: GenerateEventsRequest, index: int,
        timestamp, sent_at, voltage, current, temperature, soc,
        *, sequence_number: int | None = None,
        battery_id_override: str | None = None,
        replay_of_event_id: str | None = None,
    ) -> TelemetryEvent:
        return TelemetryEvent(
            event_id=make_event_id(context.run_id, index),
            run_id=context.run_id,
            registered_battery_id=context.registered_battery_id,
            battery_id=battery_id_override or context.registered_battery_id,
            sequence_number=sequence_number if sequence_number is not None else _SEQUENCE_START + index,
            timestamp=timestamp,
            sent_at=sent_at,
            voltage_v=voltage,
            current_a=current,
            temperature_c=temperature,
            soc_percent=soc,
            scenario=request.scenario,
            replay_of_event_id=replay_of_event_id,
        )
