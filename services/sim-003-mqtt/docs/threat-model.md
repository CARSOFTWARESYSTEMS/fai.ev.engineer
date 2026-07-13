# SIM-003 Threat Model

**Scope:** the SIM-003 backend, its local Mosquitto broker, CLI, and Streamlit diagnostic. Not the FAI.EV.ENGINEER frontend or Firestore rules generally (those are covered by the main repository's existing security documentation).

## Assets

- Synthetic telemetry event content and detection results (low sensitivity — all data is fabricated).
- Local Mosquitto broker credentials (`local/passwd`, `local/acl`) — git-ignored, dev-only, but still credentials.
- Firebase ID tokens passed from the frontend (bearer tokens — real user identity).
- Run history (bounded, in-memory, process-local).

## Trust boundaries

See `docs/architecture.md` §Trust boundaries for the diagram. Summarised:

1. Browser ↔ FastAPI (network boundary, CORS + bearer token).
2. FastAPI ↔ Firestore (read-only entitlement lookup).
3. FastAPI/CLI/Streamlit ↔ Mosquitto (loopback, password + ACL).
4. Generator → Detector (in-process, but treated as untrusted-input boundary — the detector never trusts producer-supplied labels).

## Threats and controls

| Threat | Control | Verified by |
|---|---|---|
| Unauthorised simulator execution | Deny-by-default entitlement chain; missing/unknown state denies | `tests/api/test_auth.py` (8 tests) |
| Cross-organisation run access | `get_for_organisation()` scopes every run lookup; unknown/foreign run ID returns identical 404 | `tests/unit/test_orchestrator_in_memory.py::test_run_is_retrievable_from_repository` |
| Source identity spoofing | Detector compares `registered_battery_id` vs payload `battery_id` independently of any label | `tests/unit/test_generator_scenarios.py::test_spoofed_identity_uses_reserved_prefix_and_is_detected` |
| Replay | Sequence-history + age-vs-replay-window check, independent of scenario metadata | `tests/unit/test_generator_scenarios.py::test_tc_003_02_replay_attack` |
| Duplicate packets | Sequence-history check | `test_tc_003_03_duplicate_packet` |
| Stale/delayed data | Age-vs-tolerance check | `test_delayed_telemetry_detected_at_boundaries` |
| Out-of-range telemetry | Profile-threshold field-level findings | `test_tc_003_04_out_of_range` |
| Missing timestamps | Explicit null check, does not crash the stream | `test_tc_003_05_missing_timestamp` |
| Malformed JSON / schema confusion | `ValidationError` caught in the orchestrator's subscriber handler; isolated as `invalid_schema_count`, never crashes the run | `tests/unit/test_orchestrator_in_memory.py::test_invalid_schema_payload_is_isolated_and_reported` |
| Topic wildcard injection / namespace escape | Conservative segment allowlist rejects `+`, `#`, control chars, empty segments, traversal | `tests/unit/test_topics.py` (8 tests) |
| Broker credential leakage | Never returned by any API response, log line, or evidence export; `/health` excludes secrets | `tests/api/test_routes.py::test_health_excludes_secrets_and_is_unauthenticated` |
| Anonymous broker access | `allow_anonymous false`, password-file auth | `tests/integration/test_mosquitto.py::test_anonymous_client_is_rejected` (live broker) |
| Unauthorised publish/subscribe (wrong organisation topic) | Least-privilege ACL scoped per organisation namespace | `tests/integration/test_mosquitto.py::test_unauthorised_topic_publish_and_subscribe_are_denied_by_acl` (live broker) |
| Retained malicious telemetry | `retain` is hardcoded `False` on every publish; request schema has no way to set it `True` | `tests/integration/test_mosquitto.py::test_retain_flag_is_always_false` |
| Oversized payloads | 64 KiB request-body limit middleware | `tests/api/test_routes.py::test_oversized_request_body_rejected` |
| Excessive event count/rate | `num_events` bounded 1–1000 at the schema level | `tests/unit/test_requests_validation.py` |
| Connection floods / unbounded queues / excessive concurrency | 10-concurrent-run cap middleware; bounded run repository (200 runs, LRU eviction) | `tests/unit/test_orchestrator_in_memory.py::test_repository_bounded_eviction` |
| Unsafe CORS | Explicit origin allowlist from config, no wildcard-with-credentials | `tests/api/test_routes.py::test_cors_allows_configured_origin` / `test_cors_rejects_unexpected_origin` |
| Accidental non-loopback broker configuration | `Settings.enforce_local_only()` raises before any transport is constructed | `tests/integration/test_mosquitto.py::test_no_traffic_sent_to_non_loopback_endpoint_in_local_only_mode` |
| Log injection | No secrets logged; warnings log dev-bypass usage explicitly, no user-controlled strings interpolated into log format strings without structured logging | Code review (`api/auth.py`, `transports/mosquitto.py`) |

## Mandatory rules — status

- ✅ Every event has `simulated=true` (`TelemetryEvent.simulated: Literal[True]`).
- ✅ Every generated battery ID uses the reserved `SIM-` namespace (schema-enforced).
- ✅ Attack scenarios are labelled `EDUCATIONAL_SIMULATION_ONLY` on every event.
- ✅ No real-looking customer/device identities generated.
- ✅ No raw authentication tokens in logs or evidence (evidence export contains only `organisation_reference` string, never a token).
- ✅ Deterministic seeds used only for synthetic telemetry values/IDs, never for broker credentials (`infra/sim-003-mosquitto/scripts/generate-credentials.sh` uses `openssl rand`).
- ✅ Evidence exports escape HTML (`evidence/export.py::_esc`, verified against an injected `<img onerror=...>` payload in `tests/unit/test_evidence.py`).
- ✅ No arbitrary file paths from request parameters (the CLI's `--evidence-dir` is an operator-supplied local flag, not a network-facing parameter).

## Accepted POC risks (not production-ready)

- Plaintext MQTT on loopback — acceptable for local-only POC, **not** for any remote/customer deployment (would require TLS + certificate validation + customer-specific ACLs).
- Firestore entitlement lookup (`api/firestore_entitlement.py`) is implemented but not integration-tested against real Firebase credentials in this development environment — see known-limitations report.
- Dev auth bypass exists and, while loopback-gated, is still a code path that must never ship enabled in any shared/production configuration.
- No rate limiting beyond the concurrent-run cap; a determined loopback caller could still submit many sequential small runs.

## Production recommendations (future milestone)

- TLS + client certificate authentication for any non-loopback Mosquitto deployment.
- Move from a static local password file to a managed secrets store for broker credentials in any hosted profile.
- Add per-organisation rate limiting, not just a global concurrency cap.
- Replace the in-memory run repository with a persistent, access-controlled store before any pilot with real telemetry volume.
