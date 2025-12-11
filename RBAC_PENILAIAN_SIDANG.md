# RBAC Penilaian Sidang

## 📋 Overview

Sistem penilaian sidang telah dirombak total dengan RBAC (Role-Based Access Control) yang ketat. Hanya **Pembimbing 1 (Sekretaris Sidang)** yang dapat mengakses dan menginput nilai sidang.

## 🔐 Aturan Akses

### Siapa yang Bisa Akses?
✅ **Pembimbing 1 (Sekretaris)** - Dosen yang ditugaskan sebagai `pembimbing1` pada tugas akhir mahasiswa

❌ **Tidak Bisa Akses:**
- Pembimbing 2
- Penguji 1, 2, 3
- Dosen lain
- Mahasiswa
- Admin (kecuali jika juga pembimbing 1)

### Apa yang Bisa Dilakukan?
1. **Melihat Daftar Sidang** - Hanya sidang dimana user adalah pembimbing1
2. **Input Nilai** - Memasukkan nilai dari 3 penguji (penguji1, penguji2, penguji3)
3. **Auto-Calculate** - Sistem otomatis menghitung nilai akhir menggunakan rumus yang diatur
4. **Auto-Update Status** - Sistem otomatis update status lulus/gagal berdasarkan nilai minimal

## 🏗️ Arsitektur Sistem

### Backend API

#### Endpoint Baru: `/api/penilaian-sidang`

**1. GET `/api/penilaian-sidang/my-sidang`**
- **Akses**: Hanya dosen
- **Fungsi**: Mendapatkan daftar sidang yang bisa dinilai
- **Filter**: Hanya sidang dimana user adalah `pembimbing1`
- **Response**:
```json
{
  "status": "sukses",
  "data": [
    {
      "id": 1,
      "tugasAkhir": {
        "judul": "...",
        "mahasiswa": { "user": { "name": "..." } },
        "peranDosenTa": [
          { "peran": "penguji1", "dosen": { "user": { "name": "..." } } },
          { "peran": "penguji2", "dosen": { "user": { "name": "..." } } },
          { "peran": "penguji3", "dosen": { "user": { "name": "..." } } }
        ]
      },
      "jadwalSidang": [...]
    }
  ]
}
```

**2. POST `/api/penilaian-sidang/submit`**
- **Akses**: Hanya pembimbing1 dari sidang tersebut
- **Fungsi**: Submit nilai dari 3 penguji
- **Request Body**:
```json
{
  "sidang_id": 1,
  "nilai_penguji1": 85,
  "nilai_penguji2": 80,
  "nilai_penguji3": 90
}
```
- **Response**:
```json
{
  "status": "sukses",
  "message": "Nilai berhasil disimpan. Mahasiswa LULUS",
  "data": {
    "nilai_akhir": 85,
    "status": "LULUS",
    "nilai_minimal": 60
  }
}
```

### Frontend

**Halaman**: `/dashboard/dosen/penilaian`

**Fitur**:
1. ✅ Guard untuk cek role dosen
2. ✅ Hanya tampilkan sidang dimana user adalah pembimbing1
3. ✅ Form input nilai untuk 3 penguji
4. ✅ Validasi sebelum submit
5. ✅ Konfirmasi sebelum simpan (nilai tidak bisa diubah)
6. ✅ Toast notification untuk feedback

## 🔄 Flow Penilaian

