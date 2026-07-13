# SIM-003 Architecture

## Components

```
                    ┌─────────────────────────────────────────────┐
                    │            FAI.EV.ENGINEER (React)            │
                    │  /battery-trust/simulators/sim-003            │
                    │  sim003Client.ts — fetch + SSE + Firebase ID  │
                    └───────────────────────┬───────────────────────┘
                                             │ HTTPS (loopback dev: HTTP), Bearer <ID token>
                    ┌───────────────────────▼───────────────────────┐
                    │              FastAPI (api/app.py)              │
                    │  auth.py — verify token, resolve entitlement   │
                    │  routes.py — health/scenarios/runs/stream/...  │
                    └───────────────────────┬───────────────────────┘
                                             │
                    ┌───────────────────────▼───────────────────────┐
                    │        core/orchestrator.py (run_scenario)      │
                    │  generate → publish → observe → detect →        │
                    │  reconcile, mutating the shared SimulationRun    │
                    └──────┬──────────────────────────────┬──────────┘
                           │                              │
          ┌────────────────▼───────────┐   ┌──────────────▼────────────────┐
          │ core/generator.py            │   │ detection/engine.py            │
          │ TelemetryScenarioFactory      │   │ TelemetryDetectionEngine        │
          │ (7 deterministic scenarios)   │   │ + DetectionState (per-run)      │
          └────────────────────────────┘   └────────────────────────────────┘
                           │                              ▲
                    ┌──────▼──────────────────────────────┴──────┐
                    │        transports/ (EventTransport)          │
                    │  InMemoryTransport  |  MosquittoTransport     │
                    └──────────────────────┬───────────────────────┘
                                            │ loopback only, QoS 1, retain=false
                                   ┌────────▼────────┐
                                   │ Local Mosquitto   │
                                   │ 127.0.0.1:1883     │
                                   │ password + ACL     │
                                   └────────────────────┘

CLI (python -m sim_003) and Streamlit (streamlit_app/app.py) both call
core.orchestrator.run_scenario directly — no HTTP hop, no duplicated logic.
```

## Trust boundaries

1. **Browser ↔ FastAPI** — the only boundary that crosses a real network origin in the local dev topology. Protected by CORS (explicit allowlist, no wildcard-with-credentials) and Firebase ID token verification.
2. **FastAPI ↔ Firestore** (via `firebase-admin`) — resolves organisation membership/entitlement. Read-only from this service's perspective; it never writes to Firestore.
3. **FastAPI/CLI/Streamlit ↔ Mosquitto** — loopback-only (`127.0.0.1:1883`), password-authenticated, ACL-scoped per organisation namespace. The browser never talks to Mosquitto directly — there is no WebSocket listener.
4. **Generator → Detector** — an in-process boundary, not a network one, but treated as a trust boundary by design: the detector never reads `TelemetryEvent.scenario` or `replay_of_event_id` as its verdict, only as human-readable simulation metadata. It re-derives every finding from observable fields plus its own `DetectionState`.

## Data flow (one run)

1. Client submits `GenerateEventsRequest` (validated, `extra="forbid"`).
2. `run_scenario()` resolves the battery profile and builds the canonical topic **server-side** (`core/topics.py`) — the organisation slug comes from the verified entitlement, never from the request body.
3. `TelemetryScenarioFactory.generate()` produces the full event list deterministically from `(scenario, seed, battery_id)`, using a `FixedClock` anchored at a constant reference epoch — not wall-clock time — so identical inputs always produce byte-identical output regardless of when the run executes.
4. Each event is JSON-serialized and published through the transport at the configured QoS; `retain` is always `false`.
5. The transport's subscriber handler independently validates the payload against `TelemetryEvent` (Pydantic) and runs it through `TelemetryDetectionEngine.evaluate()`.
6. Observed events accumulate on the shared `SimulationRun` object (repository stores it by reference, so polling `GET /runs/{id}` and the SSE stream both see live updates without a separate cache).
7. Once `generated == published == observed` (or a timeout elapses), the run's terminal status is set: `PASSED` (reconciled), `DEGRADED` (published but not fully observed/reconciled in time), or `FAILED` (transport disconnected or dry-run with generated_count 0).
8. Evidence (`evidence/export.py`) is built from the *observed* events, not the merely-generated ones.

## Adapter boundaries (for future milestones)

- **`EventTransport`** (`transports/base.py`) — `InMemoryTransport` today; a future customer-network MQTT profile or cloud broker adapter implements the same three methods (`connect`/`publish`/`subscribe`) without touching `core/orchestrator.py`.
- **`RunRepository`** (`core/repository.py`) — `InMemoryRunRepository` (bounded, process-local) today; a persistent store (e.g. a time-series DB for real pilot telemetry) implements the same `create`/`get`/`get_for_organisation` methods.
- **`EntitlementRepository`** (`api/auth.py` Protocol, `api/firestore_entitlement.py` implementation) — swappable if the entitlement backing store ever changes.
- **SIM-006 / SIM-004 / SIM-010 extension points**: `ObservedEvent.detection` (a `DetectionResult`) is the stable contract a future SIM-006 Detection Rule Simulator would consume to compute hard-gate decisions; `RunResult` is already shaped as `simulator.run.v1`, the SIM-010-compatible envelope, so a future integration harness can drive this service exactly like the other nine simulators without a bespoke adapter.

## Why generator and detector are separate modules

A scenario factory that also decides "this is an anomaly" would make the detector's PASS/FAIL verdict trivially correct by construction — it would prove nothing about detection quality. Keeping them separate, with the detector deriving findings only from observable fields (timestamp/sent_at age, sequence-number history, registered-vs-payload battery_id, profile thresholds), means the detection logic is independently testable and the "is this really being detected, or just labelled" question always has a real answer — visible in `tests/unit/test_generator_scenarios.py`, which asserts on `detector.evaluate()` output, never on `event.scenario`.
