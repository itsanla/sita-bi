#!/bin/bash

echo "🔍 Docker Container Debug Script"
echo "=================================="
echo ""

echo "📋 Container Status:"
docker ps -a | grep -E "sita-bi|waha"
echo ""

echo "🏥 Health Status:"
docker inspect sita-bi-api --format='{{.State.Health.Status}}' 2>/dev/null || echo "API: Not running"
docker inspect sita-bi-web --format='{{.State.Health.Status}}' 2>/dev/null || echo "Web: Not running"
echo ""

echo "📝 API Container Logs (last 50 lines):"
echo "-----------------------------------"
docker logs --tail 50 sita-bi-api 2>&1
echo ""

echo "📝 Web Container Logs (last 30 lines):"
echo "-----------------------------------"
docker logs --tail 30 sita-bi-web 2>&1
echo ""

echo "🔧 API Container Inspect:"
echo "-----------------------------------"
docker inspect sita-bi-api --format='
State: {{.State.Status}}
Health: {{.State.Health.Status}}
Exit Code: {{.State.ExitCode}}
Error: {{.State.Error}}
Started At: {{.State.StartedAt}}
Finished At: {{.State.FinishedAt}}
' 2>&1
echo ""

echo "🌐 Network Info:"
docker network inspect sita-bi_sita-network --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>&1
echo ""

echo "💾 Volume Mounts (API):"
docker inspect sita-bi-api --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' 2>&1
echo ""

echo "🔍 Check if server.js exists in API:"
docker exec sita-bi-api ls -la /app/ 2>&1 | head -20
echo ""

echo "🔍 Check node_modules in API:"
docker exec sita-bi-api ls -la /app/node_modules/ 2>&1 | head -10
echo ""

echo "✅ Debug complete!"
