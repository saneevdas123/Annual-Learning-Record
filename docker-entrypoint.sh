#!/bin/sh
set -e

# Bring the database schema up to date before the app starts.
# If migration files exist, apply them (production-safe, keeps history).
# Otherwise fall back to `db push` so a fresh database still gets its schema.
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null | grep -v migration_lock.toml)" ]; then
  echo "Applying migrations (prisma migrate deploy)…"
  npx prisma migrate deploy || echo "migrate deploy failed — check DATABASE_URL"
else
  echo "No migrations found — syncing schema (prisma db push)…"
  npx prisma db push --skip-generate || echo "db push failed — check DATABASE_URL"
fi

exec "$@"
