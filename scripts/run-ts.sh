#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
watch=0

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [ "${1:-}" = "--watch" ]; then
  watch=1
  shift
fi

if [ "$#" -ne 1 ]; then
  printf 'usage: scripts/run-ts.sh [--watch] <file>\n' >&2
  exit 1
fi

file="$1"

cd "$ROOT_DIR"

if [ "${FORCE_NPM:-0}" != "1" ] && command -v bun >/dev/null 2>&1; then
  if [ "$watch" -eq 1 ]; then
    bun --watch "$file"
  else
    bun "$file"
  fi
else
  if [ "$watch" -eq 1 ]; then
    npx tsx watch "$file"
  else
    npx tsx "$file"
  fi
fi
