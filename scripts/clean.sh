#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose --env-file "$ROOT_DIR/.env" -f "$ROOT_DIR/infra/docker-compose.yml")

remove_path() {
  local path="$1"

  if [ -e "$path" ] || [ -L "$path" ]; then
    rm -rf "$path"
    printf 'removed %s\n' "${path#$ROOT_DIR/}"
  fi

  return 0
}

clean_tsbuildinfo() {
  local dir="$1"
  local files=("$dir"/*.tsbuildinfo)

  for file in "${files[@]}"; do
    [ -e "$file" ] && remove_path "$file"
  done

  return 0
}

clean_web_cache() {
  remove_path "$ROOT_DIR/apps/web/.next"
  remove_path "$ROOT_DIR/apps/web/out"
  remove_path "$ROOT_DIR/apps/web/build"
  remove_path "$ROOT_DIR/apps/web/dist"
  remove_path "$ROOT_DIR/apps/web/.turbo"
  remove_path "$ROOT_DIR/apps/web/.eslintcache"
  remove_path "$ROOT_DIR/apps/web/node_modules/.cache"
  clean_tsbuildinfo "$ROOT_DIR/apps/web"
}

clean_web() {
  clean_web_cache
}

clean_api_cache() {
  remove_path "$ROOT_DIR/apps/api/dist"
  remove_path "$ROOT_DIR/apps/api/build"
  remove_path "$ROOT_DIR/apps/api/.turbo"
  remove_path "$ROOT_DIR/apps/api/.hono"
  remove_path "$ROOT_DIR/apps/api/.eslintcache"
  remove_path "$ROOT_DIR/apps/api/core"
  remove_path "$ROOT_DIR/apps/api/node_modules/.cache"
  clean_tsbuildinfo "$ROOT_DIR/apps/api"
}

clean_api() {
  clean_api_cache
}

clean_packages_cache() {
  remove_path "$ROOT_DIR/packages/db/dist"
  remove_path "$ROOT_DIR/packages/db/build"
  remove_path "$ROOT_DIR/packages/db/.turbo"
  remove_path "$ROOT_DIR/packages/db/node_modules/.cache"
  clean_tsbuildinfo "$ROOT_DIR/packages/db"

  remove_path "$ROOT_DIR/packages/shared/dist"
  remove_path "$ROOT_DIR/packages/shared/build"
  remove_path "$ROOT_DIR/packages/shared/.turbo"
  remove_path "$ROOT_DIR/packages/shared/node_modules/.cache"
  clean_tsbuildinfo "$ROOT_DIR/packages/shared"
}

clean_packages() {
  clean_packages_cache
}

clean_node_modules() {
  remove_path "$ROOT_DIR/node_modules"
  remove_path "$ROOT_DIR/apps/api/node_modules"
  remove_path "$ROOT_DIR/apps/web/node_modules"
  remove_path "$ROOT_DIR/packages/db/node_modules"
  remove_path "$ROOT_DIR/packages/shared/node_modules"
}

clean_bun_cache() {
  if command -v bun >/dev/null 2>&1; then
    bun pm cache rm >/dev/null 2>&1 || true
    printf 'cleared bun package cache\n'
  fi
}

clean_db() {
  "${COMPOSE[@]}" down --volumes --remove-orphans
  docker volume rm collecta_collecta_postgres infra_collecta_postgres collecta_postgres >/dev/null 2>&1 || true
  printf 'dropped postgres docker volume\n'
}

clean_docker() {
  "${COMPOSE[@]}" down --volumes --remove-orphans
  docker builder prune --all --force
  docker system prune --all --volumes --force
}

clean_all() {
  clean_web_cache
  clean_api_cache
  clean_packages_cache
  clean_node_modules
  clean_bun_cache
}

usage() {
  cat <<'USAGE'
Usage: scripts/clean.sh <target>

Targets:
  all      Clear caches, all workspace node_modules, and Bun package cache
  web      Clear Next/web caches and web node_modules/.cache
  api      Clear API/Hono caches and API node_modules/.cache
  db       Drop the Postgres Docker volume
  docker   Clean Docker containers, images, volumes, and build cache
USAGE
}

target="${1:-all}"

case "$target" in
  all)
    clean_all
    printf 'clean: all complete\n'
    ;;
  web)
    clean_web
    printf 'clean: web complete\n'
    ;;
  api)
    clean_api
    printf 'clean: api complete\n'
    ;;
  db)
    clean_db
    printf 'clean: db complete\n'
    ;;
  docker)
    clean_docker
    printf 'clean: docker complete\n'
    ;;
  help|--help|-h) usage ;;
  *)
    usage
    exit 1
    ;;
esac
