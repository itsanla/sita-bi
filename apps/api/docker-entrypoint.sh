#!/bin/sh
set -e

echo "🔄 Running database migrations..."

cd /app
npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma || echo "⚠️  Migration failed or no migrations to run"

echo "✅ Migrations complete"
echo "🚀 Starting API server..."

exec node --import tsx/esm src/server.ts
