#!/bin/bash

# Script untuk restore database dari backup

BACKUP_DIR="$HOME/sitabi/backups"
DB_PATH="$HOME/sitabi/database/sita_bi.db"

echo "🔄 Database restore utility"
echo ""

# Tampilkan daftar backup yang tersedia
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR"/sita_bi_backup_*.db 2>/dev/null)" ]; then
    echo "❌ No backup files found in $BACKUP_DIR"
    exit 1
fi

echo "📋 Available backups:"
ls -la "$BACKUP_DIR"/sita_bi_backup_*.db | awk '{print NR ". " $9 " (" $5 " bytes, " $6 " " $7 " " $8 ")"}'

echo ""
read -p "Enter backup number to restore (or 'q' to quit): " choice

if [ "$choice" = "q" ]; then
    echo "👋 Restore cancelled"
    exit 0
fi

# Ambil file backup berdasarkan pilihan
BACKUP_FILE=$(ls "$BACKUP_DIR"/sita_bi_backup_*.db | sed -n "${choice}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Invalid selection"
    exit 1
fi

echo ""
echo "⚠️  WARNING: This will replace the current database!"
echo "   Current: $DB_PATH"
echo "   Backup:  $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "👋 Restore cancelled"
    exit 0
fi

# Backup database saat ini sebelum restore
if [ -f "$DB_PATH" ]; then
    CURRENT_BACKUP="$BACKUP_DIR/sita_bi_before_restore_$(date +"%Y%m%d_%H%M%S").db"
    cp "$DB_PATH" "$CURRENT_BACKUP"
    echo "💾 Current database backed up to: $CURRENT_BACKUP"
fi

# Restore database
cp "$BACKUP_FILE" "$DB_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from:"
    echo "   📁 $BACKUP_FILE"
    echo ""
    echo "🔄 Please restart the API container:"
    echo "   docker-compose restart api"
else
    echo "❌ Restore failed!"
    exit 1
fi