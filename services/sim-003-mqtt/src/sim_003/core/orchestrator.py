"""Runtime orchestration: generate -> publish -> observe -> detect -> reconcile.

This is the only place that wires the independent generator and detector
together through a real transport round trip. Observed (not merely
generated) events drive the run summary, per the requirement that a run's
result reflects what was actually delivered and received, not just produced.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from pydantic import ValidationError

from ..detection.engine import DetectionState, TelemetryDetectionEngine
from ..models.events import Anomaly, TelemetryEvent
from ..models.requests import GenerateEventsRequest
from ..models.runs import Observation, ObservedEvent, PublishReceipt, PublishStatus, RunStatus, SimulationRun
from ..settings import Settings
from ..transports.base import EventTransport, PublishMessage
from .generator import RunContext, TelemetryScenarioFactory
from .ids import make_run_id
from .profiles import get_profile
from .repository import RunRepository
from .topics import build_telemetry_topic
from .clock import FixedClock

RECONCILE_TIMEOUT_SECONDS = 10.0

# Fixed reference epoch so identical (scenario, seed, battery_id) inputs
# always produce byte-identical timestamps, regardless of wall-clock time.
_REFERENCE_EPOCH = datetime(2026, 1, 1, tzinfo=timezone.utc)

_generator = TelemetryScenarioFactory()
_detector = TelemetryDetectionEngine()


async def run_scenario(
    request: GenerateEventsRequest,
    *,
    organisation_slug: str,
    transport: EventTransport,
    repository: RunRepository,
    settings: Settings,
    event_queue: "asyncio.Queue | None" = None,
) -> SimulationRun:
    """event_queue, if provided, receives each ObservedEvent as it is
    detected (for SSE streaming), followed by a final `None` sentinel once
    the run completes — regardless of pass/fail/degraded outcome."""
    profile = get_profile(request.profile_id)
    run_id = make_run_id(request.scenario.value, request.seed, request.battery_id)
    topic = build_telemetry_topic(
        topic_root=settings.mqtt_topic_root, organisation_slug=organisation_slug, battery_id=request.battery_id,
    )

    run = SimulationRun(
        run_id=run_id,
        organisation_slug=organisation_slug,
        battery_id=request.battery_id,
        scenario=request.scenario,
        status=RunStatus.running,
        transport=transport.mode,
        broker_connected=transport.is_connected,
        topic=topic,
        seed=request.seed,
        profile_id=profile.profile_id,
        started_at=datetime.now(timezone.utc),
    )
    await repository.create(run)

    detection_state = DetectionState(replay_window_seconds=request.replay_window_seconds)
    observed: list[ObservedEvent] = []
    invalid_schema_count = 0
    pending_receipts: dict[str, PublishReceipt] = {}
    done = asyncio.Event()

    async def handler(payload: bytes, topic_str: str) -> None:
        nonlocal invalid_schema_count
        received_at = datetime.now(timezone.utc)
        try:
            event = TelemetryEvent.model_validate_json(payload)
        except ValidationError:
            invalid_schema_count += 1
            if invalid_schema_count + len(observed) >= request.num_events:
                done.set()
            return

        detection = _detector.evaluate(event, detection_state, profile)
        receipt = pending_receipts.get(event.event_id) or PublishReceipt(status=PublishStatus.acknowledged)
        observed_event = ObservedEvent(
            topic=topic_str,
            qos=request.qos,
            payload=event,
            publish=receipt,
            observation=Observation(
                received_at=received_at,
                schema_valid=True,
                anomalies=detection.anomalies,
                primary_anomaly=detection.primary_anomaly,
                anomaly_detail=detection.anomaly_detail,
            ),
            detection=detection,
        )
        observed.append(observed_event)
        run.events = observed
        run.observed_count = len(observed)
        if event_queue is not None:
            event_queue.put_nowait(observed_event)
        if len(observed) + invalid_schema_count >= request.num_events:
            done.set()

    subscription = await transport.subscribe(topic, handler)

    clock = FixedClock(start=_REFERENCE_EPOCH, step=timedelta(seconds=1))
    context = RunContext(run_id=run_id, registered_battery_id=request.battery_id, profile=profile, clock=clock)
    events = _generator.generate(request, context)
    generated_count = len(events)
    published_count = 0

    for event in events:
        payload_bytes = event.model_dump_json().encode("utf-8")
        if request.publish:
            receipt = await transport.publish(
                PublishMessage(topic=topic, payload=payload_bytes, qos=request.qos, retain=False)
            )
        else:
            receipt = PublishReceipt(status=PublishStatus.skipped)
        pending_receipts[event.event_id] = receipt
        if receipt.status == PublishStatus.acknowledged:
            published_count += 1

    reconciled = True
    if request.publish and generated_count > 0:
        try:
            await asyncio.wait_for(done.wait(), timeout=RECONCILE_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            reconciled = False

    await subscription.unsubscribe()

    anomaly_counts: dict[str, int] = {}
    for observed_event in observed:
        for anomaly in observed_event.detection.anomalies:
            if anomaly != Anomaly.none:
                anomaly_counts[anomaly.value] = anomaly_counts.get(anomaly.value, 0) + 1

    run.generated_count = generated_count
    run.published_count = published_count
    run.observed_count = len(observed)
    run.valid_count = len(observed)
    run.invalid_schema_count = invalid_schema_count
    run.anomaly_counts = anomaly_counts
    run.events = observed
    run.completed_at = datetime.now(timezone.utc)
    run.broker_connected = transport.is_connected

    if not request.publish:
        run.status = RunStatus.passed
    elif not transport.is_connected:
        run.status = RunStatus.failed
    elif reconciled and generated_count == published_count == run.observed_count:
        run.status = RunStatus.passed
    else:
        run.status = RunStatus.degraded

    if event_queue is not None:
        event_queue.put_nowait(None)

    return run
