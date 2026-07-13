#!/usr/bin/env bash
# Starts the local SIM-003 Mosquitto broker natively (Homebrew), loopback-only.
set -euo pipefail
cd "$(dirname "$0")/.."  # infra/sim-003-mosquitto/

if [ ! -f local/passwd ]; then
  echo "No local/passwd found — run scripts/generate-credentials.sh first." >&2
  exit 1
fi

echo "Starting Mosquitto on 127.0.0.1:1883 (loopback only)..."
exec mosquitto -c mosquitto.conf
