#!/bin/bash

echo "=========================================="
echo "SITA-BI Docker Debug Script"
echo "=========================================="
echo ""

echo "1. Checking Docker containers status..."
docker ps -a | grep -E "sita-bi|waha"
echo ""

echo "2. Checking API container logs (last 50 lines)..."
docker logs sita-bi-api --tail 50
echo ""

echo "3. Checking database files..."
echo "Host database:"
ls -lh ~/sitabi/database/
echo ""
echo "Container database:"
docker exec sita-bi-api ls -lh /app/data/ 2>/dev/null || echo "Container not running"
echo ""

echo "4. Checking database content..."
echo "Users count in /app/data/sita_bi.db:"
docker exec sita-bi-api sqlite3 /app/data/sita_bi.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "Failed to query"
echo ""
echo "Tables in /app/data/sita_bi.db:"
docker exec sita-bi-api sqlite3 /app/data/sita_bi.db ".tables" 2>/dev/null || echo "Failed to list tables"
echo ""

echo "5. Checking environment variables..."
docker exec sita-bi-api env | grep -E "DATABASE_URL|NODE_ENV|JWT_SECRET" 2>/dev/null || echo "Container not running"
echo ""

echo "6. Testing direct SQLite connection..."
docker exec sita-bi-api sqlite3 /app/data/sita_bi.db "SELECT 1 as test;" 2>/dev/null || echo "Failed"
echo ""

echo "7. Checking Prisma Client location and schema..."
docker exec sita-bi-api ls -la /app/node_modules/.prisma/client/ 2>/dev/null | head -10
echo ""
echo "Prisma Client schema URL:"
docker exec sita-bi-api cat /app/node_modules/.prisma/client/schema.prisma 2>/dev/null | grep "url" | head -3
echo ""
echo "Testing Prisma Client query:"
docker exec sita-bi-api sh -c "cd /app && node -e \"const { PrismaClient } = require('@repo/db'); const p = new PrismaClient(); p.\\\$queryRaw\\\`SELECT 1\\\`.then(r => {console.log('SUCCESS:', r); process.exit(0)}).catch(e => {console.error('ERROR:', e.message, e.code); process.exit(1)})\"" 2>&1
echo ""

echo "8. Checking Prisma config file..."
echo "Does /app/src/config/prisma.ts exist?"
docker exec sita-bi-api ls -la /app/src/config/prisma.ts 2>/dev/null || echo "File not found"
echo ""
echo "Content of prisma config:"
docker exec sita-bi-api cat /app/src/config/prisma.ts 2>/dev/null | head -30
echo ""

echo "9. Testing health check code manually..."
docker exec sita-bi-api sh -c "cd /app && node -e \"
(async () => {
  try {
    const { PrismaService } = await import('./config/prisma');
    const client = PrismaService.getClient();
    const result = await client.\\\$queryRaw\\\`SELECT 1\\\`;
    console.log('Health check SUCCESS:', result);
  } catch (e) {
    console.error('Health check ERROR:', e.message);
    console.error('Error code:', e.code);
    console.error('Stack:', e.stack);
  }
})();
\"" 2>&1
echo ""

echo "10. Testing health endpoint..."
curl -s http://localhost:3002/health | jq . 2>/dev/null || curl -s http://localhost:3002/health
echo ""

echo "11. Checking volume mounts..."
docker inspect sita-bi-api 2>/dev/null | grep -A 20 "Mounts" | head -25
echo ""

echo "12. Checking Prisma schema DATABASE_URL..."
docker exec sita-bi-api grep "url" /app/packages/db/prisma/schema.prisma 2>/dev/null
echo ""

echo "=========================================="
echo "Debug complete!"
echo "=========================================="
