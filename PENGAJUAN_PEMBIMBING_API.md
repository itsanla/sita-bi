# API Pengajuan Pembimbing - Dokumentasi

## Sistem Pengajuan Pembimbing Baru

### Aturan Bisnis:
1. **Mahasiswa**: Bisa ajukan 3 dosen untuk pembimbing1 dan 3 dosen untuk pembimbing2 (total 6 pengajuan aktif)
2. **Dosen**: Bisa tawarkan ke 5 mahasiswa (total 5 tawaran aktif)
3. **Kuota Dosen**: 1-4 mahasiswa bimbingan
4. **Requirement**: 1 mahasiswa HARUS punya 2 pembimbing (pembimbing1 & pembimbing2)
5. **Konfirmasi 2 Arah**: Setiap pengajuan harus disetujui kedua belah pihak

---

## Endpoints

### 1. POST `/api/pengajuan/mahasiswa`
**Deskripsi**: Mahasiswa mengajukan diri ke dosen sebagai pembimbing

**Auth**: Mahasiswa

**Body**:
```json
{
  "dosenId": 1,
  "peran": "pembimbing1"  // atau "pembimbing2"
}
```

**Response Success**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "mahasiswa_id": 1,
    "dosen_id": 1,
    "peran_yang_diajukan": "pembimbing1",
    "diinisiasi_oleh": "mahasiswa",
    "status": "MENUNGGU_PERSETUJUAN_DOSEN",
    "created_at": "2025-11-29T...",
    "mahasiswa": {...},
    "dosen": {...}
  }
}
```

**Error Responses**:
- `400`: "Anda sudah memiliki pembimbing1" (jika peran sudah terisi)
- `400`: "Pengajuan ke dosen ini untuk pembimbing1 sudah ada"
- `400`: "Anda sudah memiliki 3 pengajuan aktif untuk pembimbing1"

---

### 2. POST `/api/pengajuan/dosen`
**Deskripsi**: Dosen menawarkan diri ke mahasiswa sebagai pembimbing

**Auth**: Dosen

**Body**:
```json
{
  "mahasiswaId": 1,
  "peran": "pembimbing1"  // atau "pembimbing2"
}
```

**Response Success**:
```json
{
  "status": "sukses",
  "data": {
    "id": 2,
    "mahasiswa_id": 1,
    "dosen_id": 2,
    "peran_yang_diajukan": "pembimbing2",
    "diinisiasi_oleh": "dosen",
    "status": "MENUNGGU_PERSETUJUAN_MAHASISWA",
    "created_at": "2025-11-29T...",
    "mahasiswa": {...},
    "dosen": {...}
  }
}
```

**Error Responses**:
- `400`: "Kuota bimbingan Anda sudah penuh" (jika dosen sudah 4 mahasiswa)
- `400`: "Mahasiswa sudah memiliki pembimbing2"
- `400`: "Anda sudah memiliki 5 tawaran aktif"

---

### 3. GET `/api/pengajuan/mahasiswa`
**Deskripsi**: Ambil semua pengajuan mahasiswa (yang diajukan & yang ditawarkan dosen)

**Auth**: Mahasiswa

**Response**:
```json
{
  "status": "sukses",
  "data": [
    {
      "id": 1,
      "peran_yang_diajukan": "pembimbing1",
      "diinisiasi_oleh": "mahasiswa",
      "status": "MENUNGGU_PERSETUJUAN_DOSEN",
      "dosen": {
        "id": 1,
        "user": { "name": "Dr. Budi", "email": "..." }
      }
    },
    {
      "id": 2,
      "peran_yang_diajukan": "pembimbing2",
      "diinisiasi_oleh": "dosen",
      "status": "MENUNGGU_PERSETUJUAN_MAHASISWA",
      "dosen": {
        "id": 2,
        "user": { "name": "Dr. Ani", "email": "..." }
      }
    }
  ]
}
```

---

### 4. GET `/api/pengajuan/dosen`
**Deskripsi**: Ambil semua pengajuan dosen (yang ditawarkan & yang diajukan mahasiswa)

**Auth**: Dosen

**Response**:
```json
{
  "status": "sukses",
  "data": [
    {
      "id": 3,
      "peran_yang_diajukan": "pembimbing1",
      "diinisiasi_oleh": "mahasiswa",
      "status": "MENUNGGU_PERSETUJUAN_DOSEN",
      "mahasiswa": {
        "id": 1,
        "user": { "name": "Andi", "nim": "..." }
      }
    }
  ]
}
```

---

### 5. POST `/api/pengajuan/:id/terima`
**Deskripsi**: Terima pengajuan (dosen terima ajuan mahasiswa, atau mahasiswa terima tawaran dosen)

**Auth**: Mahasiswa atau Dosen (sesuai yang berhak)

**Response Success**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "status": "DISETUJUI",
    ...
  }
}
```

**Side Effects**:
- Assign dosen sebagai pembimbing1/pembimbing2 di TugasAkhir
- Batalkan pengajuan lain untuk peran yang sama
- Jika sudah 2 pembimbing → status TA jadi "BIMBINGAN" & auto-create 9 sesi bimbingan

**Error Responses**:
- `400`: "Kuota bimbingan dosen sudah penuh"
- `400`: "pembimbing1 sudah terisi"
- `400`: "Anda tidak berhak menerima pengajuan ini"

