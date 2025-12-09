# Testing Penjadwalan Sidang Pintar

## Persiapan

1. **Pastikan Aturan Sudah Diset** di `/dashboard/dosen/aturan-umum`:
   - Maksimal Mahasiswa Uji per Dosen: 4
   - Durasi Sidang: 90 menit
   - Jeda Sidang: 15 menit
   - Jam Operasional: 08:00 - 15:00
   - Hari Libur Tetap: (pilih hari libur)
   - Ruangan Sidang: minimal 1 ruangan (contoh: "ruang 2", "ruang 3")

2. **Pastikan Ada Mahasiswa Siap Sidang**:
   - Mahasiswa harus sudah mendaftar sidang
   - Status pendaftaran: disetujui
   - Status sidang: `menunggu_penjadwalan`

3. **Pastikan Ada Dosen**:
   - Minimal 3 dosen untuk menjadi penguji
   - Dosen tidak boleh menjadi pembimbing mahasiswa yang dijadwalkan

## Cara Testing

### 1. Akses Halaman Penjadwalan
```
http://localhost:3001/dashboard/dosen/penjadwalan
```

### 2. Lihat Mahasiswa Siap Sidang
- Akan muncul list mahasiswa yang menunggu penjadwalan
- Jumlah mahasiswa ditampilkan di card "Mahasiswa Siap Sidang"

### 3. Generate Jadwal Sekarang
- Klik tombol **"Jadwalkan Sekarang"**
- Sistem akan:
  - Sync ruangan dari pengaturan ke database
  - Generate time slots berdasarkan aturan
  - Cek conflict ruangan dan dosen
  - Assign 3 penguji secara random
  - Simpan jadwal ke database

### 4. Lihat Hasil
- Akan muncul card "Hasil Penjadwalan"
- Menampilkan:
  - Jumlah berhasil (hijau)
  - Jumlah gagal (merah)
  - Detail setiap mahasiswa dengan tanggal & waktu

## API Endpoints

### Generate Jadwal
```bash
POST /api/jadwal-sidang-smart/generate
Authorization: Bearer <token>
```

### List Mahasiswa Siap
```bash
GET /api/jadwal-sidang-smart/mahasiswa-siap
Authorization: Bearer <token>
```

### List Jadwal Sidang
```bash
GET /api/jadwal-sidang-smart/jadwal
Authorization: Bearer <token>
```

## Algoritma Penjadwalan

1. **Ambil Pengaturan** dari database
2. **Sync Ruangan** dari pengaturan ke tabel Ruangan
3. **Generate Time Slots**:
   - Mulai dari besok
   - Skip hari libur tetap & tanggal libur khusus
   - Buat slot per ruangan sesuai jam operasional
   - Durasi slot = durasi_sidang + jeda_sidang
4. **Untuk Setiap Mahasiswa**:
   - Cari slot yang available (tidak bentrok ruangan)
   - Cari dosen available:
     - Tidak bentrok jadwal
     - Bukan pembimbing mahasiswa tersebut
     - Belum mencapai kuota maksimal
   - Jika ada >= 3 dosen, shuffle dan assign sebagai penguji1/2/3
   - Simpan jadwal dan update status sidang
5. **Return Hasil** (success/failed per mahasiswa)

## Validasi Bisnis

- ✅ Pembimbing tidak boleh jadi penguji
- ✅ Dosen tidak boleh bentrok jadwal
- ✅ Ruangan tidak boleh bentrok
- ✅ Dosen tidak boleh melebihi kuota maksimal
- ✅ Ketiga penguji harus berbeda (random assignment)
- ✅ Hari libur tidak dijadwalkan
- ✅ Jam operasional dipatuhi

## Troubleshooting

### Tidak Ada Mahasiswa Muncul
- Cek status sidang di database: `status_hasil = 'menunggu_penjadwalan'`
- Cek `is_active = true`

### Generate Gagal Semua
- Cek apakah ada ruangan di pengaturan
- Cek apakah ada dosen yang available
- Cek kuota dosen (mungkin sudah penuh)

### Error "Tidak ada ruangan tersedia"
- Tambahkan ruangan di `/dashboard/dosen/aturan-umum`
- Ruangan akan otomatis di-sync saat generate

## Database Schema

### JadwalSidang
```sql
id, sidang_id, tanggal, waktu_mulai, waktu_selesai, ruangan_id
```

### PeranDosenTa
```sql
id, tugas_akhir_id, dosen_id, peran (penguji1/penguji2/penguji3)
```

### Ruangan
```sql
id, nama_ruangan (unique), lokasi, kapasitas
```
