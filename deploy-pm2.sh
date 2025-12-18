#!/bin/bash
set -e

echo "🚀 Deploying SITA-BI with PM2..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd packages/db
pnpm db:generate
cd ../..

# Run migrations
echo "🔄 Running database migrations..."
cd packages/db
pnpm prisma migrate deploy
cd ../..

# Run seeder if database is empty
echo "🌱 Checking database..."
if [ ! -f "packages/db/prisma/sita_bi.db" ]; then
  echo "🌱 Running seeder..."
  cd packages/db
  pnpm db:seed
  cd ../..
fi

# Build web (Next.js needs build)
echo "🏗️  Building web..."
pnpm --filter web build

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 delete all || true

# Start with PM2
echo "▶️  Starting services with PM2..."
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "✅ Deployment complete!"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "🔗 Access:"
echo "   - API: https://sitabi-api.mooo.com"
echo "   - Web: https://sitabi.mooo.com"
echo ""
echo "📝 Useful commands:"
echo "   pm2 status       - Check status"
echo "   pm2 logs         - View logs"
echo "   pm2 restart all  - Restart all"
echo "   pm2 stop all     - Stop all"
