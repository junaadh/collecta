#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [ "$#" -lt 3 ]; then
  printf 'usage: scripts/run-workspace.sh <package-name> <dir> <script> [args...]\n' >&2
  exit 1
fi

package_name="$1"
dir="$2"
script="$3"
shift 3

if [ "${FORCE_NPM:-0}" != "1" ] && command -v bun >/dev/null 2>&1; then
  bun --cwd "$ROOT_DIR/$dir" "$script" "$@"
else
  (cd "$ROOT_DIR/$dir" && npm run "$script" -- "$@")
fi
