# Fitur Aturan Tugas Akhir

## Deskripsi
Fitur eksklusif untuk role **jurusan** yang memungkinkan pengaturan dinamis terhadap aturan-aturan sistem tugas akhir.

## Akses
- **Role**: `jurusan`, `admin`
- **Menu**: Dashboard Dosen → Aturan Tugas Akhir
- **Route Frontend**: `/dashboard/dosen/fitur-jurusan-1`
- **API Endpoint**: `/api/pengaturan`

## Pengaturan yang Dapat Diubah

### 1. Maksimal Persentase Similaritas
- **Key**: `max_similaritas_persen`
- **Default**: 80%
- **Range**: 0-100%
- **Deskripsi**: Batas maksimal similaritas dokumen tugas akhir yang diperbolehkan

### 2. Minimal Sesi Bimbingan Valid
- **Key**: `min_bimbingan_valid`
- **Default**: 9 sesi
- **Range**: Minimal 1 sesi
- **Deskripsi**: Jumlah minimal bimbingan yang harus diselesaikan sebelum mahasiswa dapat mendaftar sidang

### 3. Ruangan Sidang
- **Key**: `ruangan_sidang`
- **Default**: Ruangan A, Ruangan B
- **Format**: Array of strings
- **Deskripsi**: Daftar ruangan yang tersedia untuk pelaksanaan sidang

### 4. Maksimal Mahasiswa Bimbingan Aktif
- **Key**: `max_pembimbing_aktif`
- **Default**: 4 mahasiswa
- **Range**: Minimal 1 mahasiswa
- **Deskripsi**: Jumlah maksimal mahasiswa yang dapat dibimbing oleh satu dosen secara bersamaan

### 5. Durasi Sidang
- **Key**: `durasi_sidang_menit`
- **Default**: 90 menit
- **Range**: Minimal 30 menit
- **Deskripsi**: Durasi standar untuk setiap sesi sidang tugas akhir

### 6. Batas Waktu Revisi
- **Key**: `batas_revisi_hari`
- **Default**: 30 hari
- **Range**: Minimal 1 hari
- **Deskripsi**: Batas waktu pengumpulan revisi setelah sidang

## API Endpoints

### GET /api/pengaturan
Mengambil semua pengaturan sistem.

**Response:**
```json
{
  "success": true,
  "data": {
    "max_similaritas_persen": 80,
    "min_bimbingan_valid": 9,
    "ruangan_sidang": ["Ruangan A", "Ruangan B"],
    "max_pembimbing_aktif": 4,
    "durasi_sidang_menit": 90,
    "batas_revisi_hari": 30
  }
}
```

### PATCH /api/pengaturan
Memperbarui pengaturan sistem.

**Request Body:**
```json
{
  "max_similaritas_persen": 85,
  "min_bimbingan_valid": 10,
  "ruangan_sidang": ["Ruangan X", "Ruangan Y", "Ruangan Z"],
  "max_pembimbing_aktif": 5,
  "durasi_sidang_menit": 120,
  "batas_revisi_hari": 45
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pengaturan berhasil diperbarui",
  "data": { ... }
}
```

## Database Schema

### Tabel: pengaturan_sistem
```sql
CREATE TABLE pengaturan_sistem (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  deskripsi TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## File Terkait

### Backend
- `apps/api/src/dto/pengaturan.dto.ts` - Validasi input
- `apps/api/src/services/pengaturan.service.ts` - Business logic
- `apps/api/src/api/pengaturan.router.ts` - API routes
- `apps/api/src/utils/business-rules.ts` - Helper functions
- `packages/db/prisma/schema.prisma` - Database schema

### Frontend
- `apps/web/app/dashboard/dosen/fitur-jurusan-1/page.tsx` - UI halaman pengaturan
- `apps/web/app/dashboard/dosen/layout.tsx` - Menu navigasi

## Audit Log
Setiap perubahan pengaturan akan dicatat dalam audit log dengan:
- **Action**: `UPDATE_PENGATURAN`
- **Module**: `pengaturan`
- **User**: User yang melakukan perubahan
- **Details**: Data pengaturan yang diubah

## Security
- Hanya role `jurusan` dan `admin` yang dapat mengakses fitur ini
- Validasi input menggunakan Zod schema
- Audit logging untuk tracking perubahan
- Rate limiting: 30 requests/menit untuk admin operations