```
1. Sidang selesai dilaksanakan
   ↓
2. Sekretaris (Pembimbing 1) login
   ↓
3. Akses halaman /dashboard/dosen/penilaian
   ↓
4. Sistem cek: Apakah user adalah pembimbing1? ✓
   ↓
5. Tampilkan daftar sidang yang bisa dinilai
   ↓
6. Sekretaris klik "Input Nilai Sidang"
   ↓
7. Input nilai dari 3 penguji:
   - Penguji 1 (Ketua)
   - Penguji 2 (Anggota I)
   - Penguji 3 (Anggota II)
   ↓
8. Klik "Simpan Nilai"
   ↓
9. Konfirmasi: "Yakin? Nilai tidak bisa diubah!"
   ↓
10. Backend validasi:
    - Cek user adalah pembimbing1? ✓
    - Cek sudah pernah input? ✗
    - Cek ada 3 penguji? ✓
   ↓
11. Ambil rumus penilaian dari database
    Contoh: (p1 + p2 + p3) / 4
   ↓
12. Hitung nilai akhir:
    Nilai Akhir = (85 + 80 + 90) / 4 = 63.75
   ↓
13. Ambil nilai minimal lolos dari database
    Contoh: 50
   ↓
14. Tentukan status:
    63.75 >= 50 → LULUS ✓
   ↓
15. Simpan ke database:
    - 3 record di tabel nilai_sidang
    - Update sidang.status_hasil = 'lulus'
    - Update sidang.selesai_sidang = true
    - Update mahasiswa.gagal_sidang = false
    - Update mahasiswa.status_kelulusan = 'LULUS'
    - Update tugasAkhir.status = 'LULUS_TANPA_REVISI'
   ↓
16. Response ke frontend: "Nilai berhasil disimpan. Mahasiswa LULUS"
```

## 🛡️ Validasi Keamanan

### Backend Validations

1. **Authentication Check**
   ```typescript
   if (!dosenId) {
     return 403: "Akses ditolak: Anda bukan dosen"
   }
   ```

2. **Pembimbing1 Check**
   ```typescript
   const sidang = await prisma.sidang.findFirst({
     where: {
       id: sidang_id,
       tugasAkhir: {
         peranDosenTa: {
           some: {
             dosen_id: dosenId,
             peran: 'pembimbing1'
           }
         }
       }
     }
   });
   
   if (!sidang) {
     return 403: "Anda bukan sekretaris dari sidang ini"
   }
   ```

3. **Duplicate Check**
   ```typescript
   const existingNilai = await prisma.nilaiSidang.findFirst({
     where: { sidang_id }
   });
   
   if (existingNilai) {
     return 400: "Nilai sudah pernah diinput"
   }
   ```

4. **Penguji Completeness Check**
   ```typescript
   if (pengujiList.length !== 3) {
     return 400: "Sidang belum memiliki 3 penguji"
   }
   ```

### Frontend Guards

1. **Role Check**
   ```typescript
   if (!isDosen) {
     return <AccessDenied />
   }
   ```

2. **Confirmation Dialog**
   ```typescript
   if (!confirm('Yakin? Nilai tidak bisa diubah!')) {
     return;
   }
   ```

## 📊 Database Schema

### Tabel yang Digunakan

**1. peran_dosen_ta**
```sql
- tugas_akhir_id
- dosen_id
- peran (pembimbing1, pembimbing2, penguji1, penguji2, penguji3)
```

**2. nilai_sidang**
```sql
- sidang_id
- dosen_id (ID penguji yang dinilai)
- aspek
- skor
- komentar
```

**3. sidang**
```sql
- status_hasil (lulus, tidak_lulus)
- selesai_sidang (boolean)
```

**4. mahasiswa**
```sql
- gagal_sidang (boolean)
- status_kelulusan (LULUS, BELUM_LULUS)
```

**5. tugas_akhir**
```sql
- status (LULUS_TANPA_REVISI, GAGAL)
```

**6. pengaturan_sistem**
```sql
- key: 'rumus_penilaian'
  value: '(p1 + p2 + p3) / 4'
  
- key: 'nilai_minimal_lolos'
  value: '50'
```

## 🎯 Contoh Perhitungan

### Skenario 1: Mahasiswa LULUS

**Input:**
- Nilai Penguji 1: 85
- Nilai Penguji 2: 80
- Nilai Penguji 3: 90

**Rumus:** `(p1 + p2 + p3) / 4`

**Perhitungan:**
```
Nilai Akhir = (85 + 80 + 90) / 4
            = 255 / 4
            = 63.75
```

