# Fitur Aturan Validasi Dinamis

## Deskripsi
Fitur ini memungkinkan dosen jurusan untuk mengatur aturan validasi judul dan draf tugas akhir secara dinamis melalui UI.

## Perubahan yang Dilakukan

### 1. Database (Prisma Schema)
- Menambahkan enum `ModeValidasi` dengan 3 pilihan:
  - `SALAH_SATU`: Salah satu pembimbing
  - `KEDUA_PEMBIMBING`: Harus kedua pembimbing (default)
  - `PEMBIMBING_1_SAJA`: Pembimbing 1 saja

- Menambahkan model `AturanValidasi`:
  - `mode_validasi_judul`: Aturan untuk validasi judul TA
  - `mode_validasi_draf`: Aturan untuk validasi draf TA

### 2. Backend API
- **Router baru**: `/api/aturan-validasi`
  - `GET /`: Mendapatkan aturan validasi saat ini
  - `PUT /`: Update aturan validasi (hanya untuk role jurusan)

- **Helper function**: `utils/aturan-validasi.ts`
  - `getAturanValidasi()`: Mendapatkan aturan dari database
  - `isJudulValid()`: Check apakah judul sudah valid sesuai aturan
  - `isDrafValid()`: Check apakah draf sudah valid sesuai aturan

- **Update service**:
  - `bimbingan.service.ts`: Method `checkSidangEligibility()` sekarang menggunakan aturan validasi dinamis

### 3. Frontend
- **Halaman**: `/dashboard/dosen/aturan-umum`
- Menambahkan 2 dropdown untuk mengatur:
  1. Validasi Judul Tugas Akhir
  2. Validasi Draf Tugas Akhir
- Setiap dropdown memiliki 3 pilihan sesuai enum `ModeValidasi`

## Cara Penggunaan

### Untuk Dosen Jurusan:
1. Login sebagai dosen jurusan
2. Buka menu "Aturan Tugas Akhir" (`/dashboard/dosen/aturan-umum`)
3. Scroll ke bagian "Aturan Validasi"
4. Pilih mode validasi untuk judul dan draf TA
5. Klik "Simpan Perubahan"

### Default Setting:
- Validasi Judul: **Harus Kedua Pembimbing**
- Validasi Draf: **Harus Kedua Pembimbing**

## Dampak pada Sistem

### Validasi Judul:
- Menentukan siapa yang harus memvalidasi judul sebelum mahasiswa dapat melanjutkan ke tahap bimbingan

### Validasi Draf:
- Menentukan siapa yang harus memvalidasi draf TA sebelum mahasiswa dapat mendaftar sidang
- Digunakan dalam pengecekan kelayakan sidang (`checkSidangEligibility`)

## File yang Dimodifikasi/Ditambahkan:

### Database:
- `packages/db/prisma/schema.prisma`

### Backend:
- `apps/api/src/api/aturan-validasi.router.ts` (baru)
- `apps/api/src/utils/aturan-validasi.ts` (baru)
- `apps/api/src/app.ts`
- `apps/api/src/services/bimbingan.service.ts`
- `apps/api/src/repositories/bimbingan.repository.ts`

### Frontend:
- `apps/web/app/dashboard/dosen/aturan-umum/page.tsx`
