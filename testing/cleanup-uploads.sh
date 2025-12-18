#!/bin/bash

# Script untuk cleanup file upload saat infinity test
UPLOAD_DIR="/media/anla/DATA_B/project/SEMESTER5/matkul-proyek/sita-bi/apps/api/uploads/bimbingan"

echo "🧹 Cleaning up upload files..."

if [ -d "$UPLOAD_DIR" ]; then
  # Hapus semua file di directory
  rm -f "$UPLOAD_DIR"/*
  echo "✅ Deleted all files in $UPLOAD_DIR"
  
  # Tampilkan jumlah file tersisa
  FILE_COUNT=$(ls -1 "$UPLOAD_DIR" 2>/dev/null | wc -l)
  echo "📁 Files remaining: $FILE_COUNT"
else
  echo "⚠️  Directory not found: $UPLOAD_DIR"
fi
