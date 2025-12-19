#!/bin/bash

set -e

VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")

echo "🐳 Building Docker images from pre-built artifacts v${VERSION}..."
echo ""

# Check if artifacts exist
if [ ! -d "apps/api/dist" ]; then
    echo "❌ Error: apps/api/dist not found!"
    echo "💡 Run './build-prod.sh' first to build artifacts"
    exit 1
fi

if [ ! -d "apps/web/.next/standalone" ]; then
    echo "❌ Error: apps/web/.next/standalone not found!"
    echo "💡 Run './build-prod.sh' first to build artifacts"
    exit 1
fi

# Build API image
echo "📦 Building API image..."
cd apps/api
docker build -f Dockerfile.prod -t itsanla/sita-api:${VERSION} -t itsanla/sita-api:latest .
cd ../..

# Build Web image (use existing Dockerfile, it already uses standalone)
echo "🌐 Building Web image..."
cd apps/web
docker build -t itsanla/sita-web:${VERSION} -t itsanla/sita-web:latest .
cd ../..

echo ""
echo "✅ Images built successfully!"
echo "   - itsanla/sita-api:${VERSION} (latest)"
echo "   - itsanla/sita-web:${VERSION} (latest)"
echo ""
echo "💡 Next: Run './push-image.sh' to push to registry"
