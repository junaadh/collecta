#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FORCE_NPM="${FORCE_NPM:-0}"

for arg in "$@"; do
  case "$arg" in
    --npm) FORCE_NPM=1 ;;
    --help|-h)
      printf 'usage: scripts/setup.sh [--npm]\n'
      exit 0
      ;;
    *)
      printf 'unknown setup option: %s\n' "$arg" >&2
      printf 'usage: scripts/setup.sh [--npm]\n' >&2
      exit 1
      ;;
  esac
done

if [ "$FORCE_NPM" = "1" ]; then
  if ! command -v npm >/dev/null 2>&1; then
    printf 'FORCE_NPM=1 requires npm in PATH\n' >&2
    exit 1
  fi

  PM="npm"
elif command -v bun >/dev/null 2>&1; then
  PM="bun"
elif command -v npm >/dev/null 2>&1; then
  PM="npm"
else
  printf 'setup requires bun or npm in PATH\n' >&2
  exit 1
fi

cd "$ROOT_DIR"

with_npm_workspace_links() {
  local status tmp_dir

  tmp_dir="$(mktemp -d)"
  cp apps/api/package.json "$tmp_dir/apps-api.package.json"
  cp apps/web/package.json "$tmp_dir/apps-web.package.json"

  set +e
  node <<'NODE'
const fs = require("node:fs");

const replacements = new Map([
  ["apps/api/package.json", {
    "@collecta/db": "file:../../packages/db",
    "@collecta/shared": "file:../../packages/shared",
  }],
  ["apps/web/package.json", {
    "@collecta/shared": "file:../../packages/shared",
  }],
]);

for (const [file, deps] of replacements) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  for (const [name, version] of Object.entries(deps)) {
    if (json.dependencies?.[name] === "workspace:*") {
      json.dependencies[name] = version;
    }
  }

  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}
NODE
  status="$?"

  if [ "$status" -eq 0 ]; then
    "$@"
    status="$?"
  fi

  set -e

  cp "$tmp_dir/apps-api.package.json" apps/api/package.json
  cp "$tmp_dir/apps-web.package.json" apps/web/package.json
  rm -rf "$tmp_dir"

  return "$status"
}

npm_install() {
  with_npm_workspace_links npm install --no-package-lock
}

if [ ! -e ".env" ]; then
  ./scripts/setup-env.sh
else
  printf '.env already exists; using existing file.\n' >&2
  printf '\n.env\n' >&2
  sed 's/^/  /' .env
fi

set -a
source .env
set +a

printf 'using %s for setup\n' "$PM"

if [ "$PM" = "bun" ]; then
  bun install
else
  npm_install
fi

./scripts/up.sh

postgres_port="${POSTGRES_PORT:-5432}"
postgres_user="${POSTGRES_USER:-collecta}"
postgres_db="${POSTGRES_DB:-collecta}"

printf 'waiting for postgres on localhost:%s...\n' "$postgres_port"
for _ in {1..30}; do
  if docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; then
    printf 'postgres is ready\n'
    break
  fi

  sleep 1
done

if ! docker compose --env-file .env -f infra/docker-compose.yml exec -T postgres pg_isready -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; then
  printf 'postgres did not become ready on localhost:%s\n' "$postgres_port" >&2
  exit 1
fi

if [ "$PM" = "bun" ]; then
  bun run db:push
  bun run db:seed
else
  if [ -x "$ROOT_DIR/packages/db/node_modules/.bin/drizzle-kit" ]; then
    with_npm_workspace_links env PATH="$ROOT_DIR/packages/db/node_modules/.bin:$PATH" drizzle-kit push
  else
    with_npm_workspace_links npm exec -- drizzle-kit push
  fi

  FORCE_NPM=1 ./scripts/run-ts.sh packages/db/seed.ts
fi

printf '\n========================================\n'
printf '  Collecta is ready!\n\n'
printf '  Open: http://localhost/login\n'
printf '========================================\n'
