import time

import pytest


def test_health_excludes_secrets_and_is_unauthenticated(client):
    resp = client.get("/api/v1/simulators/sim-003/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["simulator_id"] == "SIM-003"
    assert "password" not in str(body).lower()
    assert "credential" not in str(body).lower()


def test_scenarios_returns_seven_canonical_scenarios(client):
    resp = client.get("/api/v1/simulators/sim-003/scenarios")
    assert resp.status_code == 200
    scenarios = resp.json()["scenarios"]
    assert len(scenarios) == 7
    ids = {s["id"] for s in scenarios}
    assert ids == {
        "normal", "delayed_telemetry", "duplicate_packet", "out_of_range",
        "missing_timestamp", "spoofed_identity", "replay_attack",
    }


def test_sample_returns_valid_request_example(client):
    resp = client.get("/api/v1/simulators/sim-003/sample")
    assert resp.status_code == 200
    assert resp.json()["request"]["battery_id"] == "SIM-BAT-001"


def test_generate_events_synchronous_flow_normal_scenario(client):
    resp = client.post(
        "/api/v1/simulators/sim-003/generate-events",
        json={"battery_id": "SIM-BAT-100", "scenario": "normal", "num_events": 5, "seed": 42},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "PASSED"
    assert body["generated_count"] == body["published_count"] == body["observed_count"] == 5
    assert body["simulated"] is True


def test_invalid_request_returns_structured_422(client):
    resp = client.post(
        "/api/v1/simulators/sim-003/generate-events",
        json={"battery_id": "NOT-RESERVED-PREFIX", "scenario": "normal"},
    )
    assert resp.status_code == 422
    assert "errors" in resp.json()


def test_runs_start_and_poll_to_completion(client):
    resp = client.post(
        "/api/v1/simulators/sim-003/runs",
        json={"battery_id": "SIM-BAT-101", "scenario": "normal", "num_events": 3, "seed": 7},
    )
    assert resp.status_code == 202
    run_id = resp.json()["run_id"]

    for _ in range(20):
        run_resp = client.get(f"/api/v1/simulators/sim-003/runs/{run_id}")
        if run_resp.json()["status"] == "PASSED":
            break
        time.sleep(0.05)
    else:
        pytest.fail("Run did not reach PASSED status in time")

    assert run_resp.json()["observed_count"] == 3


def test_unknown_run_id_returns_404_without_leaking_existence(client):
    resp = client.get("/api/v1/simulators/sim-003/runs/SIM003-RUN-DOES-NOT-EXIST")
    assert resp.status_code == 404


def test_stop_is_idempotent(client):
    start = client.post(
        "/api/v1/simulators/sim-003/runs",
        json={"battery_id": "SIM-BAT-102", "scenario": "normal", "num_events": 2, "seed": 1},
    )
    run_id = start.json()["run_id"]
    first = client.post(f"/api/v1/simulators/sim-003/runs/{run_id}/stop")
    second = client.post(f"/api/v1/simulators/sim-003/runs/{run_id}/stop")
    assert first.status_code == 200
    assert second.status_code == 200


def test_evidence_json_and_html_available_after_completion(client):
    resp = client.post(
        "/api/v1/simulators/sim-003/generate-events",
        json={"battery_id": "SIM-BAT-103", "scenario": "normal", "num_events": 2, "seed": 1},
    )
    run_id = resp.json()["run_id"]

    json_resp = client.get(f"/api/v1/simulators/sim-003/runs/{run_id}/evidence.json")
    assert json_resp.status_code == 200
    assert json_resp.json()["simulated"] is True

    html_resp = client.get(f"/api/v1/simulators/sim-003/runs/{run_id}/evidence.html")
    assert html_resp.status_code == 200
    assert "EDUCATIONAL SIMULATION ONLY" in html_resp.text


def test_cors_allows_configured_origin(client):
    resp = client.get(
        "/api/v1/simulators/sim-003/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_rejects_unexpected_origin(client):
    resp = client.get(
        "/api/v1/simulators/sim-003/health",
        headers={"Origin": "http://evil.example.com"},
    )
    assert resp.headers.get("access-control-allow-origin") is None


def test_oversized_request_body_rejected(client):
    huge_topic_prefix = "a" * (70 * 1024)
    resp = client.post(
        "/api/v1/simulators/sim-003/generate-events",
        json={"battery_id": "SIM-BAT-104", "scenario": "normal", "topic_prefix": huge_topic_prefix},
    )
    assert resp.status_code in (413, 422)
