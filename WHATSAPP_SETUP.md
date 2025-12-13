# WhatsApp Setup - Quick Guide

## 🚀 Setup Pertama Kali

### 1. Start Server
```bash
pnpm --filter api run dev
```

### 2. Lihat Log
Tunggu sampai muncul:
```
📱 QR Code generated. Access at: GET /api/whatsapp/qr
```

### 3. Scan QR Code
Buka browser: `http://localhost:3002/api/whatsapp/qr`

Atau gunakan curl untuk melihat QR di terminal:
```bash
curl http://localhost:3002/api/whatsapp/qr
```

### 4. Scan dengan WhatsApp
- Buka WhatsApp di HP
- Tap menu (3 titik) → Linked Devices
- Tap "Link a Device"
- Scan QR code

### 5. Tunggu Connected
Log akan menampilkan:
```
🔐 WhatsApp authenticated
✅ WhatsApp connected
```

## 🔄 Server Restart (Auto-Reconnect)

### Jika Session Valid:
```
🔄 Reconnecting WhatsApp with existing session...
🔄 Loading WhatsApp session... 50%
🔐 WhatsApp authenticated with existing session
✅ WhatsApp reconnected successfully
```
**Waktu**: 10-30 detik
**Action**: Tidak perlu apa-apa, tunggu saja

### Jika Session Expired:
```
🔄 Reconnecting WhatsApp with existing session...
⏳ Session loading timeout. Falling back to QR code...
📱 QR Code ready. Access at: GET /api/whatsapp/qr
```
**Action**: Scan QR code lagi

## ❌ Troubleshooting

### Session Tidak Connect Setelah 2 Menit

**Solusi 1: Hapus Session Manual**
```bash
# Stop server (Ctrl+C)
rm -rf apps/api/.wwebjs_auth
pnpm --filter api run dev
# Scan QR code
```

**Solusi 2: Cek WhatsApp di HP**
- Buka WhatsApp → Settings → Linked Devices
- Jika ada device lama, hapus
- Scan QR code baru

**Solusi 3: Restart Bersih**
```bash
# Stop server
Ctrl+C

# Hapus session
rm -rf apps/api/.wwebjs_auth

# Hapus cache node_modules (optional)
rm -rf node_modules/whatsapp-web.js

# Install ulang
pnpm install

# Start server
pnpm --filter api run dev
```

### QR Code Tidak Muncul di Browser

**Cek endpoint**:
```bash
curl http://localhost:3002/api/whatsapp/status
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "isReady": false,
    "hasQR": true
  }
}
```

Jika `hasQR: true`, QR code tersedia di `/api/whatsapp/qr`

### WhatsApp Disconnect Sendiri

**Penyebab**:
- WhatsApp logout dari HP
- Koneksi internet terputus
- Session expired

**Solusi**:
```bash
# Hapus session dan scan ulang
rm -rf apps/api/.wwebjs_auth
# Restart server akan auto-generate QR
```

## 📊 Status Check

### Via API:
```bash
curl http://localhost:3002/api/whatsapp/status
```

### Via Log:
Cari salah satu dari:
- ✅ WhatsApp connected
- ✅ WhatsApp reconnected successfully
- ⚠️ WhatsApp not connected

## 🎯 Expected Behavior

### Development Mode:
1. **First time**: Scan QR → Session saved
2. **Restart**: Auto-reconnect (10-30s)
3. **Session expired**: Auto-delete → Generate QR baru

### Production Mode:
1. **Deploy**: Scan QR setiap deploy
2. **Restart**: Scan QR lagi (session tidak preserved)

## 💡 Tips

### Agar Tidak Perlu Scan Terus:
1. Jangan logout WhatsApp dari HP
2. Jangan hapus session manual kecuali ada masalah
3. Pastikan koneksi internet stabil

### Jika Sering Disconnect:
1. Cek koneksi internet
2. Cek WhatsApp di HP masih login
3. Cek Linked Devices di WhatsApp

### Development Workflow:
```bash
# Normal restart (preserve session)
Ctrl+C
pnpm --filter api run dev

# Clean restart (delete session)
Ctrl+C
rm -rf apps/api/.wwebjs_auth
pnpm --filter api run dev
```

## 🔒 Security Notes

### Session Location:
```
apps/api/.wwebjs_auth/
```

### .gitignore:
Session folder sudah ada di `.gitignore`, tidak akan ter-commit

### Production:
- Session dihapus saat shutdown
- Perlu scan QR setiap deploy
- Lebih aman

## 📝 Quick Commands

```bash
# Check session exists
ls -la apps/api/.wwebjs_auth/

# Delete session
rm -rf apps/api/.wwebjs_auth

# Check WhatsApp status
curl http://localhost:3002/api/whatsapp/status

# View QR code
curl http://localhost:3002/api/whatsapp/qr

# Restart server (nodemon)
rs
```

---

**TL;DR**:
1. Start server → Scan QR → Connected
2. Restart server → Auto-reconnect (tunggu 30s)
3. Jika tidak connect → Hapus session → Scan QR lagi
