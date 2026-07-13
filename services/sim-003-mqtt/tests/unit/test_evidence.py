import json

import pytest

from sim_003.core.orchestrator import run_scenario
from sim_003.core.repository import InMemoryRunRepository
from sim_003.evidence.export import evidence_to_html, evidence_to_json
from sim_003.models.requests import GenerateEventsRequest
from sim_003.settings import Settings, reset_settings_cache
from sim_003.transports.in_memory import InMemoryTransport

KNOWN_LIMITATIONS = ["Synthetic data only.", "Localhost plaintext MQTT in POC mode."]


@pytest.fixture
async def completed_run():
    reset_settings_cache()
    settings = Settings()
    transport = InMemoryTransport()
    await transport.connect()
    repo = InMemoryRunRepository()
    request = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=3, seed=42)
    run = await run_scenario(request, organisation_slug="demo-organisation", transport=transport, repository=repo, settings=settings)
    await transport.disconnect()
    return run.to_run_result()


async def test_json_evidence_is_valid_and_marks_simulated(completed_run):
    payload = evidence_to_json(completed_run, organisation_reference="demo-organisation", known_limitations=KNOWN_LIMITATIONS)
    parsed = json.loads(payload)  # must not raise

    assert parsed["simulated"] is True
    assert parsed["classification"] == "SYNTHETIC_POC"
    assert parsed["contract_version"] == "simulator.run.v1"
    assert parsed["reconciled"] is True
    assert len(parsed["events"]) == 3


async def test_html_evidence_escapes_injected_content(completed_run):
    html = evidence_to_html(completed_run, organisation_reference="<script>alert(1)</script>", known_limitations=KNOWN_LIMITATIONS)

    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html
    assert "EDUCATIONAL SIMULATION ONLY" in html
    assert "<script src=" not in html  # no third-party scripts loaded
