#!/bin/bash
set -e

VERSION_FILE=".version"

if [ ! -f "$VERSION_FILE" ]; then
  echo "1.0.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")

echo "🐳 Building Docker images v$VERSION..."

echo "📦 Building API image..."
docker build -t itsanla/sita-api:$VERSION -t itsanla/sita-api:latest -f apps/api/Dockerfile .

echo "🌐 Building Web image..."
docker build -t itsanla/sita-web:$VERSION -t itsanla/sita-web:latest -f apps/web/Dockerfile .

echo "✅ Images built successfully!"
echo "   - itsanla/sita-api:$VERSION"
echo "   - itsanla/sita-web:$VERSION"
