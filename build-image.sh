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

echo "📌 New versions:"
echo "   API: $API_LATEST → $API_VERSION"
echo "   Web: $WEB_LATEST → $WEB_VERSION"
echo ""

# Save versions to file
echo "API_VERSION=$API_VERSION" > .build-version
echo "WEB_VERSION=$WEB_VERSION" >> .build-version

echo "🏗️  Building images..."

# Build API
echo "📦 Building API..."
docker build -f apps/api/Dockerfile -t itsanla/sita-api:${API_VERSION} -t itsanla/sita-api:latest .

# Build Web (from apps/web context)
echo "🌐 Building Web..."
cd apps/web
docker build -t itsanla/sita-web:${WEB_VERSION} -t itsanla/sita-web:latest .
cd ../..

echo ""
echo "✅ Build complete!"
echo "   - itsanla/sita-api:${API_VERSION} (latest)"
echo "   - itsanla/sita-web:${WEB_VERSION} (latest)"
echo ""
echo "💡 Next: Run './push-image.sh' to push to registry"
