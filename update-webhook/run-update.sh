#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE:-/workspace}"
GIT_REPO="${UPDATE_GIT_REPO:-}"
GIT_BRANCH="${UPDATE_GIT_BRANCH:-main}"
GIT_TOKEN="${UPDATE_GIT_TOKEN:-}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-buchungstool}"
BACKUP_DIR="$WORKSPACE/data/backups"

cd "$WORKSPACE"

echo "== Buchungstool update =="
echo "Workspace: $WORKSPACE"
echo "Branch: $GIT_BRANCH"

mkdir -p "$BACKUP_DIR"

if [ -f "$WORKSPACE/data/prod.db" ]; then
  BACKUP_FILE="$BACKUP_DIR/prod-$(date +%Y%m%d-%H%M%S).db"
  echo "Backup database: $BACKUP_FILE"
  cp "$WORKSPACE/data/prod.db" "$BACKUP_FILE"
else
  echo "No production database found at data/prod.db, skipping backup."
fi

if [ -n "$GIT_REPO" ]; then
  echo "Updating source from git repository..."

  GIT_AUTH_ARGS=()
  if [ -n "$GIT_TOKEN" ]; then
    BASIC_AUTH="$(printf 'x-access-token:%s' "$GIT_TOKEN" | base64 | tr -d '\n')"
    GIT_AUTH_ARGS=(-c "http.extraHeader=Authorization: Basic $BASIC_AUTH")
  fi

  if [ -d "$WORKSPACE/.git" ]; then
    git "${GIT_AUTH_ARGS[@]}" fetch origin "$GIT_BRANCH"
    git reset --hard "origin/$GIT_BRANCH"
  else
    TMP_DIR="$(mktemp -d)"
    git "${GIT_AUTH_ARGS[@]}" clone --depth 1 --branch "$GIT_BRANCH" "$GIT_REPO" "$TMP_DIR/source"
    rsync -a --delete \
      --exclude ".env" \
      --exclude ".next" \
      --exclude "data" \
      --exclude "node_modules" \
      "$TMP_DIR/source/" "$WORKSPACE/"
    rm -rf "$TMP_DIR"
  fi
else
  echo "UPDATE_GIT_REPO is not configured. Rebuilding current files only."
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose -p "$COMPOSE_PROJECT_NAME")
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose -p "$COMPOSE_PROJECT_NAME")
else
  echo "Neither docker compose nor docker-compose is available."
  exit 1
fi

echo "Docker Compose project: $COMPOSE_PROJECT_NAME"

echo "Building buchungstool container..."
"${COMPOSE[@]}" build --no-cache buchungstool

echo "Restarting buchungstool container..."
"${COMPOSE[@]}" up -d --force-recreate buchungstool

echo "Pruning old docker images..."
docker image prune -f >/dev/null 2>&1 || true

echo "Update completed."
