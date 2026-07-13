import os

import pytest

os.environ.setdefault("SIM003_TRANSPORT", "in_memory")
os.environ.setdefault("SIM003_POC_LOCAL_ONLY", "true")
os.environ.setdefault("MQTT_BROKER_HOST", "127.0.0.1")

from sim_003.core.repository import InMemoryRunRepository  # noqa: E402
from sim_003.settings import Settings, reset_settings_cache  # noqa: E402
from sim_003.transports.in_memory import InMemoryTransport  # noqa: E402


@pytest.fixture
def settings() -> Settings:
    reset_settings_cache()
    return Settings()


@pytest.fixture
def repository() -> InMemoryRunRepository:
    return InMemoryRunRepository()


@pytest.fixture
async def in_memory_transport() -> InMemoryTransport:
    transport = InMemoryTransport()
    await transport.connect()
    yield transport
    await transport.disconnect()


def make_request(**overrides):
    from sim_003.models.requests import GenerateEventsRequest

    defaults = dict(battery_id="SIM-BAT-001", scenario="normal", num_events=10, seed=42)
    defaults.update(overrides)
    return GenerateEventsRequest(**defaults)
