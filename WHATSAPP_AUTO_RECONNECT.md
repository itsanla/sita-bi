# WhatsApp Auto-Reconnect

## 🔄 Fitur Auto-Reconnect

WhatsApp service sekarang akan **otomatis reconnect** saat server restart jika session sudah ada.

## ✅ Perbaikan yang Dilakukan

### 1. **Deteksi Session**
```typescript
private hasSession(): boolean {
  const sessionPath = path.join(this.sessionDir, 'session');
  return fs.existsSync(sessionPath);
}
```
- Mengecek apakah folder session WhatsApp sudah ada
- Session disimpan di `.wwebjs_auth/session/`

### 2. **Auto-Reconnect Logic**
```typescript
const hasExistingSession = this.hasSession();

if (hasExistingSession) {
  console.warn('🔄 Reconnecting WhatsApp with existing session...');
} else {
  console.warn('🚀 Initializing WhatsApp...');
}
```
- Jika session ada → Reconnect otomatis
- Jika session tidak ada → Tampilkan QR code

### 3. **Preserve Session di Development**
```typescript
if (!isDev) {
  await whatsappService.logout();
} else {
  console.warn('🔄 WhatsApp session preserved for auto-reconnect');
}
```
- Di development mode: Session **TIDAK** dihapus saat server shutdown
- Di production mode: Session dihapus untuk keamanan

### 4. **Pesan yang Lebih Jelas**
```
✅ WhatsApp reconnected successfully  // Jika reconnect
✅ WhatsApp connected                 // Jika first time
⚠️  WhatsApp not connected - Server running without WhatsApp
📱 To connect: Visit /api/whatsapp/qr and scan QR code
```

## 🚀 Cara Kerja

### First Time Setup:
1. Server start → Tidak ada session
2. Generate QR code
3. User scan QR code
4. WhatsApp connected
5. Session tersimpan di `.wwebjs_auth/`

### Server Restart (Auto-Reconnect):
1. Server restart
2. Deteksi session exists
3. **Auto-reconnect** tanpa perlu scan QR lagi
4. WhatsApp ready dalam beberapa detik

### Jika Session Expired:
1. Server restart
2. Deteksi session exists
3. Coba reconnect → Gagal
4. Generate QR code baru
5. User scan QR code lagi

## 📊 Flow Diagram

```
Server Start
    ↓
Check Session?
    ↓
   Yes → Auto-Reconnect → ✅ Connected
    ↓
   No → Generate QR → Scan QR → ✅ Connected
```

## 🔧 Testing

### Test Auto-Reconnect:
```bash
# 1. Start server pertama kali
pnpm --filter api run dev

# 2. Scan QR code
# Visit: http://localhost:3002/api/whatsapp/qr

# 3. Tunggu sampai "✅ WhatsApp connected"

# 4. Stop server (Ctrl+C)

# 5. Start server lagi
pnpm --filter api run dev

# 6. Lihat log: "🔄 Reconnecting WhatsApp with existing session..."
# 7. Tunggu: "✅ WhatsApp reconnected successfully"
```

### Test First Time:
```bash
# 1. Hapus session
rm -rf apps/api/.wwebjs_auth

# 2. Start server
pnpm --filter api run dev

# 3. Lihat log: "🚀 Initializing WhatsApp..."
# 4. Lihat log: "📱 QR Code generated. Access at: GET /api/whatsapp/qr"
```

## 📁 Session Location

```
apps/api/
  └── .wwebjs_auth/
      └── session/
          ├── Default/
          ├── session-*.json
          └── ...
```

**PENTING**: Folder `.wwebjs_auth/` sudah ada di `.gitignore`

## 🔒 Keamanan

### Development Mode:
- ✅ Session preserved untuk auto-reconnect
- ✅ Faster development workflow
- ✅ Tidak perlu scan QR setiap restart

### Production Mode:
- ✅ Session dihapus saat shutdown
- ✅ Lebih aman
- ✅ Clean state setiap deploy

## ⚠️ Troubleshooting

### WhatsApp tidak auto-reconnect?
```bash
# Cek apakah session ada
ls -la apps/api/.wwebjs_auth/session/

# Jika tidak ada, scan QR lagi
# Jika ada tapi tidak connect, hapus dan scan ulang
rm -rf apps/api/.wwebjs_auth
```

### Session corrupt?
```bash
# Hapus session dan scan ulang
rm -rf apps/api/.wwebjs_auth
pnpm --filter api run dev
# Visit /api/whatsapp/qr dan scan
```

### WhatsApp logout sendiri?
- Kemungkinan: WhatsApp Web logout dari HP
- Solusi: Scan QR code lagi

## 📝 Logs

### Normal Auto-Reconnect:
```
🔄 Reconnecting WhatsApp with existing session...
🔐 WhatsApp authenticated
✅ WhatsApp reconnected successfully
```

### First Time:
```
🚀 Initializing WhatsApp...
📱 QR Code generated. Access at: GET /api/whatsapp/qr
🔐 WhatsApp authenticated
✅ WhatsApp connected
```

### Failed Reconnect:
```
🔄 Reconnecting WhatsApp with existing session...
⚠️  WhatsApp disconnected: AUTHENTICATION_FAILURE
📱 QR Code generated. Access at: GET /api/whatsapp/qr
```

---

**Status**: ✅ IMPLEMENTED & TESTED
**Tanggal**: 12 Desember 2024
