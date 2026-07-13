import pytest
from pydantic import ValidationError

from sim_003.models.requests import GenerateEventsRequest


def test_battery_id_requires_sim_prefix():
    with pytest.raises(ValidationError):
        GenerateEventsRequest(battery_id="BID-20260710-001", scenario="normal")


def test_battery_id_accepts_sim_prefix():
    req = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal")
    assert req.battery_id == "SIM-BAT-001"


@pytest.mark.parametrize("num_events", [1, 1000])
def test_num_events_boundaries_accepted(num_events):
    req = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=num_events)
    assert req.num_events == num_events


@pytest.mark.parametrize("num_events", [0, 1001])
def test_num_events_out_of_bounds_rejected(num_events):
    with pytest.raises(ValidationError):
        GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", num_events=num_events)


@pytest.mark.parametrize("delay", [1, 300])
def test_delay_seconds_boundaries_accepted(delay):
    req = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="delayed_telemetry", delay_seconds=delay)
    assert req.delay_seconds == delay


@pytest.mark.parametrize("delay", [0, 301])
def test_delay_seconds_out_of_bounds_rejected(delay):
    with pytest.raises(ValidationError):
        GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="delayed_telemetry", delay_seconds=delay)


@pytest.mark.parametrize("qos", [0, 1, 2])
def test_qos_valid_values_accepted(qos):
    req = GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", qos=qos)
    assert req.qos == qos


@pytest.mark.parametrize("qos", [-1, 3])
def test_qos_invalid_values_rejected(qos):
    with pytest.raises(ValidationError):
        GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="normal", qos=qos)


def test_unknown_fields_rejected():
    """Clients must not be able to set organisation_id, broker host, or simulated=false."""
    with pytest.raises(ValidationError):
        GenerateEventsRequest(
            battery_id="SIM-BAT-001", scenario="normal", organisation_id="not-allowed",
        )


def test_scenario_must_be_one_of_seven_canonical_values():
    with pytest.raises(ValidationError):
        GenerateEventsRequest(battery_id="SIM-BAT-001", scenario="not_a_real_scenario")
