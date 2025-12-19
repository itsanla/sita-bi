#!/bin/bash

# Script untuk backup database SQLite

BACKUP_DIR="$HOME/sitabi/backups"
DB_PATH="$HOME/sitabi/database/sita_bi.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sita_bi_backup_$TIMESTAMP.db"

echo "💾 Creating database backup..."

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

# Cek apakah database ada
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database file not found: $DB_PATH"
    exit 1
fi

# Backup database
cp "$DB_PATH" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully:"
    echo "   📁 $BACKUP_FILE"
    echo "   📊 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Hapus backup lama (simpan hanya 10 backup terakhir)
    ls -t "$BACKUP_DIR"/sita_bi_backup_*.db | tail -n +11 | xargs -r rm
    echo "🧹 Old backups cleaned up (keeping latest 10)"
else
    echo "❌ Backup failed!"
    exit 1
fi