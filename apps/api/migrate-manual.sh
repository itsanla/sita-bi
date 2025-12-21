#!/bin/bash
set -e

echo "🚀 SITA-BI Migration: SQLite → PostgreSQL"
echo "=========================================="
echo ""

DB_NAME="sitabi"
DB_USER="sitabi"
DB_PASS="sitabi2025_secure"

echo "📋 Step-by-step migration guide"
echo ""
echo "STEP 1: Start PostgreSQL (run this manually):"
echo "  sudo systemctl start postgresql"
echo "  sudo systemctl enable postgresql"
echo ""
read -p "Press Enter after PostgreSQL is started..."

echo ""
echo "STEP 2: Create database (run this manually):"
echo "  sudo -u postgres psql"
echo ""
echo "Then paste these commands:"
cat << 'EOF'
DROP DATABASE IF EXISTS sitabi;
DROP USER IF EXISTS sitabi;
CREATE USER sitabi WITH PASSWORD 'sitabi2025_secure';
CREATE DATABASE sitabi OWNER sitabi;
GRANT ALL PRIVILEGES ON DATABASE sitabi TO sitabi;
\c sitabi
GRANT ALL ON SCHEMA public TO sitabi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sitabi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sitabi;
\q
EOF
echo ""
read -p "Press Enter after database is created..."

echo ""
echo "STEP 3: Backup SQLite..."
mkdir -p backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp prisma/sita-bi.db "backups/sita-bi_$TIMESTAMP.db"
echo "✅ Backup: backups/sita-bi_$TIMESTAMP.db"

echo ""
echo "STEP 4: Update Prisma schema..."
cp prisma/schema.prisma prisma/schema.prisma.sqlite.backup
sed -i '1,8d' prisma/schema.prisma
cat > prisma/schema.prisma.tmp << 'SCHEMA'
generator client {
  provider = "prisma-client-js"
  output   = "../src/prisma-client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

SCHEMA
cat prisma/schema.prisma >> prisma/schema.prisma.tmp
mv prisma/schema.prisma.tmp prisma/schema.prisma
echo "✅ Schema updated"

echo ""
echo "STEP 5: Update .env..."
cp .env .env.sqlite.backup
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public\"|g" .env
echo "✅ .env updated"

echo ""
echo "STEP 6: Update database.ts..."
cat > src/config/database.ts << 'DBTS'
import { PrismaClient } from '../prisma-client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

console.log('[DATABASE] PostgreSQL connected');

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
DBTS
echo "✅ database.ts updated"

echo ""
echo "STEP 7: Generate Prisma Client..."
npx prisma generate
echo "✅ Client generated"

echo ""
echo "STEP 8: Push schema..."
npx prisma db push --accept-data-loss
echo "✅ Schema pushed"

echo ""
echo "STEP 9: Optimize PostgreSQL (run manually):"
echo "  sudo -u postgres psql -d sitabi"
echo ""
echo "Then paste:"
cat << 'OPTIMIZE'
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET max_parallel_workers = 8;
SELECT pg_reload_conf();
\q
OPTIMIZE
echo ""
read -p "Press Enter after optimization..."

echo ""
echo "STEP 10: Restart PostgreSQL (run manually):"
echo "  sudo systemctl restart postgresql"
echo ""
read -p "Press Enter after restart..."

echo ""
echo "STEP 11: Build..."
pnpm build
echo "✅ Build complete"

echo ""
echo "STEP 12: Test connection..."
node -e "const {getPrismaClient}=require('./dist/config/database');const p=getPrismaClient();p.\$connect().then(()=>console.log('✅ Connected')).catch(e=>console.error('❌',e.message)).finally(()=>p.\$disconnect());"

echo ""
echo "=========================================="
echo "🎉 MIGRATION COMPLETE!"
echo ""
echo "Next: Import data"
echo "  node scripts/import-from-sqlite.js"
