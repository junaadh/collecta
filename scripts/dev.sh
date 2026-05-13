#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  jobs -p | xargs -r kill
}

trap cleanup EXIT INT TERM

"$ROOT_DIR/scripts/run-ts.sh" --watch apps/api/src/index.ts &
"$ROOT_DIR/scripts/run-workspace.sh" @collecta/web apps/web dev &

wait
