#!/bin/bash
set -e

echo "🔍 Fetching latest version from Docker Hub..."

# Get latest API version
API_LATEST=$(curl -s "https://hub.docker.com/v2/repositories/itsanla/sita-api/tags/?page_size=100" | \
  grep -o '"name":"[0-9]*\.[0-9]*\.[0-9]*"' | \
  grep -o '[0-9]*\.[0-9]*\.[0-9]*' | \
  sort -V | tail -1)

# Get latest Web version
WEB_LATEST=$(curl -s "https://hub.docker.com/v2/repositories/itsanla/sita-web/tags/?page_size=100" | \
  grep -o '"name":"[0-9]*\.[0-9]*\.[0-9]*"' | \
  grep -o '[0-9]*\.[0-9]*\.[0-9]*' | \
  sort -V | tail -1)

# Increment patch version
API_VERSION=$(echo $API_LATEST | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
WEB_VERSION=$(echo $WEB_LATEST | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')

echo "📌 Current versions:"
echo "   API: $API_LATEST → $API_VERSION"
echo "   Web: $WEB_LATEST → $WEB_VERSION"
echo ""

read -p "Continue with these versions? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "🏗️  Building images..."

# Build API
echo "📦 Building API..."
docker build -f apps/api/Dockerfile -t itsanla/sita-api:${API_VERSION} -t itsanla/sita-api:latest .

# Build Web
echo "🌐 Building Web..."
docker build -f apps/web/Dockerfile -t itsanla/sita-web:${WEB_VERSION} -t itsanla/sita-web:latest .

echo ""
echo "🚀 Pushing to registry..."

# Push API
docker push itsanla/sita-api:${API_VERSION}
docker push itsanla/sita-api:latest

# Push Web
docker push itsanla/sita-web:${WEB_VERSION}
docker push itsanla/sita-web:latest

echo ""
echo "✅ Build and push complete!"
echo "   - itsanla/sita-api:${API_VERSION} (latest)"
echo "   - itsanla/sita-web:${WEB_VERSION} (latest)"
