# Panduan Menerapkan Periode Guard ke Halaman Frontend

## File yang Sudah Dibuat

### 1. Komponen
- `components/shared/PeriodeNotActive.tsx` - Komponen peringatan periode tidak aktif
- `components/shared/PeriodeGuard.tsx` - Guard wrapper component
- `hooks/usePeriodeStatus.ts` - Hook untuk cek status periode

### 2. API Endpoints (Backend)
- `GET /api/periode/status` - Mendapatkan status periode (public)
- `GET /api/periode/aktif` - Mendapatkan periode aktif (public)
- `PATCH /api/periode/:id/jadwal-buka` - Mengatur jadwal pembukaan (jurusan only)

### 3. Halaman Manajemen
- `app/dashboard/dosen/periode/page.tsx` - Halaman manajemen periode untuk jurusan

## Cara Menerapkan PeriodeGuard

Tambahkan import dan wrap konten halaman dengan `<PeriodeGuard>`:

```tsx
'use client';

import PeriodeGuard from '@/components/shared/PeriodeGuard';

export default function YourPage() {
  return (
    <PeriodeGuard>
      {/* Konten halaman Anda */}
    </PeriodeGuard>
  );
}
```

## Daftar Halaman yang Perlu Dilindungi

### Mahasiswa
- ✅ `/dashboard/mahasiswa/bimbingan/page.tsx` - SUDAH DITERAPKAN
- ⬜ `/dashboard/mahasiswa/sidang/page.tsx` - Pendaftaran Sidang
- ⬜ `/dashboard/mahasiswa/jadwal-sidang/page.tsx` - Jadwal Sidang
- ⬜ `/dashboard/mahasiswa/pengajuan/page.tsx` - Pengajuan Pembimbing
- ⬜ `/dashboard/mahasiswa/tugas-akhir/page.tsx` - Tugas Akhir (jika ada form pengajuan)

### Dosen
- ⬜ `/dashboard/dosen/bimbingan/page.tsx` - Bimbingan
- ⬜ `/dashboard/dosen/tawaran-topik/page.tsx` - Tawaran Topik
- ⬜ `/dashboard/dosen/sidang-approvals/page.tsx` - Persetujuan Sidang
- ⬜ `/dashboard/dosen/penilaian/page.tsx` - Penilaian
- ⬜ `/dashboard/dosen/pengajuan/page.tsx` - Pengajuan (jika ada)

### Admin/Jurusan
- ⬜ `/dashboard/admin/kelola-sidang/page.tsx` - Kelola Sidang (jika perlu)

## Contoh Implementasi Lengkap

```tsx
'use client';

import { useState, useEffect } from 'react';
import PeriodeGuard from '@/components/shared/PeriodeGuard';

export default function BimbinganPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
  }, []);

  return (
    <PeriodeGuard>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Bimbingan</h1>
        {/* Konten halaman */}
      </div>
    </PeriodeGuard>
  );
}
```

## Fitur Periode Guard

### Untuk Mahasiswa & Dosen
- Jika periode **TIDAK AKTIF**: Tampilkan peringatan dengan tanggal pembukaan
- Jika periode **AKTIF**: Tampilkan konten normal

### Untuk Admin & Jurusan
- **Bypass** periode guard - selalu bisa akses
- Bisa mengatur jadwal pembukaan periode di `/dashboard/dosen/periode`

## Testing

1. **Test Periode Aktif**:
   - Login sebagai mahasiswa/dosen
   - Akses halaman yang dilindungi
   - Harus bisa akses normal

2. **Test Periode Tidak Aktif**:
   - Tutup periode aktif via API atau database
   - Login sebagai mahasiswa/dosen
   - Akses halaman yang dilindungi
   - Harus muncul peringatan periode tidak aktif

3. **Test Admin/Jurusan**:
   - Login sebagai admin/jurusan
   - Akses halaman apapun
   - Harus bisa akses meskipun periode tidak aktif

## Catatan Penting

1. **Halaman yang TIDAK perlu PeriodeGuard**:
   - Dashboard utama
   - Data Diri
   - Pengumuman (read-only)
   - Profile

2. **PeriodeGuard otomatis**:
   - Cek status periode dari API
   - Tampilkan loading saat fetch
   - Bypass untuk admin/jurusan
   - Tampilkan peringatan jika tidak aktif

3. **Tanggal Pembukaan**:
   - Ditampilkan di peringatan
   - Bisa diatur oleh jurusan
   - Format: DD MMMM YYYY (Indonesia)
