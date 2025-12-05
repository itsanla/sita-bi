# Implementasi Periode Guard

## Deskripsi
Sistem sekarang memiliki mekanisme kontrol akses berdasarkan status periode TA. Ketika periode tidak aktif, mahasiswa dan dosen tidak dapat mengakses menu-menu tertentu kecuali **Dashboard** dan **Data Diri**.

## Perubahan yang Dilakukan

### 1. Middleware Periode Guard (`periode.middleware.ts`)
- Memeriksa apakah ada periode TA yang aktif
- Admin dan Jurusan **tidak terpengaruh** oleh periode guard (tetap bisa akses semua menu)
- Dosen dan Mahasiswa **harus** ada periode aktif untuk mengakses menu tertentu
- Response format disesuaikan dengan standar API (`status: 'gagal'`)

### 2. Router yang Dilindungi Periode Guard

#### Bimbingan Router (`bimbingan.router.ts`)
Semua endpoint bimbingan dilindungi:
- GET `/sebagai-dosen` - List bimbingan dosen
- GET `/sebagai-mahasiswa` - List bimbingan mahasiswa
- POST `/catatan` - Tambah catatan bimbingan
- POST `/sesi/:id/upload` - Upload lampiran
- POST `/sesi` - Buat sesi bimbingan
- PUT `/sesi/:id/jadwal` - Set jadwal sesi
- POST `/sesi/:id/konfirmasi` - Konfirmasi selesai
- POST `/:tugasAkhirId/jadwal` - Set jadwal bimbingan
- POST `/sesi/:id/cancel` - Batalkan sesi
- POST `/sesi/:id/selesaikan` - Selesaikan sesi
- GET `/conflicts` - Cek konflik jadwal
- GET `/available-slots` - Slot waktu tersedia
- DELETE `/sesi/:id` - Hapus sesi
- GET `/eligibility/:tugasAkhirId` - Cek kelayakan sidang
- POST `/sesi/:id/batalkan-validasi` - Batalkan validasi

#### Tugas Akhir Router (`tugas-akhir.router.ts`)
Endpoint yang dilindungi:
- POST `/check-similarity` - Cek kemiripan judul
- POST `/` - Buat tugas akhir baru
- GET `/my-ta` - Lihat TA sendiri
- DELETE `/my-ta` - Hapus TA sendiri
- PATCH `/my-ta/update-judul` - Update judul TA
- POST `/:id/validasi-judul` - Validasi judul oleh dosen

#### Pengajuan Router (`pengajuan.router.ts`)
Semua endpoint pengajuan bimbingan dilindungi:
- POST `/mahasiswa` - Mahasiswa ajukan ke dosen
- GET `/mahasiswa` - List pengajuan mahasiswa
- POST `/dosen` - Dosen tawarkan ke mahasiswa
- GET `/dosen` - List pengajuan dosen
- POST `/:id/terima` - Terima pengajuan
- POST `/:id/tolak` - Tolak pengajuan
- POST `/:id/batalkan` - Batalkan pengajuan
- GET `/dosen-tersedia` - List dosen tersedia
- GET `/mahasiswa-tersedia` - List mahasiswa tersedia
- POST `/lepaskan` - Ajukan pelepasan bimbingan
- POST `/lepaskan/:id/konfirmasi` - Konfirmasi pelepasan
- POST `/lepaskan/:id/tolak` - Tolak pelepasan
- POST `/lepaskan/:id/batalkan` - Batalkan pelepasan

#### Jadwal Sidang Router (`jadwal-sidang.router.ts`)
Endpoint yang dilindungi:
- GET `/for-penguji` - Jadwal sidang untuk penguji
- GET `/for-mahasiswa` - Jadwal sidang mahasiswa

#### Pendaftaran Sidang Router (`pendaftaran-sidang.router.ts`)
Semua endpoint dilindungi:
- POST `/` - Daftar sidang
- GET `/pending-approvals` - List persetujuan pending
- POST `/:id/approve` - Setujui pendaftaran
- POST `/:id/reject` - Tolak pendaftaran
- GET `/my-registration` - Lihat pendaftaran sendiri
- GET `/check-eligibility` - Cek kelayakan sidang

