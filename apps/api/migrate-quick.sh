#!/bin/bash
set -e

echo "🚀 Quick PostgreSQL Migration"
echo ""

# Backup
mkdir -p backups
cp prisma/sita-bi.db "backups/sita-bi_$(date +%Y%m%d_%H%M%S).db" 2>/dev/null || true
cp .env .env.backup 2>/dev/null || true
cp prisma/schema.prisma prisma/schema.prisma.backup 2>/dev/null || true

# Update schema
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Update .env
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://sitabi:sitabi2025_secure@localhost:5432/sitabi?schema=public"|' .env

# Update database.ts
cat > src/config/database.ts << 'EOF'
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

console.log('[DATABASE] PostgreSQL ready');

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export default prisma;
EOF

echo "✅ Files updated"
echo ""
echo "Run these commands manually:"
echo ""
echo "1. Start PostgreSQL:"
echo "   sudo systemctl start postgresql"
echo ""
echo "2. Create database:"
echo "   sudo -u postgres psql -c \"CREATE USER sitabi WITH PASSWORD 'sitabi2025_secure';\""
echo "   sudo -u postgres psql -c \"CREATE DATABASE sitabi OWNER sitabi;\""
echo "   sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE sitabi TO sitabi;\""
echo ""
echo "3. Generate & push:"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo ""
echo "4. Build:"
echo "   pnpm build"
echo ""
echo "5. Import data:"
echo "   node scripts/import-from-sqlite.js"
