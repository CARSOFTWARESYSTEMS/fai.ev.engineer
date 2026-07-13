"""Bounded in-memory run repository for the POC.

Telemetry is never written to Firestore per the integration requirement —
this repository is process-local, capped, and ephemeral. A future milestone
may swap this for a persistent store behind the same Protocol.
"""
from __future__ import annotations

from collections import OrderedDict
from typing import Protocol

from ..models.runs import SimulationRun

_DEFAULT_MAX_RUNS = 200


class RunRepository(Protocol):
    async def create(self, run: SimulationRun) -> None: ...
    async def get(self, run_id: str) -> SimulationRun | None: ...
    async def get_for_organisation(self, run_id: str, organisation_slug: str) -> SimulationRun | None: ...


class InMemoryRunRepository:
    def __init__(self, max_runs: int = _DEFAULT_MAX_RUNS):
        self._max_runs = max_runs
        self._runs: OrderedDict[str, SimulationRun] = OrderedDict()

    async def create(self, run: SimulationRun) -> None:
        self._runs[run.run_id] = run
        self._runs.move_to_end(run.run_id)
        while len(self._runs) > self._max_runs:
            self._runs.popitem(last=False)

    async def get(self, run_id: str) -> SimulationRun | None:
        return self._runs.get(run_id)

    async def get_for_organisation(self, run_id: str, organisation_slug: str) -> SimulationRun | None:
        run = self._runs.get(run_id)
        if run is None or run.organisation_slug != organisation_slug:
            return None
        return run
