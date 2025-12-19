#!/bin/bash

# Script untuk memastikan direktori volume Docker ada dan memiliki permission yang benar

echo "🔧 Setting up Docker volumes directories..."

# Buat direktori jika belum ada
mkdir -p ~/sitabi/database
mkdir -p ~/sitabi/uploads
mkdir -p ~/sitabi/documentation
mkdir -p ~/waha-sessions

# Set permission yang benar
chmod 755 ~/sitabi/database
chmod 755 ~/sitabi/uploads
chmod 755 ~/sitabi/documentation
chmod 755 ~/waha-sessions

echo "✅ Volume directories created successfully:"
echo "   📁 ~/sitabi/database"
echo "   📁 ~/sitabi/uploads" 
echo "   📁 ~/sitabi/documentation"
echo "   📁 ~/waha-sessions"

# Cek apakah database sudah ada
if [ -f ~/sitabi/database/sita_bi.db ]; then
    echo "ℹ️  Database file already exists: ~/sitabi/database/sita_bi.db"
    echo "   Size: $(du -h ~/sitabi/database/sita_bi.db | cut -f1)"
else
    echo "🆕 Database file will be created on first run"
fi

echo ""
echo "🚀 Ready to run: docker-compose up -d"