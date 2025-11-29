# API Bimbingan - Dokumentasi

## Perubahan Sistem Bimbingan

### Konsep Baru:
1. **Sesi Kosong**: Mahasiswa/dosen bisa buat sesi bimbingan tanpa jadwal
2. **Set Jadwal Terpisah**: Jadwal bisa di-set setelah sesi dibuat
3. **Konfirmasi Dosen**: Hanya dosen yang bisa konfirmasi bimbingan selesai
4. **Auto-Create 9 Sesi**: Saat pembimbing ditugaskan, otomatis create 9 sesi kosong

---

## Endpoints

### 1. GET `/api/bimbingan/sebagai-mahasiswa`
**Deskripsi**: Ambil semua sesi bimbingan mahasiswa (termasuk yang kosong)

**Auth**: Mahasiswa

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "judul": "Sistem Informasi...",
    "mahasiswa_id": 1,
    "peranDosenTa": [...],
    "bimbinganTa": [
      {
        "id": 1,
        "sesi_ke": 1,
        "tanggal_bimbingan": null,
        "jam_bimbingan": null,
        "jam_selesai": null,
        "status_bimbingan": "dijadwalkan",
        "is_konfirmasi": false
      }
    ]
  }
}
```

---

### 2. GET `/api/bimbingan/sebagai-dosen`
**Deskripsi**: Ambil daftar mahasiswa bimbingan dosen dengan sesi-sesinya

**Auth**: Dosen

**Query Params**:
- `page` (optional): Default 1
- `limit` (optional): Default 20

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "data": [
      {
        "id": 1,
        "judul": "...",
        "mahasiswa": {...},
        "bimbinganTa": [...]
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 3. POST `/api/bimbingan/sesi`
**Deskripsi**: Buat sesi bimbingan kosong baru

**Auth**: Mahasiswa atau Dosen

**Body**:
```json
{
  "tugas_akhir_id": 1
}
```

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 10,
    "tugas_akhir_id": 1,
    "dosen_id": 2,
    "peran": "pembimbing1",
    "sesi_ke": 10,
    "tanggal_bimbingan": null,
    "jam_bimbingan": null,
    "status_bimbingan": "dijadwalkan"
  }
}
```

---

### 4. PUT `/api/bimbingan/sesi/:id/jadwal`
**Deskripsi**: Set jadwal pada sesi yang sudah ada

**Auth**: Mahasiswa atau Dosen

**Body**:
```json
{
  "tanggal_bimbingan": "2025-12-01",
  "jam_bimbingan": "10:00",
  "jam_selesai": "11:00"
}
```

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "sesi_ke": 1,
    "tanggal_bimbingan": "2025-12-01T00:00:00.000Z",
    "jam_bimbingan": "10:00",
    "jam_selesai": "11:00",
    "status_bimbingan": "dijadwalkan"
  }
}
```

**Error Responses**:
- `409 Conflict`: Jadwal bentrok dengan bimbingan/sidang lain
- `404 Not Found`: Sesi tidak ditemukan atau tidak punya akses

---

### 5. POST `/api/bimbingan/sesi/:id/konfirmasi`
**Deskripsi**: Konfirmasi bimbingan sudah selesai dilaksanakan

**Auth**: Dosen only

**Response**:
```json
{
  "status": "sukses",
  "data": {
    "id": 1,
    "is_konfirmasi": true,
    "konfirmasi_at": "2025-11-29T13:30:00.000Z"
  }
}
```

**Error Responses**:
- `409 Conflict`: Sesi belum dijadwalkan
- `404 Not Found`: Sesi tidak ditemukan

---

### 6. POST `/api/bimbingan/catatan`
**Deskripsi**: Tambah catatan pada sesi bimbingan

**Auth**: Mahasiswa atau Dosen

**Body**:
```json
{
  "bimbingan_ta_id": 1,
  "catatan": "Revisi bab 2 sudah selesai"
}
```

---

### 7. POST `/api/bimbingan/sesi/:id/upload`
**Deskripsi**: Upload lampiran ke sesi bimbingan

**Auth**: Mahasiswa atau Dosen

**Content-Type**: `multipart/form-data`

**Form Data**:
- `files`: Array of files (max 5 files, 10MB each)

---

## Flow Penggunaan

### Scenario 1: Mahasiswa Buat Sesi & Set Jadwal
```
1. POST /api/bimbingan/sesi
   Body: { tugas_akhir_id: 1 }
   
2. PUT /api/bimbingan/sesi/10/jadwal
   Body: { tanggal_bimbingan: "2025-12-01", jam_bimbingan: "10:00" }
   
3. [Bimbingan dilaksanakan]

4. Dosen: POST /api/bimbingan/sesi/10/konfirmasi
```

### Scenario 2: Dosen Set Jadwal pada Sesi Kosong
```
1. GET /api/bimbingan/sebagai-dosen
   (Lihat sesi kosong mahasiswa)
   
2. PUT /api/bimbingan/sesi/1/jadwal
   Body: { tanggal_bimbingan: "2025-12-01", jam_bimbingan: "14:00" }
   
3. [Bimbingan dilaksanakan]

4. POST /api/bimbingan/sesi/1/konfirmasi
```

### Scenario 3: Auto-Create 9 Sesi
```
1. Admin assign pembimbing:
   POST /api/penugasan/:tugasAkhirId/pembimbing
   Body: { pembimbing1Id: 2, pembimbing2Id: 3 }
   
2. System otomatis create 9 sesi kosong (sesi_ke: 1-9)

3. Mahasiswa/Dosen bisa langsung set jadwal pada sesi yang ada
```

---

## Perubahan Database

### Tabel `bimbingan_ta`:
- `sesi_ke`: INT (required) - Nomor urut sesi
- `jam_selesai`: STRING (optional) - Waktu selesai bimbingan
- `status_bimbingan`: Default "dijadwalkan"

### Status Bimbingan:
- `dijadwalkan`: Sesi ada (bisa kosong atau sudah ada jadwal)
- `selesai`: Sudah dikonfirmasi dosen
- `dibatalkan`: Dibatalkan

---

## Validasi & Business Rules

1. **Akses**:
   - Mahasiswa hanya bisa akses sesi TA-nya sendiri
   - Dosen hanya bisa akses sesi mahasiswa bimbingannya

2. **Konflik Jadwal**:
   - System cek konflik dengan bimbingan lain
   - System cek konflik dengan jadwal sidang

3. **Konfirmasi**:
   - Hanya dosen yang bisa konfirmasi
   - Sesi harus sudah dijadwalkan sebelum dikonfirmasi

4. **Auto-Create**:
   - Trigger saat pembimbing pertama kali ditugaskan
   - Hanya create jika belum ada sesi sebelumnya