---

### 6. POST `/api/pengajuan/:id/tolak`
**Deskripsi**: Tolak pengajuan

**Auth**: Mahasiswa atau Dosen (sesuai yang berhak)

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "status": "DITOLAK",
    ...
  }
}
```

---

### 7. POST `/api/pengajuan/:id/batalkan`
**Deskripsi**: Batalkan pengajuan (hanya yang menginisiasi)

**Auth**: Mahasiswa atau Dosen (yang menginisiasi)

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "status": "DIBATALKAN_MAHASISWA",
    ...
  }
}
```

---

## Flow Lengkap

### Scenario 1: Mahasiswa Ajukan ke Dosen

```
1. Mahasiswa ajukan ke Dosen A untuk pembimbing1
   POST /api/pengajuan/mahasiswa
   Body: { dosenId: 1, peran: "pembimbing1" }
   → Status: MENUNGGU_PERSETUJUAN_DOSEN

2. Mahasiswa ajukan ke Dosen B & C untuk pembimbing1 (backup)
   POST /api/pengajuan/mahasiswa (2x)
   → Total 3 pengajuan aktif untuk pembimbing1

3. Dosen A terima
   POST /api/pengajuan/1/terima
   → Assign Dosen A sebagai pembimbing1
   → Batalkan pengajuan ke Dosen B & C untuk pembimbing1

4. Mahasiswa ajukan ke Dosen D untuk pembimbing2
   POST /api/pengajuan/mahasiswa
   Body: { dosenId: 4, peran: "pembimbing2" }

5. Dosen D terima
   POST /api/pengajuan/4/terima
   → Assign Dosen D sebagai pembimbing2
   → Status TA jadi "BIMBINGAN"
   → Auto-create 9 sesi bimbingan kosong
```

### Scenario 2: Dosen Tawarkan ke Mahasiswa

```
1. Dosen A tawarkan ke Mahasiswa X untuk pembimbing1
   POST /api/pengajuan/dosen
   Body: { mahasiswaId: 1, peran: "pembimbing1" }
   → Status: MENUNGGU_PERSETUJUAN_MAHASISWA

2. Dosen A tawarkan ke 4 mahasiswa lain (total 5 tawaran)

3. Mahasiswa X terima
   POST /api/pengajuan/1/terima
   → Assign Dosen A sebagai pembimbing1

4. Dosen B tawarkan ke Mahasiswa X untuk pembimbing2
   POST /api/pengajuan/dosen
   Body: { mahasiswaId: 1, peran: "pembimbing2" }

5. Mahasiswa X terima
   → Assign Dosen B sebagai pembimbing2
   → Status TA jadi "BIMBINGAN"
   → Auto-create 9 sesi bimbingan
```

### Scenario 3: Mixed (Mahasiswa Ajukan P1, Dosen Tawarkan P2)

```
1. Mahasiswa ajukan ke Dosen A untuk pembimbing1
2. Dosen A terima → Assign sebagai pembimbing1
3. Dosen B tawarkan ke mahasiswa untuk pembimbing2
4. Mahasiswa terima → Assign sebagai pembimbing2
5. Status TA jadi "BIMBINGAN" & auto-create 9 sesi
```

---

## Status Pengajuan

- `MENUNGGU_PERSETUJUAN_DOSEN`: Mahasiswa ajukan, tunggu dosen terima/tolak
- `MENUNGGU_PERSETUJUAN_MAHASISWA`: Dosen tawarkan, tunggu mahasiswa terima/tolak
- `DISETUJUI`: Pengajuan diterima, dosen sudah di-assign
- `DITOLAK`: Pengajuan ditolak
- `DIBATALKAN_MAHASISWA`: Dibatalkan oleh yang menginisiasi
- `DIBATALKAN_DOSEN`: Dibatalkan oleh yang menginisiasi

---

## Validasi & Business Rules

### Mahasiswa:
- ✅ Maksimal 3 pengajuan aktif per peran (pembimbing1 & pembimbing2)
- ✅ Tidak bisa ajukan jika peran sudah terisi
- ✅ Tidak bisa ajukan ke dosen yang sama untuk peran yang sama

### Dosen:
- ✅ Maksimal 5 tawaran aktif (semua peran)
- ✅ Cek kuota bimbingan (1-4 mahasiswa)
- ✅ Tidak bisa tawarkan jika mahasiswa sudah punya peran tersebut
- ✅ Tidak bisa tawarkan jika kuota sudah penuh

### Auto-Actions:
- ✅ Saat terima pengajuan → batalkan pengajuan lain untuk peran yang sama
- ✅ Saat sudah 2 pembimbing → status TA jadi "BIMBINGAN"
- ✅ Saat sudah 2 pembimbing → auto-create 9 sesi bimbingan kosong

---

## Perubahan Database

### Tabel `pengajuan_bimbingan`:
- `peran_yang_diajukan`: STRING (required) - "pembimbing1" atau "pembimbing2"
- Unique constraint: `[mahasiswa_id, dosen_id, peran_yang_diajukan]`

### Tabel `tugas_akhir`:
- Status "DRAFT" → "BIMBINGAN" saat sudah 2 pembimbing

### Tabel `peran_dosen_ta`:
- Assign sesuai `peran_yang_diajukan` dari pengajuan
