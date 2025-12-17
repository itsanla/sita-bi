#!/bin/bash
set -e

echo "🔨 Building SITA-BI..."

echo "📦 Installing dependencies..."
pnpm install

echo "🔧 Generating Prisma Client..."
pnpm --filter @repo/db db:generate

echo "🏗️  Building packages..."
pnpm --filter @repo/db build

echo "🚀 Building API..."
pnpm --filter api build

echo "🌐 Building Web..."
pnpm --filter web build

echo "✅ Build complete!"
