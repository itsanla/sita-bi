#!/bin/bash
set -e

VERSION_FILE=".version"

if [ ! -f "$VERSION_FILE" ]; then
  echo "1.0.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")

echo "🚀 Pushing Docker images v$VERSION..."

echo "📤 Pushing API image..."
docker push itsanla/sita-api:$VERSION
docker push itsanla/sita-api:latest

echo "📤 Pushing Web image..."
docker push itsanla/sita-web:$VERSION
docker push itsanla/sita-web:latest

echo "✅ Images pushed successfully!"
echo "   - itsanla/sita-api:$VERSION"
echo "   - itsanla/sita-web:$VERSION"

IFS='.' read -r major minor patch <<< "$VERSION"
patch=$((patch + 1))
NEW_VERSION="$major.$minor.$patch"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "🔖 Version bumped: $VERSION → $NEW_VERSION"
