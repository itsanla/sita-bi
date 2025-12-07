#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Run Prisma migrations
cd /app
npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "⚠️  Migration failed or no migrations to run"

echo "✅ Migrations complete"
echo "🚀 Starting API server..."

# Start the application
exec node dist/server.js
