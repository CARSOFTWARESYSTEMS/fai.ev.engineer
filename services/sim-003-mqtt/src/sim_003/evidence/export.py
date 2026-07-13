"""JSON + standalone HTML evidence export for a completed SIM-003 run.

HTML export is dependency-free (no third-party scripts), escapes all
dynamic content, and never claims QA/Architect approval — see
`docs/reports/*` for the human review workflow this feeds into.
"""
from __future__ import annotations

import html
import json

from ..models.runs import RunResult

_MAX_EVENT_APPENDIX = 200


def evidence_to_json(run: RunResult, *, organisation_reference: str, known_limitations: list[str]) -> str:
    payload = {
        "contract_version": run.contract_version,
        "simulator_id": run.simulator_id,
        "run_id": run.run_id,
        "organisation_reference": organisation_reference,
        "scenario": run.scenario.value,
        "status": run.status.value,
        "transport": run.transport,
        "broker_host_classification": "loopback",
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "generated_count": run.generated_count,
        "published_count": run.published_count,
        "observed_count": run.observed_count,
        "valid_count": run.valid_count,
        "reconciled": run.generated_count == run.published_count == run.observed_count,
        "anomaly_counts": run.anomaly_counts,
        "events": [json.loads(e.model_dump_json()) for e in run.events[:_MAX_EVENT_APPENDIX]],
        "event_appendix_truncated": len(run.events) > _MAX_EVENT_APPENDIX,
        "simulated": True,
        "seed": run.seed,
        "classification": "SYNTHETIC_POC",
        "educational_use_warning": "EDUCATIONAL_SIMULATION_ONLY — not real BMS or MQTT infrastructure.",
        "known_limitations": known_limitations,
    }
    return json.dumps(payload, indent=2, default=str)


def _esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def evidence_to_html(run: RunResult, *, organisation_reference: str, known_limitations: list[str]) -> str:
    reconciled = run.generated_count == run.published_count == run.observed_count
    event_rows = "\n".join(
        f"<tr><td>{_esc(e.payload.sequence_number)}</td><td>{_esc(e.payload.event_id)}</td>"
        f"<td>{_esc(e.detection.primary_anomaly.value)}</td><td>{_esc(e.observation.schema_valid)}</td>"
        f"<td>{_esc(e.topic)}</td></tr>"
        for e in run.events[:_MAX_EVENT_APPENDIX]
    )
    limitations_html = "".join(f"<li>{_esc(item)}</li>" for item in known_limitations)
    anomaly_rows = "".join(
        f"<tr><td>{_esc(k)}</td><td>{_esc(v)}</td></tr>" for k, v in run.anomaly_counts.items()
    ) or "<tr><td colspan='2'>No anomalies recorded.</td></tr>"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>SIM-003 Evidence — {_esc(run.run_id)}</title>
<style>
  :root {{ color-scheme: light; }}
  body {{ margin:0; background:#f8fafc; color:#0f172a; font-family: Arial, Helvetica, sans-serif; }}
  .page {{ max-width: 960px; margin: 0 auto; padding: 28px 20px 48px; }}
  .banner {{ background:#fef3c7; border:1px solid #fde68a; color:#92400e; border-radius:10px; padding:14px 18px; font-weight:700; font-size:13px; text-align:center; margin-bottom:20px; }}
  .card {{ background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:20px 22px; margin-bottom:16px; }}
  h1 {{ font-size:20px; margin:0 0 4px; }}
  h2 {{ font-size:13px; letter-spacing:1px; text-transform:uppercase; color:#1d4ed8; margin:0 0 12px; }}
  table {{ width:100%; border-collapse:collapse; font-size:12px; }}
  th, td {{ text-align:left; padding:6px 8px; border-bottom:1px solid #edf2f7; }}
  th {{ color:#475569; font-size:11px; text-transform:uppercase; }}
  .badge {{ display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; background:#dbeafe; color:#1d4ed8; }}
  @media print {{ body {{ background:#fff; }} }}
</style>
</head>
<body>
<main class="page">
  <div class="banner">SYNTHETIC POC — EDUCATIONAL SIMULATION ONLY — NOT REAL BMS OR MQTT INFRASTRUCTURE</div>
  <div class="card">
    <h1>SIM-003 MQTT Telemetry Simulator — Run Evidence</h1>
    <p><span class="badge">{_esc(run.status.value)}</span></p>
    <table><tbody>
      <tr><th>Run ID</th><td>{_esc(run.run_id)}</td></tr>
      <tr><th>Organisation</th><td>{_esc(organisation_reference)}</td></tr>
      <tr><th>Scenario</th><td>{_esc(run.scenario.value)}</td></tr>
      <tr><th>Transport</th><td>{_esc(run.transport)}</td></tr>
      <tr><th>Broker host</th><td>loopback</td></tr>
      <tr><th>Seed</th><td>{_esc(run.seed)}</td></tr>
      <tr><th>Started</th><td>{_esc(run.started_at)}</td></tr>
      <tr><th>Completed</th><td>{_esc(run.completed_at)}</td></tr>
    </tbody></table>
  </div>
  <div class="card">
    <h2>Reconciliation</h2>
    <p>Generated: {run.generated_count} · Published: {run.published_count} · Observed: {run.observed_count} · Valid: {run.valid_count}
      — <strong>{"RECONCILED" if reconciled else "MISMATCH"}</strong></p>
    <h2>Anomaly Counts</h2>
    <table><tbody>{anomaly_rows}</tbody></table>
  </div>
  <div class="card">
    <h2>Observed Events (appendix, max {_MAX_EVENT_APPENDIX})</h2>
    <table>
      <thead><tr><th>Sequence</th><th>Event ID</th><th>Primary Anomaly</th><th>Schema Valid</th><th>Topic</th></tr></thead>
      <tbody>{event_rows}</tbody>
    </table>
  </div>
  <div class="card">
    <h2>Known Limitations</h2>
    <ul>{limitations_html}</ul>
  </div>
</main>
</body>
</html>"""
