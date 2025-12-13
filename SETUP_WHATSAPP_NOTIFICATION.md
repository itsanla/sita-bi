# Setup WhatsApp Notification untuk Pengajuan Pembimbing

## Prerequisites

1. **WAHA (WhatsApp HTTP API)** - Service untuk mengirim WhatsApp
2. **Database** - Pastikan field `phone_number` di tabel `users` sudah terisi
3. **Environment Variables** - Konfigurasi yang diperlukan

## Step 1: Setup WAHA Service

### Option A: Docker (Recommended)
```bash
# Pull WAHA image
docker pull devlikeapro/waha

# Run WAHA container
docker run -it --rm \
  -p 3000:3000/tcp \
  -v $(pwd)/.wwebjs_cache:/app/.wwebjs_cache \
  devlikeapro/waha
```

### Option B: Docker Compose
Buat file `docker-compose.waha.yml`:
```yaml
version: '3.8'
services:
  waha:
    image: devlikeapro/waha
    ports:
      - "3000:3000"
    volumes:
      - ./.wwebjs_cache:/app/.wwebjs_cache
    environment:
      - WAHA_PRINT_QR=true
```

Jalankan:
```bash
docker-compose -f docker-compose.waha.yml up -d
```

## Step 2: Konfigurasi Environment Variables

Edit file `/apps/api/.env`:
```env
# WhatsApp Configuration (WAHA)
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_waha_api_key_here
WHATSAPP_AUTO_INIT=true
WHATSAPP_NOTIFICATIONS_ENABLED=true
```

## Step 3: Setup WhatsApp Connection

### 1. Start API Server
```bash
cd apps/api
npm run dev
```

### 2. Initialize WhatsApp Session
Buka browser dan akses: `http://localhost:3001/api/whatsapp/qr`

### 3. Scan QR Code
- Buka WhatsApp di HP
- Pilih Menu → Linked Devices
- Tap "Link a Device"
- Scan QR code yang muncul di browser

### 4. Verify Connection
```bash
curl http://localhost:3001/api/whatsapp/status
```

Response yang diharapkan:
```json
{
  "success": true,
  "data": {
    "isReady": true,
    "hasQR": false,
    "qrCode": null,
    "isInitializing": false
  }
}
```

## Step 4: Setup Database

Pastikan field `phone_number` di tabel `users` sudah terisi dengan format yang benar:

### Format Nomor HP yang Didukung:
- `+62812345678` (dengan +)
- `62812345678` (tanpa +)
- `0812345678` (akan otomatis dikonversi ke 62812345678)

### Update Nomor HP via SQL:
```sql
-- Update nomor HP mahasiswa
UPDATE users SET phone_number = '62812345678' 
WHERE id IN (SELECT user_id FROM mahasiswa);

-- Update nomor HP dosen
UPDATE users SET phone_number = '62812345679' 
WHERE id IN (SELECT user_id FROM dosen);
```

### Update Nomor HP via API:
```bash
curl -X PUT http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"phone_number": "62812345678"}'
```

## Step 5: Testing

### 1. Test WhatsApp Connection
```bash
curl http://localhost:3001/api/whatsapp/health
```

### 2. Test Send Message
```bash
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "to": "62812345678",
    "message": "Test message from SITA BI"
  }'
```

### 3. Test Pengajuan Notification
```bash
# Login sebagai mahasiswa
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mahasiswa@example.com",
    "password": "password"
  }'

# Ajukan pembimbing (akan mengirim notifikasi ke dosen)
curl -X POST http://localhost:3001/api/pengajuan/mahasiswa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <mahasiswa_token>" \
  -d '{
    "dosenId": 1,
    "peran": "pembimbing1"
  }'
```

### 4. Test dengan Script
```bash
cd apps/api
node test-whatsapp-notification.js
```

## Step 6: Monitoring

### 1. Check Logs
```bash
# API logs
tail -f apps/api/logs/app.log

# WAHA logs
docker logs -f <waha_container_id>
```

### 2. WhatsApp Status Dashboard
Akses: `http://localhost:3001/api/whatsapp/qr`

