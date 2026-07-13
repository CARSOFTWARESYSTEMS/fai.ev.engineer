#!/usr/bin/env bash
# Stops any locally running SIM-003 Mosquitto broker started via start-native.sh.
set -euo pipefail

PIDS="$(pgrep -f 'mosquitto -c .*sim-003-mosquitto/mosquitto.conf' || true)"
if [ -z "$PIDS" ]; then
  echo "No SIM-003 Mosquitto process found."
  exit 0
fi

echo "Stopping Mosquitto (PIDs: $PIDS)..."
kill $PIDS