**Nilai Minimal:** 50

**Hasil:** 63.75 >= 50 → **LULUS** ✅

**Update Database:**
- `sidang.status_hasil` = 'lulus'
- `mahasiswa.gagal_sidang` = false
- `mahasiswa.status_kelulusan` = 'LULUS'
- `tugasAkhir.status` = 'LULUS_TANPA_REVISI'

### Skenario 2: Mahasiswa TIDAK LULUS

**Input:**
- Nilai Penguji 1: 40
- Nilai Penguji 2: 45
- Nilai Penguji 3: 50

**Rumus:** `(p1 + p2 + p3) / 4`

**Perhitungan:**
```
Nilai Akhir = (40 + 45 + 50) / 4
            = 135 / 4
            = 33.75
```

**Nilai Minimal:** 50

**Hasil:** 33.75 < 50 → **TIDAK LULUS** ❌

**Update Database:**
- `sidang.status_hasil` = 'tidak_lulus'
- `mahasiswa.gagal_sidang` = true
- `mahasiswa.status_kelulusan` = 'BELUM_LULUS'
- `tugasAkhir.status` = 'GAGAL'

## 🚨 Error Handling

### Backend Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| 403 | Akses ditolak: Anda bukan dosen | User tidak memiliki profil dosen |
| 403 | Akses ditolak: Anda bukan sekretaris | User bukan pembimbing1 dari sidang |
| 400 | Sidang belum memiliki 3 penguji | Penguji belum lengkap |
| 400 | Nilai sudah pernah diinput | Duplicate submission |
| 500 | Rumus penilaian tidak valid | Error saat eval formula |

### Frontend Errors

- Toast notification untuk semua error
- Loading state saat submit
- Disable button saat submitting
- Confirmation dialog sebelum submit

## 📝 Testing Checklist

### Manual Testing

- [ ] Login sebagai dosen yang bukan pembimbing1 → Tidak ada sidang
- [ ] Login sebagai pembimbing1 → Tampil sidang yang bisa dinilai
- [ ] Input nilai dan submit → Berhasil disimpan
- [ ] Coba submit lagi → Error: "Nilai sudah pernah diinput"
- [ ] Cek database → Status mahasiswa ter-update
- [ ] Cek dengan nilai < minimal → Status gagal_sidang = true
- [ ] Cek dengan nilai >= minimal → Status gagal_sidang = false

### API Testing

```bash
# Get my sidang
curl -X GET http://localhost:3000/api/penilaian-sidang/my-sidang \
  -H "Authorization: Bearer <token>"

# Submit nilai
curl -X POST http://localhost:3000/api/penilaian-sidang/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sidang_id": 1,
    "nilai_penguji1": 85,
    "nilai_penguji2": 80,
    "nilai_penguji3": 90
  }'
```

## 🔄 Migration dari Sistem Lama

### Perubahan

1. ❌ **Dihapus**: Endpoint `/api/jadwal-sidang/for-penguji`
2. ✅ **Ditambah**: Endpoint `/api/penilaian-sidang/my-sidang`
3. ✅ **Ditambah**: Endpoint `/api/penilaian-sidang/submit`
4. ✅ **Dirombak**: Halaman `/dashboard/dosen/penilaian`

### Backward Compatibility

- Endpoint lama `/api/penilaian` masih ada (tidak digunakan)
- Bisa dihapus setelah migrasi selesai

## 📚 Referensi

- [ATURAN_PENILAIAN.md](./ATURAN_PENILAIAN.md) - Dokumentasi rumus penilaian
- [useRBAC.ts](./apps/web/hooks/useRBAC.ts) - Hook RBAC
- [penilaian-sidang.router.ts](./apps/api/src/api/penilaian-sidang.router.ts) - Backend router
- [page.tsx](./apps/web/app/dashboard/dosen/penilaian/page.tsx) - Frontend page

---

**Dibuat oleh**: Tim Pengembang SITA-BI  
**Terakhir diupdate**: 2024
