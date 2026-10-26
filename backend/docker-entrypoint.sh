#!/bin/sh
set -e

echo "==> Checking database connection and applying Prisma migrations..."
MAX_RETRIES=30
COUNT=0

until npx prisma migrate deploy; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "==> ERROR: Database was not reachable after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "==> Database not ready yet ($COUNT/$MAX_RETRIES). Retrying in 2s..."
  sleep 2
done

echo "==> Database migrations applied successfully!"

if [ "$RUN_SEED" = "true" ]; then
  echo "==> Running database seed..."
  npx prisma db seed || echo "==> Seeding warning: could not run seed, continuing..."
fi

exec "$@"
