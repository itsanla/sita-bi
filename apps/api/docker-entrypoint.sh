#!/bin/sh
set -e

echo "🔄 Running database migrations..."

cd /app
npx prisma migrate deploy --schema=./packages/db/prisma/schema.prisma || echo "⚠️  Migration failed or no migrations to run"

echo "✅ Migrations complete"

# Check if database is empty (no users table data)
if [ ! -f /app/data/sita_bi.db ] || [ $(sqlite3 /app/data/sita_bi.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0") -eq 0 ]; then
  echo "🌱 Database is empty, running seeder..."
  cd /app/packages/db && npx ts-node prisma/seed.ts || echo "⚠️  Seeder failed"
  echo "✅ Seeder complete"
else
  echo "ℹ️  Database already has data, skipping seeder"
fi

echo "🚀 Starting API server..."

cd /app
exec npx tsx --tsconfig tsconfig.json src/server.ts