#### Tawaran Topik Router (`tawaran-topik.router.ts`)
Semua endpoint dilindungi:
- POST `/` - Buat tawaran topik
- GET `/` - List tawaran topik dosen
- GET `/available` - Topik tersedia untuk mahasiswa
- GET `/applications` - List aplikasi topik
- POST `/applications/:id/approve` - Setujui aplikasi
- POST `/applications/:id/reject` - Tolak aplikasi
- POST `/:id/apply` - Apply topik
- GET `/all/with-applications` - Semua topik dengan aplikasi

#### Penilaian Router (`penilaian.router.ts`)
Semua endpoint dilindungi:
- POST `/` - Buat penilaian
- GET `/sidang/:sidangId` - Lihat nilai sidang

#### Dokumen TA Router (`dokumen-ta.router.ts`)
Semua endpoint dilindungi:
- POST `/:tugasAkhirId/upload` - Upload dokumen
- POST `/:dokumenId/validasi` - Validasi dokumen

### 3. Menu yang TIDAK Dilindungi (Tetap Bisa Diakses)
- **Dashboard** - Semua endpoint di `dashboard.router.ts`
- **Data Diri** - Semua endpoint di `data-diri.router.ts`
- **Pengumuman** - Bisa dibaca kapan saja
- **Auth** - Login, register, dll

### 4. Seeder Database (`seed.ts`)
Ditambahkan data periode TA:
- **Periode Aktif**: Tahun 2024, Status: AKTIF
- **Periode Tidak Aktif**: Tahun 2023, Status: SELESAI
- Semua Tugas Akhir dikaitkan dengan periode aktif

## Cara Kerja

### Skenario 1: Periode Aktif
```
User: Mahasiswa/Dosen
Periode: AKTIF
Result: ✅ Bisa akses semua menu
```

### Skenario 2: Periode Tidak Aktif
```
User: Mahasiswa/Dosen
Periode: TIDAK AKTIF / NULL
Result: ❌ Hanya bisa akses Dashboard & Data Diri
Response: {
  "status": "gagal",
  "message": "Tidak ada periode TA yang aktif saat ini. Hubungi Ketua Jurusan.",
  "code": "PERIODE_NOT_ACTIVE"
}
```

### Skenario 3: Admin/Jurusan
```
User: Admin/Jurusan
Periode: Apapun
Result: ✅ Bisa akses semua menu (bypass periode guard)
```

## Testing

### 1. Test dengan Periode Aktif
```bash
# Login sebagai mahasiswa
POST /api/auth/login
{
  "email": "2101010001@student.pnp.ac.id",
  "password": "password123"
}

# Akses endpoint bimbingan (harus berhasil)
GET /api/bimbingan/sebagai-mahasiswa
```

### 2. Test dengan Periode Tidak Aktif
```bash
# Ubah status periode menjadi SELESAI di database
UPDATE periode_ta SET status = 'SELESAI' WHERE tahun = 2024;

# Login sebagai mahasiswa
POST /api/auth/login

# Akses endpoint bimbingan (harus ditolak)
GET /api/bimbingan/sebagai-mahasiswa
# Response: 403 Forbidden dengan pesan periode tidak aktif
```

### 3. Test sebagai Admin
```bash
# Login sebagai admin
POST /api/auth/login
{
  "email": "admin@pnp.ac.id",
  "password": "password123"
}

# Akses endpoint apapun (harus berhasil meskipun periode tidak aktif)
GET /api/bimbingan/sebagai-dosen
```

## Manajemen Periode

### Membuka Periode Baru
```typescript
// Endpoint: POST /api/periode/buka
{
  "tahun": 2025
}
```

### Menutup Periode Aktif
```typescript
// Endpoint: POST /api/periode/:id/tutup
{
  "catatan": "Periode TA 2024 ditutup"
}
```

## Catatan Penting
1. **Cache**: Periode aktif di-cache selama 1 menit untuk performa
2. **Admin/Jurusan**: Tidak terpengaruh periode guard
3. **Dashboard & Data Diri**: Selalu bisa diakses
4. **Pengumuman**: Bisa dibaca kapan saja
5. **Database**: Setiap migrate reset akan membuat 2 periode (1 aktif, 1 selesai)

## Kredensial Testing
```
Admin: admin@pnp.ac.id / password123
Jurusan: jurusan@pnp.ac.id / password123
Mahasiswa: 2101010001@student.pnp.ac.id / password123
Dosen: rina.anggraini@pnp.ac.id / password123
```
