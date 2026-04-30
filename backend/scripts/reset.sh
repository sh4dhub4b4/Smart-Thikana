#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# DANGER: wipes the local Postgres data directory and restarts everything.
# Use this when you want a clean slate (e.g. after editing 01-schema.sql).
# -----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Stopping containers..."
docker compose down

echo "▶ Removing DB volume (./volumes/db/data)..."
sudo rm -rf ./volumes/db/data

echo "▶ Starting fresh..."
docker compose up -d

echo "✓ Done. Studio: http://localhost:3000   API: http://localhost:8000"
