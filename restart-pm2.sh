#!/bin/bash
set -e

echo "🔄 Restarting SITA-BI..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build web
echo "🏗️  Building web..."
pnpm --filter web build

# Restart PM2
echo "♻️  Restarting PM2..."
pm2 restart all

# Show status
echo "✅ Restart complete!"
pm2 status
