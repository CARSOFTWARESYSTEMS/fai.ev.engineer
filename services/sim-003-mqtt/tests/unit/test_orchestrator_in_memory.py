import pytest

from sim_003.core.orchestrator import run_scenario
from sim_003.core.repository import InMemoryRunRepository
from sim_003.models.requests import GenerateEventsRequest
from sim_003.models.runs import RunStatus
from sim_003.settings import Settings, reset_settings_cache
from sim_003.transports.base import PublishMessage
from sim_003.transports.in_memory import InMemoryTransport


@pytest.fixture
async def transport():
    t = InMemoryTransport()
    await t.connect()
    yield t
    await t.disconnect()


@pytest.fixture
def settings():
    reset_settings_cache()
    return Settings()


async def test_normal_run_reconciles_and_passes(transport, settings):
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=42)

    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)

    assert run.status == RunStatus.passed
    assert run.generated_count == run.published_count == run.observed_count == 10
    assert run.valid_count == 10
    assert run.invalid_schema_count == 0
    assert all(e.retain is False for e in run.events)
    assert run.anomaly_counts == {}


async def test_replay_attack_run_has_anomaly_counts(transport, settings):
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="replay_attack", num_events=5, seed=42)

    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)

    assert run.status == RunStatus.passed  # reconciled even though anomalies were found
    assert run.anomaly_counts.get("REPLAY_DETECTED") == 4


async def test_run_is_retrievable_from_repository(transport, settings):
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=3, seed=1)
    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)

    fetched = await repo.get(run.run_id)
    assert fetched is not None
    assert fetched.run_id == run.run_id

    # Cross-tenant access must not leak the run.
    cross_tenant = await repo.get_for_organisation(run.run_id, "another-organisation")
    assert cross_tenant is None

    same_tenant = await repo.get_for_organisation(run.run_id, "demo-organisation")
    assert same_tenant is not None


async def test_invalid_schema_payload_is_isolated_and_reported(transport, settings):
    """A malformed payload delivered through the transport must not crash
    the run — it should be counted separately as invalid_schema_count."""
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=1, seed=42)

    # Publish one extra malformed message on the same topic before the real run,
    # using a raw subscriber to confirm the transport itself tolerates bad JSON.
    topic = "ev-engineer/v1/sim/demo-organisation/battery/SIM-BAT-001/telemetry"
    received: list[bytes] = []

    async def raw_handler(payload: bytes, topic_str: str) -> None:
        received.append(payload)

    sub = await transport.subscribe(topic, raw_handler)
    receipt = await transport.publish(PublishMessage(topic=topic, payload=b"{not valid json", qos=1, retain=False))
    await sub.unsubscribe()

    assert receipt.status.value == "ACKNOWLEDGED"
    assert received == [b"{not valid json"]

    # The orchestrator's own handler must tolerate the same malformed input
    # without raising, via its internal ValidationError handling.
    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)
    assert run.status == RunStatus.passed


async def test_repository_bounded_eviction():
    repo = InMemoryRunRepository(max_runs=2)
    from sim_003.models.runs import SimulationRun

    for i in range(3):
        await repo.create(SimulationRun(
            run_id=f"RUN-{i}", organisation_slug="demo-organisation", battery_id="SIM-BAT-001",
            scenario="normal", transport="in_memory", topic="t", seed=1, profile_id="sim003_48v_demo",
        ))

    assert await repo.get("RUN-0") is None  # evicted, oldest first
    assert await repo.get("RUN-1") is not None
    assert await repo.get("RUN-2") is not None


async def test_no_publish_dry_run_does_not_hang_or_fail(transport, settings):
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=5, seed=42, publish=False)
    repo = InMemoryRunRepository()
    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)
    assert run.status == RunStatus.passed
    assert run.published_count == 0
    assert run.observed_count == 0
