# WhatsApp Troubleshooting Guide

## 🔍 Memahami Log WhatsApp

### Scenario 1: First Time Setup (Tidak Ada Session)
```
🚀 Initializing WhatsApp...
📱 QR Code generated. Access at: GET /api/whatsapp/qr
[Scan QR code]
🔐 WhatsApp authenticated
✅ WhatsApp connected
```
**Action**: Scan QR code di `/api/whatsapp/qr`

### Scenario 2: Auto-Reconnect (Session Valid)
```
🔄 Reconnecting WhatsApp with existing session...
⏳ Waiting for session to load... (QR shown as fallback)
🔄 Loading WhatsApp session...
🔐 WhatsApp authenticated with existing session
✅ WhatsApp reconnected successfully
```
**Action**: Tunggu 10-30 detik, akan connect otomatis

### Scenario 3: Session Expired/Invalid
```
🔄 Reconnecting WhatsApp with existing session...
📱 QR Code generated. Access at: GET /api/whatsapp/qr
❌ WhatsApp auth failed: Session expired
🔄 Session may be invalid. Please scan QR code again.
```
**Action**: Hapus session dan scan QR baru

## ⚠️ Kenapa QR Code Tetap Muncul?

WhatsApp Web.js **SELALU** generate QR code sebagai fallback, bahkan saat loading session. Ini **NORMAL**.

**Yang penting**: Tunggu 10-30 detik untuk melihat apakah:
- ✅ Muncul "🔐 WhatsApp authenticated with existing session" → **BERHASIL**
- ❌ Muncul "❌ WhatsApp auth failed" → **GAGAL, perlu scan ulang**

## 🔧 Troubleshooting Steps

### 1. Cek Status Session
```bash
cd apps/api
ls -la .wwebjs_auth/session/
```

**Jika folder kosong atau tidak ada**:
- Session tidak ada
- Perlu scan QR code

**Jika folder ada dan berisi file**:
- Session ada
- Tunggu 10-30 detik untuk auto-reconnect
- Jika gagal, lanjut ke step 2

### 2. Hapus Session dan Scan Ulang
```bash
# Stop server (Ctrl+C)

# Hapus session
rm -rf apps/api/.wwebjs_auth

# Start server
pnpm --filter api run dev

# Scan QR code
# Visit: http://localhost:3002/api/whatsapp/qr
```

### 3. Cek WhatsApp di HP
- Buka WhatsApp di HP
- Settings → Linked Devices
- Pastikan device "WhatsApp Web" masih aktif
- Jika tidak ada, scan QR code lagi

### 4. Restart Server dengan Clean State
```bash
# Stop server
Ctrl+C

# Hapus session
rm -rf apps/api/.wwebjs_auth

# Hapus node_modules whatsapp-web.js (jika perlu)
rm -rf node_modules/whatsapp-web.js

# Install ulang
pnpm install

# Start server
pnpm --filter api run dev
```

## 📊 Timeline Normal Auto-Reconnect

```
0s   → Server start
0s   → 🔄 Reconnecting WhatsApp with existing session...
1s   → ⏳ Waiting for session to load...
2-5s → 🔄 Loading WhatsApp session...
5-10s → 🔐 WhatsApp authenticated with existing session
10-15s → ✅ WhatsApp reconnected successfully
```

**Total waktu**: 10-30 detik (tergantung koneksi internet)

## ⚡ Quick Fix Commands

### Reset WhatsApp Completely
```bash
cd apps/api
rm -rf .wwebjs_auth
pnpm --filter api run dev
# Scan QR at http://localhost:3002/api/whatsapp/qr
```

### Check Session Status
```bash
cd apps/api
ls -la .wwebjs_auth/session/ | head -20
```

### Force Reconnect (Restart Server)
```bash
# Di terminal server, tekan:
rs
# Atau Ctrl+C lalu start ulang
```

## 🐛 Common Issues

### Issue 1: "QR Code generated" tapi tidak connect
**Penyebab**: Session loading atau expired
**Solusi**: 
1. Tunggu 30 detik
2. Jika tidak connect, hapus session dan scan ulang

### Issue 2: "WhatsApp disconnected" setelah beberapa saat
**Penyebab**: WhatsApp logout dari HP atau koneksi terputus
**Solusi**: Scan QR code ulang

### Issue 3: Server restart tapi tidak auto-reconnect
**Penyebab**: Session corrupt atau expired
**Solusi**: 
```bash
rm -rf apps/api/.wwebjs_auth
pnpm --filter api run dev
```

### Issue 4: "Puppeteer error" atau "Chrome not found"
**Penyebab**: Puppeteer tidak terinstall dengan benar
**Solusi**:
```bash
pnpm install
# Atau force reinstall puppeteer
pnpm add puppeteer --force
```

## 📱 Cara Scan QR Code

### Via Browser:
1. Buka: `http://localhost:3002/api/whatsapp/qr`
2. QR code akan muncul
3. Scan dengan WhatsApp di HP

### Via Terminal (jika enabled):
- QR code akan muncul di terminal
- Scan langsung dari terminal

## ✅ Verifikasi WhatsApp Connected

### Via API:
```bash
curl http://localhost:3002/api/whatsapp/status
```

**Response jika connected**:
```json
{
  "status": "success",
  "data": {
    "isReady": true,
    "hasQR": false
  }
}
```

### Via Log:
Cari log:
```
✅ WhatsApp connected
atau
✅ WhatsApp reconnected successfully
```

## 🔄 Development Workflow

### Normal Flow:
1. **First time**: Scan QR → Connected
2. **Server restart**: Auto-reconnect (10-30s)
3. **Session expired**: Scan QR lagi

### Best Practice:
- Jangan logout WhatsApp dari HP saat development
- Jangan hapus session kecuali ada masalah
- Tunggu 30 detik sebelum conclude "tidak connect"

## 📝 Log Interpretation

| Log | Meaning | Action |
|-----|---------|--------|
| 🚀 Initializing | First time setup | Scan QR |
| 🔄 Reconnecting | Loading session | Wait 30s |
| ⏳ Waiting | Session loading | Wait |
| 🔐 Authenticated | Auth success | Almost ready |
| ✅ Connected | Ready to use | ✅ Done |
| ❌ Auth failed | Session invalid | Scan QR |
| 📱 QR generated | Fallback QR | Wait or scan |

## 🎯 Expected Behavior

### Development Mode:
- ✅ Session preserved on restart
- ✅ Auto-reconnect in 10-30s
- ✅ QR shown as fallback (normal)
- ✅ No need to scan every restart

### Production Mode:
- ✅ Session cleared on shutdown
- ✅ Need to scan QR after deploy
- ✅ More secure

---

**TL;DR**: 
1. QR code muncul = **NORMAL** (fallback)
2. Tunggu 30 detik untuk auto-reconnect
3. Jika tidak connect, hapus session dan scan ulang
4. Jangan panic jika lihat QR code!
