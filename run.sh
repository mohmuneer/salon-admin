#!/usr/bin/env bash
# ============================================================
# Glamour DB — apply all migrations + seed to a Postgres DB.
#
# Usage:
#   export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
#   ./run.sh            # migrations only
#   ./run.sh --seed     # migrations + sample data
#
# Works with local Postgres or Supabase (use the connection
# string from Supabase > Project Settings > Database).
# ============================================================
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL first, e.g. export DATABASE_URL=postgresql://...}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying migrations to $DATABASE_URL"
for f in "$DIR"/migrations/*.sql; do
  echo ">> $(basename "$f")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

if [[ "${1:-}" == "--seed" ]]; then
  echo ">> seed/seed.sql"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DIR/seed/seed.sql"
fi

echo "Done."
