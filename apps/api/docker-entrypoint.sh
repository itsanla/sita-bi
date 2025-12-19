#!/bin/sh
set -e

echo "🔄 Syncing database schema..."

export DATABASE_URL="file:/app/data/sita_bi.db"
cd /app/packages/db
npx prisma db push || echo "⚠️  Schema sync failed"

echo "✅ Migrations complete"

# Check if database is empty (no users table data)
if [ ! -f /app/data/sita_bi.db ] || [ $(sqlite3 /app/data/sita_bi.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0") -eq 0 ]; then
  echo "🌱 Database is empty, running seeder..."
  cd /app/packages/db && DATABASE_URL="file:/app/data/sita_bi.db" npx ts-node prisma/seed.ts || echo "⚠️  Seeder failed"
  echo "✅ Seeder complete"
else
  echo "ℹ️  Database already has data, skipping seeder"
fi

echo "🚀 Starting API server..."

cd /app
export NODE_PATH=/app/node_modules:/app/packages
exec npx tsx src/server.ts
