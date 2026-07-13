"""Mosquitto integration tests — require a running local broker.

Run with:
    infra/sim-003-mosquitto/scripts/start-native.sh &
    cd services/sim-003-mqtt && .venv/bin/python -m pytest -m integration tests/integration -q

These are NOT run as part of the default unit-test command — ordinary unit
tests use InMemoryTransport and never depend on a live broker.
"""
from __future__ import annotations

import asyncio

import aiomqtt
import pytest

from sim_003.core.orchestrator import run_scenario
from sim_003.core.repository import InMemoryRunRepository
from sim_003.models.requests import GenerateEventsRequest
from sim_003.models.runs import RunStatus
from sim_003.settings import Settings, reset_settings_cache
from sim_003.transports.base import PublishMessage
from sim_003.transports.mosquitto import MosquittoConnectionError, MosquittoTransport

pytestmark = pytest.mark.integration


@pytest.fixture
def settings() -> Settings:
    reset_settings_cache()
    s = Settings()
    if not s.mqtt_publisher_password:
        pytest.skip("No local Mosquitto credentials configured in .env — run generate-credentials.sh")
    return s


@pytest.fixture
async def transport(settings):
    t = MosquittoTransport(settings)
    try:
        await t.connect()
    except MosquittoConnectionError as exc:
        pytest.skip(f"Local Mosquitto broker not reachable: {exc}")
    yield t
    await t.disconnect()


async def test_broker_health_publisher_and_subscriber_authenticate(transport):
    assert transport.is_connected is True


async def test_anonymous_client_is_rejected(settings):
    async def _attempt() -> None:
        async with aiomqtt.Client(hostname=settings.mqtt_broker_host, port=settings.mqtt_broker_port) as client:
            await client.subscribe("ev-engineer/v1/sim/demo-organisation/battery/+/telemetry")

    with pytest.raises(aiomqtt.MqttError):
        await asyncio.wait_for(_attempt(), timeout=5)


async def test_qos1_publish_is_acknowledged_and_observed(transport):
    topic = "ev-engineer/v1/sim/demo-organisation/battery/SIM-BAT-999/telemetry"
    received: list[bytes] = []

    async def handler(payload: bytes, topic_str: str) -> None:
        received.append(payload)

    sub = await transport.subscribe(topic, handler)
    await asyncio.sleep(0.2)  # allow SUBACK to land before publishing

    receipt = await transport.publish(PublishMessage(topic=topic, payload=b'{"hello":"world"}', qos=1, retain=False))
    assert receipt.status.value == "ACKNOWLEDGED"

    for _ in range(20):
        if received:
            break
        await asyncio.sleep(0.1)

    assert received == [b'{"hello":"world"}']
    await sub.unsubscribe()


async def test_retain_flag_is_always_false(transport):
    topic = "ev-engineer/v1/sim/demo-organisation/battery/SIM-BAT-RETAIN/telemetry"
    message = PublishMessage(topic=topic, payload=b"{}", qos=1, retain=False)
    assert message.retain is False
    receipt = await transport.publish(message)
    assert receipt.status.value == "ACKNOWLEDGED"


async def test_unauthorised_topic_publish_and_subscribe_are_denied_by_acl(transport):
    """The publisher/subscriber credentials are ACL-scoped to
    ev-engineer/v1/sim/demo-organisation/... only (see acl.example). A
    topic under a different organisation must not be delivered, even
    though QoS1 publish may still return ACKNOWLEDGED at the protocol
    level — Mosquitto acknowledges the PUBLISH packet before applying the
    write ACL, so the *absence of delivery* is the real signal, not the ack.
    """
    foreign_topic = "ev-engineer/v1/sim/another-organisation/battery/SIM-BAT-ACL/telemetry"
    received: list[bytes] = []

    async def handler(payload: bytes, topic_str: str) -> None:
        received.append(payload)

    sub = await transport.subscribe(foreign_topic, handler)
    await asyncio.sleep(0.2)
    await transport.publish(PublishMessage(topic=foreign_topic, payload=b"{}", qos=1, retain=False))
    await asyncio.sleep(0.5)

    assert received == []  # ACL denies both the foreign publish and the foreign subscribe
    await sub.unsubscribe()


async def test_disconnect_and_reconnect(settings):
    t = MosquittoTransport(settings)
    await t.connect()
    assert t.is_connected is True
    await t.disconnect()
    assert t.is_connected is False
    await t.connect()
    assert t.is_connected is True
    await t.disconnect()


async def test_full_run_reconciles_generated_published_observed_over_real_broker(settings):
    t = MosquittoTransport(settings)
    await t.connect()
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-002", scenario="normal", num_events=10, seed=7)

    run = await run_scenario(request, organisation_slug="demo-organisation", transport=t, repository=repo, settings=settings)
    await t.disconnect()

    assert run.status == RunStatus.passed
    assert run.generated_count == run.published_count == run.observed_count == 10
    assert run.broker_connected is True


async def test_no_traffic_sent_to_non_loopback_endpoint_in_local_only_mode(settings):
    settings.mqtt_broker_host = "203.0.113.10"  # TEST-NET-3, definitely non-loopback
    with pytest.raises(ValueError):
        MosquittoTransport(settings)
