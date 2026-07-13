"""SIM-003 developer diagnostic UI.

This is a developer diagnostic surface, NOT the customer product UI (that is
the FAI.EV.ENGINEER React page at /battery-trust/simulators/sim-003). It
consumes the exact same shared service layer as the FastAPI app and CLI —
core.orchestrator.run_scenario — so scenario/detection logic is never
duplicated.

Run with: streamlit run streamlit_app/app.py
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from sim_003.core.orchestrator import run_scenario  # noqa: E402
from sim_003.core.profiles import list_profiles  # noqa: E402
from sim_003.core.repository import InMemoryRunRepository  # noqa: E402
from sim_003.core.topics import build_telemetry_topic  # noqa: E402
from sim_003.evidence.export import evidence_to_html, evidence_to_json  # noqa: E402
from sim_003.models.events import Scenario  # noqa: E402
from sim_003.models.requests import GenerateEventsRequest  # noqa: E402
from sim_003.settings import get_settings  # noqa: E402
from sim_003.transports.in_memory import InMemoryTransport  # noqa: E402
from sim_003.transports.mosquitto import MosquittoConnectionError, MosquittoTransport  # noqa: E402

st.set_page_config(page_title="SIM-003 MQTT Telemetry Simulator — Diagnostic", layout="wide")

_KNOWN_LIMITATIONS = [
    "All data is synthetic — EDUCATIONAL_SIMULATION_ONLY.",
    "Local plaintext MQTT on loopback only — not acceptable for remote/customer deployment.",
    "No production PKI, fleet-scale certificate provisioning, or device registry.",
    "Run history is bounded, in-memory, and process-local.",
    "No LLM/AI model is called in this milestone.",
]
DIAGNOSTIC_ORG_SLUG = "demo-organisation"

st.markdown(
    "<div style='background:#fef3c7;border:1px solid #fde68a;color:#92400e;"
    "border-radius:8px;padding:10px 16px;font-weight:700;text-align:center;'>"
    "SYNTHETIC DATA — EDUCATIONAL SIMULATION ONLY — Developer diagnostic surface, not the customer UI"
    "</div>",
    unsafe_allow_html=True,
)
st.title("SIM-003 · MQTT Telemetry Simulator")

settings = get_settings()

with st.sidebar:
    st.subheader("Broker / Transport")
    transport_mode = st.selectbox("Transport", ["in_memory", "mqtt"], index=0 if settings.sim003_transport == "in_memory" else 1)
    st.caption(f"Configured broker: {settings.mqtt_broker_host}:{settings.mqtt_broker_port} (loopback-only enforced)")

    st.subheader("Scenario")
    battery_id = st.text_input("Battery ID", value="SIM-BAT-001")
    scenario = st.selectbox("Scenario", [s.value for s in Scenario])
    profile_id = st.selectbox("Battery profile", [p.profile_id for p in list_profiles()])
    num_events = st.number_input("Count", min_value=1, max_value=1000, value=10)
    interval_ms = st.number_input("Interval (ms)", min_value=50, max_value=10000, value=500)
    qos = st.selectbox("QoS", [0, 1, 2], index=1)
    seed = st.number_input("Seed", min_value=0, value=42)

    delay_seconds = None
    replay_window_seconds = 300
    if scenario == "delayed_telemetry":
        delay_seconds = st.number_input("Delay (seconds)", min_value=1, max_value=300, value=60)
    if scenario == "replay_attack":
        replay_window_seconds = st.number_input("Replay window (seconds)", min_value=1, max_value=3600, value=300)

    try:
        topic_preview = build_telemetry_topic(
            topic_root=settings.mqtt_topic_root, organisation_slug=DIAGNOSTIC_ORG_SLUG, battery_id=battery_id or "SIM-BAT-INVALID",
        )
        st.text_input("Canonical topic (read-only)", value=topic_preview, disabled=True)
    except ValueError as exc:
        st.warning(f"Invalid battery ID for topic construction: {exc}")

    run_clicked = st.button("Start Simulation", type="primary", use_container_width=True)


async def _execute(request: GenerateEventsRequest):
    if transport_mode == "mqtt":
        transport = MosquittoTransport(settings)
        await transport.connect()
    else:
        transport = InMemoryTransport()
        await transport.connect()

    repository = InMemoryRunRepository()
    try:
        run = await run_scenario(
            request, organisation_slug=DIAGNOSTIC_ORG_SLUG, transport=transport,
            repository=repository, settings=settings,
        )
    finally:
        await transport.disconnect()
    return run


if run_clicked:
    try:
        request = GenerateEventsRequest(
            battery_id=battery_id, scenario=scenario, num_events=int(num_events),
            delay_seconds=delay_seconds, interval_ms=int(interval_ms), qos=qos,
            seed=int(seed), profile_id=profile_id, replay_window_seconds=int(replay_window_seconds),
        )
    except Exception as exc:  # noqa: BLE001 — surface validation errors to the diagnostic user
        st.error(f"Invalid scenario configuration: {exc}")
        st.stop()

    try:
        run = asyncio.run(_execute(request))
    except MosquittoConnectionError as exc:
        st.error(f"Could not connect to local Mosquitto broker — is it running? ({exc})")
        st.stop()

    st.session_state["last_run"] = run.to_run_result()

run_result = st.session_state.get("last_run")

if run_result is None:
    st.info("Configure a scenario in the sidebar and select **Start Simulation**.")
else:
    status_color = {"PASSED": "green", "DEGRADED": "orange", "FAILED": "red"}.get(run_result.status.value, "gray")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Status", run_result.status.value)
    c2.metric("Generated", run_result.generated_count)
    c3.metric("Published", run_result.published_count)
    c4.metric("Observed", run_result.observed_count)
    c5.metric("Anomalies", sum(run_result.anomaly_counts.values()))

    st.subheader("Pipeline")
    stages = ["Generator", "Publisher", "Mosquitto" if run_result.transport == "mqtt" else "In-Memory Bus", "Subscriber", "Schema Validator", "Detection Engine", "Evidence"]
    stage_state = "Passed" if run_result.status.value == "PASSED" else ("Degraded" if run_result.status.value == "DEGRADED" else "Failed")
    st.write(" → ".join(f"**{s}**: {stage_state}" for s in stages))

    st.subheader("Live Telemetry")
    if run_result.events:
        chart_data = {
            "voltage_v": [e.payload.voltage_v for e in run_result.events],
            "current_a": [e.payload.current_a for e in run_result.events],
            "temperature_c": [e.payload.temperature_c for e in run_result.events],
            "soc_percent": [e.payload.soc_percent for e in run_result.events],
        }
        st.line_chart(chart_data)

    st.subheader("Event Stream")
    table_rows = [
        {
            "sequence": e.payload.sequence_number,
            "event_id": e.payload.event_id,
            "topic": e.topic,
            "qos": e.qos,
            "voltage_v": e.payload.voltage_v,
            "current_a": e.payload.current_a,
            "temperature_c": e.payload.temperature_c,
            "soc_percent": e.payload.soc_percent,
            "primary_anomaly": e.detection.primary_anomaly.value,
            "schema_valid": e.observation.schema_valid,
        }
        for e in run_result.events
    ]
    st.dataframe(table_rows, use_container_width=True)

    if table_rows:
        selected_seq = st.selectbox("Inspect event (by sequence)", [r["sequence"] for r in table_rows])
        selected = next(e for e in run_result.events if e.payload.sequence_number == selected_seq)
        st.json(selected.model_dump(mode="json"))
        if selected.detection.anomaly_detail:
            st.warning(selected.detection.anomaly_detail)

    st.subheader("Evidence Export")
    json_evidence = evidence_to_json(run_result, organisation_reference=DIAGNOSTIC_ORG_SLUG, known_limitations=_KNOWN_LIMITATIONS)
    html_evidence = evidence_to_html(run_result, organisation_reference=DIAGNOSTIC_ORG_SLUG, known_limitations=_KNOWN_LIMITATIONS)
    dl1, dl2 = st.columns(2)
    dl1.download_button("Download JSON evidence", data=json_evidence, file_name=f"{run_result.run_id}.json", mime="application/json")
    dl2.download_button("Download HTML evidence", data=html_evidence, file_name=f"{run_result.run_id}.html", mime="text/html")
