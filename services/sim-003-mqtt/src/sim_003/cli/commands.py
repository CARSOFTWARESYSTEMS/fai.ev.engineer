"""SIM-003 CLI — reuses the exact same generator/detector/orchestrator as the
FastAPI service and Streamlit UI. No scenario logic is duplicated here."""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from ..core.orchestrator import run_scenario
from ..core.repository import InMemoryRunRepository
from ..evidence.export import evidence_to_html, evidence_to_json
from ..models.events import Scenario
from ..models.requests import GenerateEventsRequest
from ..settings import Settings, get_settings
from ..transports.in_memory import InMemoryTransport
from ..transports.mosquitto import MosquittoConnectionError, MosquittoTransport

_KNOWN_LIMITATIONS = [
    "All data is synthetic — EDUCATIONAL_SIMULATION_ONLY.",
    "Local plaintext MQTT on loopback only.",
    "No production PKI or device registry.",
]

CLI_ORGANISATION_SLUG = "demo-organisation"  # matches infra/sim-003-mosquitto/acl.example


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m sim_003",
        description=(
            "SIM-003 MQTT Telemetry Simulator — SYNTHETIC, EDUCATIONAL_SIMULATION_ONLY. "
            "No real battery, BMS, or network attack traffic is produced."
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    generate = sub.add_parser("generate", help="Generate and optionally publish a telemetry run")
    generate.add_argument("--battery-id", required=True, help="Reserved SIM- prefixed synthetic battery ID")
    generate.add_argument("--scenario", required=True, choices=[s.value for s in Scenario])
    generate.add_argument("--count", type=int, default=10, dest="num_events")
    generate.add_argument("--delay-seconds", type=int, default=None)
    generate.add_argument("--interval-ms", type=int, default=500)
    generate.add_argument("--qos", type=int, default=1, choices=[0, 1, 2])
    generate.add_argument("--seed", type=int, default=42)
    generate.add_argument("--profile", default="sim003_48v_demo", dest="profile_id")
    generate.add_argument("--replay-window-seconds", type=int, default=300)
    generate.add_argument("--transport", choices=["mqtt", "in_memory"], default=None)
    publish_group = generate.add_mutually_exclusive_group()
    publish_group.add_argument("--publish", dest="publish", action="store_true", default=True)
    publish_group.add_argument("--no-publish", dest="publish", action="store_false")
    generate.add_argument("--output", choices=["json", "jsonl", "summary"], default="summary")
    generate.add_argument("--evidence-dir", default=None)

    return parser


async def _run_generate(args: argparse.Namespace) -> int:
    settings: Settings = get_settings()
    transport_mode = args.transport or settings.sim003_transport

    try:
        request = GenerateEventsRequest(
            battery_id=args.battery_id,
            scenario=args.scenario,
            num_events=args.num_events,
            delay_seconds=args.delay_seconds,
            interval_ms=args.interval_ms,
            qos=args.qos,
            seed=args.seed,
            profile_id=args.profile_id,
            replay_window_seconds=args.replay_window_seconds,
            publish=args.publish,
        )
    except ValidationError as exc:
        print(f"Invalid request: {exc}", file=sys.stderr)
        return 2

    if transport_mode == "mqtt":
        transport = MosquittoTransport(settings)
        try:
            await transport.connect()
        except MosquittoConnectionError as exc:
            print(f"Could not connect to local Mosquitto broker: {exc}", file=sys.stderr)
            return 3
    else:
        transport = InMemoryTransport()
        await transport.connect()

    repository = InMemoryRunRepository()
    run = await run_scenario(
        request, organisation_slug=CLI_ORGANISATION_SLUG, transport=transport,
        repository=repository, settings=settings,
    )
    await transport.disconnect()

    run_result = run.to_run_result()

    if args.output == "json":
        print(run_result.model_dump_json(indent=2))
    elif args.output == "jsonl":
        for event in run_result.events:
            print(event.model_dump_json())
    else:
        print(
            f"SIM-003 run {run_result.run_id} — scenario={run_result.scenario.value} "
            f"status={run_result.status.value} transport={run_result.transport}",
            file=sys.stderr,
        )
        print(
            f"generated={run_result.generated_count} published={run_result.published_count} "
            f"observed={run_result.observed_count} valid={run_result.valid_count}",
            file=sys.stderr,
        )
        if run_result.anomaly_counts:
            print(f"anomalies: {run_result.anomaly_counts}", file=sys.stderr)

    if args.evidence_dir:
        out_dir = Path(args.evidence_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / f"{run_result.run_id}.json").write_text(
            evidence_to_json(run_result, organisation_reference=CLI_ORGANISATION_SLUG, known_limitations=_KNOWN_LIMITATIONS)
        )
        (out_dir / f"{run_result.run_id}.html").write_text(
            evidence_to_html(run_result, organisation_reference=CLI_ORGANISATION_SLUG, known_limitations=_KNOWN_LIMITATIONS)
        )
        print(f"Evidence written to {out_dir}", file=sys.stderr)

    if run_result.status.value not in ("PASSED",):
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        if args.command == "generate":
            return asyncio.run(_run_generate(args))
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
