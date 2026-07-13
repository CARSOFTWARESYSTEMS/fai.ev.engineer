from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sse_starlette.sse import EventSourceResponse

from ..core.ids import make_run_id
from ..core.orchestrator import run_scenario
from ..core.profiles import list_profiles
from ..core.repository import InMemoryRunRepository
from ..evidence.export import evidence_to_html, evidence_to_json
from ..models.events import Scenario
from ..models.requests import GenerateEventsRequest
from ..settings import Settings
from ..transports.base import EventTransport
from .auth import AuthContext, get_auth_context
from .deps import get_repository, get_settings_dep, get_transport

router = APIRouter(prefix="/api/v1/simulators/sim-003", tags=["SIM-003"])

_KNOWN_LIMITATIONS = [
    "All data is synthetic — EDUCATIONAL_SIMULATION_ONLY.",
    "Local plaintext MQTT on loopback only — not acceptable for remote/customer deployment.",
    "No production PKI, fleet-scale certificate provisioning, or device registry.",
    "Run history is bounded, in-memory, and process-local — not persisted to Firestore.",
    "No proprietary BMS protocol support.",
    "No physical validation against a real battery/BMS.",
    "No local or cloud LLM is called in this milestone.",
]

_SCENARIO_DESCRIPTIONS = {
    Scenario.normal: ("Valid telemetry with increasing sequence numbers and in-range values.", "No anomaly."),
    Scenario.delayed_telemetry: ("Timestamp older than sent_at by delay_seconds.", "DELAYED_TELEMETRY."),
    Scenario.duplicate_packet: ("A repeated sequence number with identical payload, delivered twice.", "DUPLICATE on the repeat."),
    Scenario.out_of_range: ("Voltage, temperature, or current beyond the active battery profile's limits.", "OUT_OF_RANGE with field-level findings."),
    Scenario.missing_timestamp: ("Event omits the timestamp field entirely.", "MISSING_TIMESTAMP."),
    Scenario.spoofed_identity: ("Payload battery_id differs from the registered battery_id.", "SPOOFED_IDENTITY."),
    Scenario.replay_attack: ("An old, previously observed packet retransmitted well outside the replay window.", "REPLAY_DETECTED."),
}


def _run_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")


@router.get("/health")
async def health(request: Request, settings: Settings = Depends(get_settings_dep)):
    transport: EventTransport = request.app.state.transport
    return {
        "status": "ok",
        "simulator_id": "SIM-003",
        "transport_mode": transport.mode,
        "broker_connected": transport.is_connected,
        "poc_local_only": settings.sim003_poc_local_only,
        "classification": "SYNTHETIC_POC",
    }


@router.get("/scenarios")
async def scenarios(_auth: AuthContext = Depends(get_auth_context)):
    return {
        "scenarios": [
            {
                "id": s.value,
                "description": _SCENARIO_DESCRIPTIONS[s][0],
                "expected_educational_outcome": _SCENARIO_DESCRIPTIONS[s][1],
            }
            for s in Scenario
        ]
    }


@router.get("/sample")
async def sample(_auth: AuthContext = Depends(get_auth_context)):
    return {
        "request": GenerateEventsRequest(battery_id="SIM-BAT-001", scenario=Scenario.normal, num_events=10).model_dump(),
        "profiles": [p.model_dump() for p in list_profiles()],
    }


@router.post("/generate-events")
async def generate_events(
    body: GenerateEventsRequest,
    auth: AuthContext = Depends(get_auth_context),
    transport: EventTransport = Depends(get_transport),
    repository: InMemoryRunRepository = Depends(get_repository),
    settings: Settings = Depends(get_settings_dep),
):
    run = await run_scenario(
        body, organisation_slug=auth.organisation_slug, transport=transport, repository=repository, settings=settings,
    )
    return run.to_run_result()


@router.post("/runs", status_code=status.HTTP_202_ACCEPTED)
async def start_run(
    body: GenerateEventsRequest,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
    transport: EventTransport = Depends(get_transport),
    repository: InMemoryRunRepository = Depends(get_repository),
    settings: Settings = Depends(get_settings_dep),
):
    run_id = make_run_id(body.scenario.value, body.seed, body.battery_id)
    if run_id in request.app.state.run_tasks:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This scenario/seed/battery combination is already running")

    queue: asyncio.Queue = asyncio.Queue()
    request.app.state.run_queues[run_id] = queue

    async def _execute():
        try:
            await run_scenario(
                body, organisation_slug=auth.organisation_slug, transport=transport,
                repository=repository, settings=settings, event_queue=queue,
            )
        finally:
            request.app.state.run_tasks.pop(run_id, None)

    task = asyncio.create_task(_execute())
    request.app.state.run_tasks[run_id] = task
    return {"run_id": run_id, "status": "RUNNING"}


@router.get("/runs/{run_id}")
async def get_run(
    run_id: str,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()
    return run.to_run_result()


@router.post("/runs/{run_id}/stop")
async def stop_run(
    run_id: str,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()

    task = request.app.state.run_tasks.get(run_id)
    if task is not None and not task.done():
        task.cancel()
        request.app.state.run_tasks.pop(run_id, None)
        from ..models.runs import RunStatus
        run.status = RunStatus.stopped
        run.completed_at = datetime.now(timezone.utc)

    return {"run_id": run_id, "status": run.status.value}  # idempotent — safe to call again


@router.get("/runs/{run_id}/events")
async def get_run_events(
    run_id: str,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()
    return {"run_id": run_id, "events": [e.model_dump(mode="json") for e in run.events]}


@router.get("/runs/{run_id}/stream")
async def stream_run(
    run_id: str,
    request: Request,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()

    queue: asyncio.Queue | None = request.app.state.run_queues.get(run_id)

    async def event_generator():
        if queue is None:
            # Run already completed and its queue was discarded — replay once.
            for observed_event in run.events:
                yield {"event": "observation", "data": observed_event.model_dump_json()}
            yield {"event": "completed", "data": run.to_run_result().model_dump_json()}
            return

        while True:
            if await request.is_disconnected():
                break
            item = await queue.get()
            if item is None:
                fresh = await repository.get(run_id)
                yield {"event": "completed", "data": fresh.to_run_result().model_dump_json() if fresh else "{}"}
                request.app.state.run_queues.pop(run_id, None)
                break
            yield {"event": "observation", "data": item.model_dump_json()}

    return EventSourceResponse(event_generator())


@router.get("/runs/{run_id}/evidence.json")
async def get_evidence_json(
    run_id: str,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()
    from fastapi.responses import Response

    payload = evidence_to_json(run.to_run_result(), organisation_reference=auth.organisation_slug, known_limitations=_KNOWN_LIMITATIONS)
    return Response(content=payload, media_type="application/json")


@router.get("/runs/{run_id}/evidence.html")
async def get_evidence_html(
    run_id: str,
    auth: AuthContext = Depends(get_auth_context),
    repository: InMemoryRunRepository = Depends(get_repository),
):
    run = await repository.get_for_organisation(run_id, auth.organisation_slug)
    if run is None:
        raise _run_not_found()
    from fastapi.responses import HTMLResponse

    payload = evidence_to_html(run.to_run_result(), organisation_reference=auth.organisation_slug, known_limitations=_KNOWN_LIMITATIONS)
    return HTMLResponse(content=payload)
