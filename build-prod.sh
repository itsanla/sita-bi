#!/bin/bash

set -e

VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")

echo "🏗️  Building production artifacts v${VERSION}..."
echo ""

# Build API
echo "📦 Building API..."
cd apps/api
pnpm build
cd ../..

# Build Web
echo "🌐 Building Web..."
cd apps/web
pnpm build
cd ../..

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Artifacts created:"
echo "   - apps/api/dist/"
echo "   - apps/web/.next/standalone/"
echo "   - apps/web/.next/static/"
echo ""
echo "💡 Next: Run './build-image-prod.sh' to create Docker images"
