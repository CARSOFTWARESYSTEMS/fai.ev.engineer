"""Deterministic ID helpers.

Event/run identifiers are derived from (seed, scenario, salt) rather than
random UUIDs so that "same seed + same clock -> identical output" holds for
the full event stream, not just the telemetry values. This is not a security
control — see settings.py / infra docs for where *actual* secure randomness
(broker credentials) is required and handled separately.
"""
from __future__ import annotations

import hashlib


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12].upper()


def make_run_id(scenario: str, seed: int, battery_id: str) -> str:
    return f"SIM003-RUN-{_hash(f'{scenario}:{seed}:{battery_id}:run')}"


def make_event_id(run_id: str, index: int) -> str:
    return f"SIM-EVT-{_hash(f'{run_id}:{index}')}"


def make_spoofed_battery_id(scenario: str, seed: int, battery_id: str) -> str:
    return f"SIM-SPOOF-{_hash(f'{scenario}:{seed}:{battery_id}:spoof')}"
