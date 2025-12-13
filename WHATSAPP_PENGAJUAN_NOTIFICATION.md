# WhatsApp Notification untuk Pengajuan Pembimbing

## Overview
Fitur ini menambahkan notifikasi WhatsApp otomatis ketika terjadi aktivitas pengajuan pembimbing antara mahasiswa dan dosen.

## Fitur yang Ditambahkan

### 1. Notifikasi Pengajuan Pembimbing (Mahasiswa → Dosen)
- **Trigger**: Ketika mahasiswa mengajukan dosen sebagai pembimbing
- **Penerima**: Dosen yang diajukan
- **Pesan**: 
  ```
  🔔 *Pengajuan Pembimbing*

  Mahasiswa [Nama Mahasiswa] mengajukan permohonan kepada Anda untuk menjadi [Pembimbing 1/2].

  Silahkan lihat detailnya pada link berikut:
  ${FRONTEND_URL}/dashboard/dosen/pengajuan
  ```

### 2. Notifikasi Tawaran Pembimbing (Dosen → Mahasiswa)
- **Trigger**: Ketika dosen menawarkan diri sebagai pembimbing
- **Penerima**: Mahasiswa yang ditawari
- **Pesan**:
  ```
  🔔 *Tawaran Pembimbing*

  [Nama Dosen] menawarkan diri untuk menjadi [Pembimbing 1/2] Anda.

  Silahkan lihat detailnya pada link berikut:
  http://localhost:3001/dashboard/mahasiswa/pengajuan
  ```

### 3. Notifikasi Persetujuan Pengajuan
- **Trigger**: Ketika pengajuan/tawaran disetujui
- **Penerima**: Pihak yang mengajukan/menawarkan
- **Pesan**:
  ```
  ✅ *Pengajuan Disetujui*

  [Nama Penyetuju] telah menyetujui [pengajuan/tawaran] untuk menjadi [Pembimbing 1/2].

  Silahkan lihat detailnya pada dashboard Anda.
  ```

### 4. Notifikasi Penolakan Pengajuan
- **Trigger**: Ketika pengajuan/tawaran ditolak
- **Penerima**: Pihak yang mengajukan/menawarkan
- **Pesan**:
  ```
  ❌ *Pengajuan Ditolak*

  [Nama Penolak] telah menolak [pengajuan/tawaran] untuk menjadi [Pembimbing 1/2].

  Silahkan lihat detailnya pada dashboard Anda.
  ```

### 5. Notifikasi Pembatalan Pengajuan
- **Trigger**: Ketika pengajuan/tawaran dibatalkan
- **Penerima**: Pihak lawan (yang tidak membatalkan)
- **Pesan**:
  ```
  🚫 *Pengajuan Dibatalkan*

  [Nama Pembatal] telah membatalkan [pengajuan/tawaran] untuk menjadi [Pembimbing 1/2].

  Silahkan lihat detailnya pada dashboard Anda.
  ```

## File yang Dimodifikasi

### 1. `/apps/api/src/services/pengajuan.service.ts`
- Menambahkan import `NotificationHelperService`
- Menambahkan pengiriman notifikasi di setiap method:
  - `ajukanKeDosen()` - Notifikasi ke dosen
  - `tawariMahasiswa()` - Notifikasi ke mahasiswa
  - `terimaPengajuan()` - Notifikasi persetujuan
  - `tolakPengajuan()` - Notifikasi penolakan
  - `batalkanPengajuan()` - Notifikasi pembatalan

### 2. `/apps/api/src/services/notification-helper.service.ts` (Baru)
- Service helper untuk mengirim notifikasi WhatsApp
- Method yang tersedia:
  - `sendPengajuanPembimbingNotification()`
  - `sendTawaranPembimbingNotification()`
  - `sendPengajuanDisetujuiNotification()`
  - `sendPengajuanDitolakNotification()`
  - `sendPengajuanDibatalkanNotification()`

### 3. `/apps/api/src/services/waha-whatsapp.service.ts`
- Menambahkan interface `NotificationData` dengan field baru
- Menambahkan case baru di method `sendNotification()`:
  - `PENGAJUAN_PEMBIMBING`
  - `TAWARAN_PEMBIMBING`
  - `PENGAJUAN_DISETUJUI`
  - `PENGAJUAN_DITOLAK`

## Cara Kerja

1. **Setup WhatsApp**: Pastikan WAHA WhatsApp service sudah terkonfigurasi dan terhubung
2. **Data Nomor HP**: Pastikan field `phone_number` di tabel `users` sudah terisi dengan format yang benar
3. **Automatic Trigger**: Notifikasi akan dikirim otomatis ketika ada aktivitas pengajuan
4. **Error Handling**: Jika pengiriman WhatsApp gagal, proses pengajuan tetap berlanjut (tidak mengganggu flow utama)

## Konfigurasi

### Environment Variables
Pastikan variabel berikut sudah dikonfigurasi di `.env`:
```
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_api_key_here
```

### Format Nomor HP
Nomor HP harus dalam format Indonesia:
- Dengan kode negara: `+62812345678` atau `62812345678`
- Tanpa kode negara: `0812345678` (akan otomatis dikonversi ke `62812345678`)

## Testing

### 1. Test Pengajuan Mahasiswa
```bash
curl -X POST http://localhost:3001/api/pengajuan/mahasiswa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dosenId": 1,
    "peran": "pembimbing1"
  }'
```

### 2. Test Tawaran Dosen
```bash
curl -X POST http://localhost:3001/api/pengajuan/dosen \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "mahasiswaId": 1,
    "peran": "pembimbing1"
  }'
```

### 3. Test Persetujuan
```bash
curl -X POST http://localhost:3001/api/pengajuan/1/terima \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### 1. Notifikasi Tidak Terkirim
- Cek status WAHA: `GET /api/whatsapp/status`
- Cek koneksi WhatsApp: `GET /api/whatsapp/qr`
- Cek log server untuk error message

### 2. Format Nomor HP Salah
- Pastikan nomor HP dalam format yang benar
- Cek method `formatPhoneNumber()` di WhatsApp service

### 3. WAHA Tidak Terhubung
- Restart WAHA service
- Scan ulang QR code
- Cek konfigurasi environment variables

## Monitoring

### Log Messages
- ✅ `WhatsApp notification sent to [phone]` - Berhasil
- ❌ `Failed to send WhatsApp notification: [error]` - Gagal

### Database
Notifikasi tidak disimpan di database, hanya dikirim langsung via WhatsApp.

## Future Enhancements

1. **Template Management**: Membuat template pesan yang bisa dikustomisasi
2. **Notification History**: Menyimpan riwayat notifikasi di database
3. **Multiple Channels**: Menambahkan email notification sebagai backup
4. **Retry Mechanism**: Menambahkan retry otomatis jika pengiriman gagal
5. **User Preferences**: Memberikan opsi untuk enable/disable notifikasi per user