### 3. Database Monitoring
```sql
-- Cek pengajuan terbaru
SELECT * FROM pengajuan_bimbingan 
ORDER BY created_at DESC LIMIT 10;

-- Cek user dengan nomor HP
SELECT id, name, email, phone_number 
FROM users 
WHERE phone_number IS NOT NULL;
```

## Troubleshooting

### 1. WAHA Tidak Terhubung
**Problem**: `isReady: false`

**Solution**:
```bash
# Restart WAHA container
docker restart <waha_container_id>

# Clear cache
rm -rf .wwebjs_cache

# Re-scan QR code
curl -X POST http://localhost:3001/api/whatsapp/initialize
```

### 2. Notifikasi Tidak Terkirim
**Problem**: Error di log "Failed to send WhatsApp notification"

**Check**:
1. WhatsApp connection status
2. Nomor HP format
3. WAHA service status

**Solution**:
```bash
# Check WhatsApp status
curl http://localhost:3001/api/whatsapp/status

# Test send message manually
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "to": "62812345678",
    "message": "Test"
  }'
```

### 3. Format Nomor HP Salah
**Problem**: Nomor HP tidak valid

**Check Format**:
- Harus dimulai dengan 62 (kode Indonesia)
- Tidak boleh ada spasi atau karakter khusus
- Contoh valid: `62812345678`

**Fix**:
```sql
-- Update format nomor HP
UPDATE users 
SET phone_number = REPLACE(REPLACE(phone_number, '+', ''), ' ', '')
WHERE phone_number LIKE '+%' OR phone_number LIKE '% %';

-- Convert 08xx ke 628xx
UPDATE users 
SET phone_number = CONCAT('62', SUBSTRING(phone_number, 2))
WHERE phone_number LIKE '08%';
```

### 4. WAHA Session Expired
**Problem**: QR code muncul lagi setelah beberapa waktu

**Solution**:
```bash
# Re-scan QR code
curl -X POST http://localhost:3001/api/whatsapp/initialize

# Check session
curl http://localhost:3001/api/whatsapp/status
```

## Production Deployment

### 1. Environment Variables
```env
WAHA_URL=http://waha:3000  # Internal Docker network
WAHA_API_KEY=secure_api_key_here
WHATSAPP_AUTO_INIT=false   # Manual init in production
WHATSAPP_NOTIFICATIONS_ENABLED=true
```

### 2. Docker Compose Production
```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    environment:
      - WAHA_URL=http://waha:3000
    depends_on:
      - waha
  
  waha:
    image: devlikeapro/waha
    volumes:
      - waha_cache:/app/.wwebjs_cache
    environment:
      - WAHA_API_KEY=${WAHA_API_KEY}

volumes:
  waha_cache:
```

### 3. Health Checks
```bash
# Add to monitoring script
curl -f http://localhost:3001/api/whatsapp/health || exit 1
```

## Security Considerations

1. **API Key**: Gunakan API key yang kuat untuk WAHA
2. **Network**: Batasi akses ke WAHA hanya dari API server
3. **Data Privacy**: Nomor HP adalah data sensitif, pastikan enkripsi
4. **Rate Limiting**: Implementasi rate limiting untuk WhatsApp API
5. **Logging**: Jangan log nomor HP atau isi pesan

## Performance Tips

1. **Connection Pooling**: WAHA menggunakan satu session untuk semua request
2. **Async Processing**: Notifikasi dikirim async agar tidak menghambat response
3. **Error Handling**: Gagal kirim notifikasi tidak mengganggu flow utama
4. **Caching**: Cache status WhatsApp untuk mengurangi API calls
5. **Batch Processing**: Untuk broadcast, gunakan delay antar pesan

## Maintenance

### Daily Tasks
- Check WhatsApp connection status
- Monitor notification logs
- Verify WAHA container health

### Weekly Tasks
- Clean up old WAHA cache
- Review notification delivery rates
- Update phone numbers if needed

### Monthly Tasks
- Rotate WAHA API keys
- Review and optimize notification templates
- Performance analysis