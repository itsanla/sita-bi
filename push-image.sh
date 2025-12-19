#!/bin/bash
set -e

VERSION_FILE=".version"

if [ ! -f "$VERSION_FILE" ]; then
  echo "2.0.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")

echo "🚀 Pushing Docker images v$VERSION to registry..."
echo ""

# Check if logged in to Docker Hub
if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "⚠️  Warning: Not logged in to Docker Hub"
  echo "💡 Run: docker login"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📤 Pushing API image..."
docker push itsanla/sita-api:$VERSION
docker push itsanla/sita-api:latest

echo ""
echo "📤 Pushing Web image..."
docker push itsanla/sita-web:$VERSION
docker push itsanla/sita-web:latest

echo ""
echo "✅ Images pushed successfully!"
echo "   - itsanla/sita-api:$VERSION (latest)"
echo "   - itsanla/sita-web:$VERSION (latest)"
echo ""

# Auto-bump version
IFS='.' read -r major minor patch <<< "$VERSION"
patch=$((patch + 1))
NEW_VERSION="$major.$minor.$patch"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "🔖 Version bumped: $VERSION → $NEW_VERSION"
echo "💡 Next build will use version $NEW_VERSION"
