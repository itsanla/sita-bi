#!/bin/bash
set -e

# Load versions from build
if [ ! -f .build-version ]; then
    echo "❌ Error: .build-version not found!"
    echo "💡 Run './build-image.sh' first"
    exit 1
fi

source .build-version

echo "🚀 Pushing images to registry..."
echo "   API: $API_VERSION"
echo "   Web: $WEB_VERSION"
echo ""

# Push API
echo "📤 Pushing API..."
docker push itsanla/sita-api:${API_VERSION}
docker push itsanla/sita-api:latest

# Push Web
echo "📤 Pushing Web..."
docker push itsanla/sita-web:${WEB_VERSION}
docker push itsanla/sita-web:latest

echo ""
echo "✅ Push complete!"
echo "   - itsanla/sita-api:${API_VERSION} (latest)"
echo "   - itsanla/sita-web:${WEB_VERSION} (latest)"
