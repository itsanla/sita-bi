#!/bin/bash
set -e

VERSION_FILE=".version"

if [ ! -f "$VERSION_FILE" ]; then
  echo "1.0.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")

echo "🐳 Building Docker images v$VERSION..."
echo ""

# Build with BuildKit for better caching and performance
export DOCKER_BUILDKIT=1

echo "📦 Building API image..."
docker build \
  --platform linux/amd64 \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t itsanla/sita-api:$VERSION \
  -t itsanla/sita-api:latest \
  -f apps/api/Dockerfile \
  .

echo ""
echo "🌐 Building Web image..."
docker build \
  --platform linux/amd64 \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t itsanla/sita-web:$VERSION \
  -t itsanla/sita-web:latest \
  -f apps/web/Dockerfile \
  .

echo ""
echo "✅ Images built successfully!"
echo "   - itsanla/sita-api:$VERSION (latest)"
echo "   - itsanla/sita-web:$VERSION (latest)"
echo ""
echo "💡 Next: Run './push-image.sh' to push to registry"
