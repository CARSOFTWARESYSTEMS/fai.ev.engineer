# SIM-003 — MQTT Telemetry Simulator

**SYNTHETIC POC — EDUCATIONAL_SIMULATION_ONLY.** No real battery, BMS, or network attack traffic is produced anywhere in this service.

Part of the Battery Trust Platform (`battery_trust` in FAI.EV.ENGINEER). Generates realistic synthetic BMS telemetry, publishes it through a local Mosquitto broker (or an in-memory fallback), observes it through a trusted subscriber, independently detects anomalies, and exports reproducible evidence.

```
Scenario configuration → Telemetry generator → MQTT publisher → Local Mosquitto → MQTT subscriber
  → Schema validator → Detection engine → UI/event stream → Evidence export
```

## Purpose

Answer, for one synthetic battery and one of seven telemetry scenarios: what would a BMS message stream carrying this condition look like on the wire, and does an independent detector correctly flag it — without needing real hardware, a real broker deployment, or real attack tooling.

## Architecture

- **Generator and detector are separate modules** (`core/generator.py`, `detection/engine.py`). The detector never trusts a producer-supplied anomaly label — it derives every finding from the observed event plus its own per-run `DetectionState` (sequence history, thresholds, registered-vs-payload identity).
- **`EventTransport` protocol** (`transports/base.py`) has two implementations: `InMemoryTransport` (deterministic, broker-free, used by all unit tests) and `MosquittoTransport` (real local broker via `aiomqtt`). Swapping between them requires no change to generator, detector, or orchestrator code.
- **`core/orchestrator.py`** is the only place that wires generate → publish → observe → detect → reconcile together through a real transport round trip.
- Three consumers share this same core: the **FastAPI** service (`api/`), the **CLI** (`python -m sim_003`), and the **Streamlit** developer diagnostic (`streamlit_app/app.py`). None of them re-implement scenario or detection logic.

See `docs/architecture.md` for the full component/trust-boundary diagram and `docs/adr/` for the specific decisions and source-requirement reconciliations.

## Prerequisites

- Python 3.10+
- Local Eclipse Mosquitto (`brew install mosquitto`) **or** Docker, for the real-broker path. Everything also runs with zero broker dependency via `SIM003_TRANSPORT=in_memory`.
- Node/Vite dev server already running for the FAI.EV.ENGINEER frontend (repository root), if you want to exercise the React page.

## Setup

```bash
cd services/sim-003-mqtt
python3 -m venv .venv
.venv/bin/pip install -e ".[dev,streamlit]"
cp .env.example .env   # then fill in local values — see below
```

## Local Mosquitto (native — the lightweight default on this machine)

```bash
cd infra/sim-003-mosquitto
./scripts/generate-credentials.sh      # writes local/passwd, local/acl, local/.env.generated (all git-ignored)
./scripts/start-native.sh &            # binds 127.0.0.1:1883 only, allow_anonymous false
# copy local/.env.generated values into services/sim-003-mqtt/.env
./scripts/stop-native.sh               # when done
```

Docker Compose is provided as the reproducible alternative (`infra/sim-003-mosquitto/docker-compose.yml`) — requires the same `generate-credentials.sh` step first. Do not run both at once (port 1883 conflict).

**The topic namespace is organisation-scoped and ACL-enforced** — `infra/sim-003-mosquitto/acl.example` only grants read/write on `ev-engineer/v1/sim/demo-organisation/...`. Publishing/subscribing to any other organisation's topic is silently denied by the broker (verified in `tests/integration/test_mosquitto.py::test_unauthorised_topic_publish_and_subscribe_are_denied_by_acl`). Use organisation slug `demo-organisation` for local testing unless you extend the ACL.

## Running the FastAPI service

```bash
.venv/bin/uvicorn sim_003.main:app --reload --port 8003
```

For local frontend development without real Firebase tokens, set `SIM003_DEV_AUTH_BYPASS=true` in `.env` — this is **only** accepted from loopback callers and is refused for any non-loopback request regardless of the flag (see `api/auth.py`). Never enable it outside local development.

## Running the CLI

```bash
.venv/bin/python -m sim_003 generate --battery-id SIM-BAT-001 --scenario normal --count 20
.venv/bin/python -m sim_003 generate --battery-id SIM-BAT-001 --scenario replay_attack --count 10 --transport mqtt
.venv/bin/python -m sim_003 generate --battery-id SIM-BAT-001 --scenario out_of_range --evidence-dir /tmp/sim003-evidence
```

`--help` documents every flag; all output is tagged synthetic/educational. Exit code is non-zero when the run does not reach `PASSED`.

## Running the Streamlit diagnostic

```bash
.venv/bin/streamlit run streamlit_app/app.py
```

Binds to `127.0.0.1` only by default (see `.streamlit/config.toml`) — **do not** override `server.address`. This is a developer diagnostic surface, not the customer product UI.

## Running the FAI React page

The customer-facing page lives in the main repository at `/battery-trust/simulators/sim-003` (see `src/products/battery_trust/simulators/sim_003/`). It talks to this backend over HTTP/SSE using `VITE_SIM003_API_BASE_URL` (defaults to `http://localhost:8003`) and authenticates with the signed-in user's Firebase ID token. Start both:

```bash
# terminal 1 — this service
cd services/sim-003-mqtt && .venv/bin/uvicorn sim_003.main:app --port 8003

# terminal 2 — repository root
npm run dev
```

Then sign in to FAI.EV.ENGINEER, open an entitled organisation, and navigate to Battery Trust Platform → Simulator Catalog → SIM-003.

## Seven scenarios

| Scenario | What it demonstrates | Detector verdict |
|---|---|---|
| `normal` | Valid, increasing-sequence telemetry | `NONE` |
| `delayed_telemetry` | `timestamp` older than `sent_at` by 1–300s | `DELAYED_TELEMETRY` |
| `duplicate_packet` | Repeated sequence number, identical payload, delivered again immediately | `DUPLICATE` |
| `out_of_range` | Voltage/temperature/current beyond the active battery profile | `OUT_OF_RANGE` with field-level findings |
| `missing_timestamp` | `timestamp` omitted entirely | `MISSING_TIMESTAMP` |
| `spoofed_identity` | Payload `battery_id` differs from `registered_battery_id` (uses reserved `SIM-SPOOF-*`) | `SPOOFED_IDENTITY` |
| `replay_attack` | Old packet retransmitted well outside the replay window, with `replay_of_event_id` | `REPLAY_DETECTED` |

## Tests

```bash
.venv/bin/python -m pytest tests/unit tests/api -q               # 71 tests, no broker required
.venv/bin/python -m pytest -m integration tests/integration -q   # 8 tests, requires a running local broker
.venv/bin/python -m pytest tests/ --cov=sim_003 --cov-report=term-missing -q
```

## Troubleshooting

- **`MosquittoConnectionError` / broker disconnected in the UI** — confirm `./scripts/start-native.sh` is running and `services/sim-003-mqtt/.env` has the credentials from `local/.env.generated`.
- **Events published but never observed** — almost always an ACL/organisation-slug mismatch (see the ACL note above); the broker acknowledges the QoS1 publish before enforcing the write ACL, so a missing delivery is the real signal, not the ack.
- **CORS errors in the browser console** — check `SIM003_ALLOWED_ORIGINS` in `.env` includes your Vite dev origin exactly.

## Known limitations

See `docs/reports/sim_003_mqtt_known_limitations_report.md` in the repository root for the full list (synthetic data only, loopback plaintext MQTT, no production PKI, bounded in-memory run history, no LLM in this milestone, Firestore entitlement wiring untested against real credentials in this environment).
