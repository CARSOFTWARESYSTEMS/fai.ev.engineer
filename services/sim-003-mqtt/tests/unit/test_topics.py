import pytest

from sim_003.core.topics import InvalidTopicSegmentError, build_telemetry_topic, validate_segment


def test_builds_canonical_topic():
    topic = build_telemetry_topic(
        topic_root="ev-engineer/v1/sim", organisation_slug="demo-organisation", battery_id="SIM-BAT-001",
    )
    assert topic == "ev-engineer/v1/sim/demo-organisation/battery/SIM-BAT-001/telemetry"


@pytest.mark.parametrize("bad", ["+", "#", "a+b", "a#b", "", "a/b", "..", "a..b", "a\x00b", "a\nb"])
def test_rejects_dangerous_segments(bad):
    with pytest.raises(InvalidTopicSegmentError):
        validate_segment(bad, field_name="test")


def test_rejects_excessively_long_segment():
    with pytest.raises(InvalidTopicSegmentError):
        validate_segment("a" * 100, field_name="test")


def test_rejects_wildcard_in_battery_id_via_topic_builder():
    with pytest.raises(InvalidTopicSegmentError):
        build_telemetry_topic(topic_root="ev-engineer/v1/sim", organisation_slug="demo-organisation", battery_id="#")


def test_rejects_wildcard_in_organisation_slug():
    with pytest.raises(InvalidTopicSegmentError):
        build_telemetry_topic(topic_root="ev-engineer/v1/sim", organisation_slug="+", battery_id="SIM-BAT-001")


def test_accepts_valid_hyphen_and_underscore_segments():
    topic = build_telemetry_topic(
        topic_root="ev-engineer/v1/sim", organisation_slug="demo_org-1", battery_id="SIM-BAT_001",
    )
    assert "demo_org-1" in topic and "SIM-BAT_001" in topic
