# ADR-0001 — Source requirement reconciliation

**Status:** Accepted
**Date:** 2026-07-13

The original SIM-003 requirement (as attached in the master implementation prompt) contained seven internal gaps/contradictions. Each is resolved here exactly as directed, with the concrete implementation location noted.

| # | Gap | Resolution | Where |
|---|---|---|---|
| 1 | Sample input Battery ID and sample output topic Battery ID didn't match. | The topic is always built server-side from the canonical, already-validated request `battery_id` — never from a separately-supplied or client-echoed value. | `core/topics.py::build_telemetry_topic`, called once per run in `core/orchestrator.py`. |
| 2 | QoS required but missing from the sample output envelope. | `qos` is a required field on `ObservedEvent` and on the request; every event and run result carries it. | `models/runs.py::ObservedEvent.qos` |
| 3 | API section named `/generate-events`; weekly plan mentioned `/simulate`. | `/generate-events` is canonical. No prior `/simulate` route existed in this codebase to preserve as an alias, so none was added — adding an unused alias would be speculative, not compatibility-preserving. | `api/routes.py` |
| 4 | Streamlit and FastAPI flows unspecified. | Implemented per the "FAI.EV.ENGINEER Customer UI" / "Streamlit Developer Diagnostic UI" sections of the master prompt — see `docs/architecture.md` and `README.md`. | `api/`, `streamlit_app/app.py` |
| 5 | Original requirement said no real network traffic; confirmed decision integrates local Mosquitto. | Loopback-only enforced at the `Settings` level (`enforce_local_only()` raises for any non-127.0.0.1/::1 broker host) and independently verified by `MosquittoTransport.__init__` calling the same check. | `settings.py`, `transports/mosquitto.py`, tested in `tests/integration/test_mosquitto.py::test_no_traffic_sent_to_non_loopback_endpoint_in_local_only_mode` |
| 6 | Fixed 60V/60°C/500A thresholds implied a single hard-coded profile. | Thresholds live on `BatteryProfile`, referenced by `profile_id`; `sim003_48v_demo` is the only profile shipped in POC-003, but the generator/detector never hard-code the numbers — they always read `context.profile.maximum_*`. | `core/profiles.py` |
| 7 | Sample used a real-looking `BID-*` identifier. | Every generated identifier is namespaced `SIM-` (battery IDs) or `SIM-SPOOF-*` (spoofed-identity scenario only); `GenerateEventsRequest.battery_id` rejects anything without the `SIM-` prefix at the schema level. | `models/requests.py::validate_battery_id` |

## Additional reconciliations made during implementation (not in the original gap list)

- **Replay-vs-duplicate disambiguation**: the source requirement described both "duplicate packet" and "replay attack" as "same sequence number retransmitted," which is detection-ambiguous on age alone if a test clock only advances by small steps. Resolved by having the generator set the replayed event's `sent_at` explicitly to `original.timestamp + replay_window_seconds + 30s` (not via the injected clock's uniform step), so the detector's age-based replay-window check is unambiguous. See `core/generator.py::_generate_replay_attack` and ADR-0002.
- **Deterministic IDs, not random UUIDs, for events/runs**: needed so "same seed + same clock → identical output" holds for the *entire* event stream (including IDs), not just telemetry values — otherwise two runs with the same seed would still differ byte-for-byte on `event_id`/`run_id`. See `core/ids.py`.
