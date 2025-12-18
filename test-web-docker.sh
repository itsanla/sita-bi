#!/bin/bash
set -e

echo "🔍 Testing Web Docker Image..."
echo ""

IMAGE_NAME="itsanla/sita-web:latest"

echo "1️⃣ Checking if image exists..."
if docker image inspect $IMAGE_NAME &>/dev/null; then
    echo "✅ Image found: $IMAGE_NAME"
else
    echo "❌ Image not found: $IMAGE_NAME"
    exit 1
fi

echo ""
echo "2️⃣ Inspecting image layers..."
docker history $IMAGE_NAME --no-trunc | head -10

echo ""
echo "3️⃣ Running temporary container to inspect filesystem..."
CONTAINER_ID=$(docker run -d --rm $IMAGE_NAME sleep 3600)
echo "Container ID: $CONTAINER_ID"

echo ""
echo "4️⃣ Checking WORKDIR structure..."
docker exec $CONTAINER_ID ls -la /app/

echo ""
echo "5️⃣ Checking if server.js exists..."
docker exec $CONTAINER_ID ls -la /app/server.js 2>/dev/null && echo "✅ /app/server.js EXISTS" || echo "❌ /app/server.js NOT FOUND"

echo ""
echo "6️⃣ Checking apps/web/server.js..."
docker exec $CONTAINER_ID ls -la /app/apps/web/server.js 2>/dev/null && echo "✅ /app/apps/web/server.js EXISTS" || echo "❌ /app/apps/web/server.js NOT FOUND"

echo ""
echo "7️⃣ Finding all server.js files..."
docker exec $CONTAINER_ID find /app -name "server.js" -type f 2>/dev/null || echo "No server.js found"

echo ""
echo "8️⃣ Checking .next directory..."
docker exec $CONTAINER_ID ls -la /app/apps/web/.next/ 2>/dev/null || echo ".next not found"

echo ""
echo "9️⃣ Checking package.json..."
docker exec $CONTAINER_ID cat /app/package.json 2>/dev/null | head -20

echo ""
echo "🔟 Testing if node can find the server..."
docker exec $CONTAINER_ID node -e "console.log('Node works')" 2>/dev/null && echo "✅ Node executable works" || echo "❌ Node not working"

echo ""
echo "1️⃣1️⃣ Checking environment variables..."
docker exec $CONTAINER_ID env | grep -E "NODE_ENV|PORT|HOSTNAME|NEXT"

echo ""
echo "1️⃣2️⃣ Stopping test container..."
docker stop $CONTAINER_ID

echo ""
echo "✅ Test complete!"
echo ""
echo "📋 Summary:"
echo "   If server.js is in /app/apps/web/server.js → CMD should be: node apps/web/server.js"
echo "   If server.js is in /app/server.js → CMD should be: node server.js"
