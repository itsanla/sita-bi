#!/bin/bash
set -e

echo "🏗️  Building Web artifacts..."

cd apps/web

# Build Next.js
pnpm build

echo ""
echo "✅ Web build complete!"
echo "   - .next/standalone/"
echo "   - .next/static/"
echo ""
echo "💡 Next: Run 'docker build -t itsanla/sita-web:latest .' from apps/web/"
