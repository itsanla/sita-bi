#!/bin/bash

# Script deployment production yang aman dengan backup otomatis

set -e

echo "🚀 SITA-BI Production Deployment"
echo "================================"

# Fungsi untuk rollback jika terjadi error
rollback() {
    echo ""
    echo "❌ Deployment failed! Rolling back..."
    if [ -f "$BACKUP_FILE" ]; then
        echo "🔄 Restoring database from backup..."
        cp "$BACKUP_FILE" "$HOME/sitabi/database/sita_bi.db"
    fi
    docker-compose down
    docker-compose up -d
    echo "🔄 Rollback completed"
    exit 1
}

# Set trap untuk rollback otomatis jika ada error
trap rollback ERR

# 1. Setup direktori volume
echo "1️⃣ Setting up volume directories..."
./setup-volumes.sh

# 2. Backup database jika ada
if [ -f "$HOME/sitabi/database/sita_bi.db" ]; then
    echo ""
    echo "2️⃣ Creating database backup..."
    ./backup-database.sh
    BACKUP_FILE="$HOME/sitabi/backups/sita_bi_backup_$(date +"%Y%m%d_%H%M%S").db"
else
    echo ""
    echo "2️⃣ No existing database found, skipping backup..."
fi

# 3. Pull latest images
echo ""
echo "3️⃣ Pulling latest Docker images..."
docker-compose pull

# 4. Stop services gracefully
echo ""
echo "4️⃣ Stopping services..."
docker-compose down --timeout 30

# 5. Start services
echo ""
echo "5️⃣ Starting services..."
docker-compose up -d

# 6. Wait for services to be healthy
echo ""
echo "6️⃣ Waiting for services to be healthy..."
sleep 10

# Check API health
for i in {1..30}; do
    if curl -f http://localhost:3002/health >/dev/null 2>&1; then
        echo "✅ API is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API health check failed after 30 attempts"
        rollback
    fi
    echo "⏳ Waiting for API... (attempt $i/30)"
    sleep 2
done

# Check Web health  
for i in {1..30}; do
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        echo "✅ Web is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Web health check failed after 30 attempts"
        rollback
    fi
    echo "⏳ Waiting for Web... (attempt $i/30)"
    sleep 2
done

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔗 Access URLs:"
echo "   🌐 Web: http://localhost:3001"
echo "   🔌 API: http://localhost:3002"
echo "   📱 WhatsApp: http://localhost:3000"
echo ""
echo "📁 Data Locations:"
echo "   💾 Database: ~/sitabi/database/"
echo "   📎 Uploads: ~/sitabi/uploads/"
echo "   📚 Documentation: ~/sitabi/documentation/"
echo "   💬 WhatsApp Sessions: ~/waha-sessions/"