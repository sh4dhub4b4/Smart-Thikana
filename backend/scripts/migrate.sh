#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Apply an ad-hoc SQL file to the running database WITHOUT wiping data.
# Usage:  ./scripts/migrate.sh path/to/change.sql
# -----------------------------------------------------------------------------
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="${1:?Usage: $0 <path-to-sql-file>}"
echo "▶ Applying $FILE to running database..."
docker compose exec -T db psql -U postgres -d postgres < "$FILE"
echo "✓ Migration applied."
