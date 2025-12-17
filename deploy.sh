#!/bin/bash
set -e

echo "🚀 Deploying SITA-BI to VPS..."

if [ ! -f ".env.docker" ]; then
  echo "❌ .env.docker not found!"
  echo "   Copy .env.docker.example and fill in your values"
  exit 1
fi

echo "📁 Creating volume directories..."
mkdir -p ~/sitabi/{database,uploads,documentation/model}

echo "📥 Pulling latest images..."
docker-compose pull

echo "🔄 Stopping old containers..."
docker-compose down

echo "🚀 Starting new containers..."
docker-compose --env-file .env.docker up -d

echo "📊 Checking status..."
docker-compose ps

echo "✅ Deployment complete!"
echo "   API: http://localhost:3002"
echo "   Web: http://localhost:3001"
