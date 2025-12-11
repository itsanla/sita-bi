# Logic Penilaian Sidang

## 📋 Overview

Sistem penilaian sidang dengan logic otomatis untuk menentukan status kelulusan mahasiswa berdasarkan nilai minimal yang diatur secara dinamis.

## 🎯 Flow Penilaian

```
Input Nilai (3 Penguji)
         ↓
Hitung Nilai Akhir (Rumus Dinamis)
         ↓
Bandingkan dengan Nilai Minimal
         ↓
    ┌────────┴────────┐
    ↓                 ↓
LULUS           TIDAK LULUS
```

## 📊 Logic Detail

### 1. Input Nilai

**Input dari Sekretaris (Pembimbing 1):**
- Nilai Penguji 1 (Ketua)
- Nilai Penguji 2 (Anggota I)
- Nilai Penguji 3 (Anggota II)

**Range:** 0 - 100

### 2. Perhitungan Nilai Akhir

**Rumus Dinamis** (dari database):
```javascript
// Contoh: (p1 + p2 + p3) / 4
const formula = rumus
  .replace(/p1/g, nilai_penguji1.toString())
  .replace(/p2/g, nilai_penguji2.toString())
  .replace(/p3/g, nilai_penguji3.toString());

const nilaiAkhir = eval(formula);
```

**Contoh Perhitungan:**
```
Rumus: (p1 + p2 + p3) / 4
Input: p1=85, p2=80, p3=90
Hasil: (85 + 80 + 90) / 4 = 63.75
```

### 3. Penentuan Status

**Kondisi:**
```javascript
const lulus = nilaiAkhir >= nilaiMinimal;
```

**Contoh:**
- Nilai Akhir: 63.75
- Nilai Minimal: 50
- Status: 63.75 >= 50 → **LULUS** ✅

## 🔄 Update Database

### Skenario 1: LULUS ✅

**Tabel: `mahasiswa`**
```sql
UPDATE mahasiswa SET
  status_kelulusan = 'LULUS',
  gagal_sidang = false,
  periode_gagal_id = NULL,
  alasan_gagal = NULL,
  status_gagal = NULL
WHERE id = mahasiswa_id;
```

**Tabel: `sidang`**
```sql
UPDATE sidang SET
  status_hasil = 'lulus',
  selesai_sidang = true
WHERE id = sidang_id;
```

**Tabel: `tugas_akhir`**
```sql
UPDATE tugas_akhir SET
  status = 'LULUS_TANPA_REVISI'
WHERE id = tugas_akhir_id;
```

**Tabel: `nilai_sidang`**
```sql
INSERT INTO nilai_sidang (sidang_id, dosen_id, aspek, skor, komentar) VALUES
  (sidang_id, penguji1_id, 'Nilai Sidang', nilai_p1, 'Nilai dari Penguji 1'),
  (sidang_id, penguji2_id, 'Nilai Sidang', nilai_p2, 'Nilai dari Penguji 2'),
  (sidang_id, penguji3_id, 'Nilai Sidang', nilai_p3, 'Nilai dari Penguji 3');
```

### Skenario 2: TIDAK LULUS ❌

**Tabel: `mahasiswa`**
```sql
UPDATE mahasiswa SET
  status_kelulusan = 'BELUM_LULUS',
  gagal_sidang = true,
  periode_gagal_id = [ID_PERIODE_AKTIF],
  alasan_gagal = 'Nilai sidang (45.50) tidak mencapai nilai minimal (50)',
  status_gagal = 'NILAI_TIDAK_MEMENUHI'
WHERE id = mahasiswa_id;
```

**Tabel: `sidang`**
```sql
UPDATE sidang SET
  status_hasil = 'tidak_lulus',
  selesai_sidang = true
WHERE id = sidang_id;
```

**Tabel: `tugas_akhir`**
```sql
UPDATE tugas_akhir SET
  status = 'GAGAL'
WHERE id = tugas_akhir_id;
```

**Tabel: `nilai_sidang`**
```sql
-- Sama seperti skenario LULUS
INSERT INTO nilai_sidang (sidang_id, dosen_id, aspek, skor, komentar) VALUES
  (sidang_id, penguji1_id, 'Nilai Sidang', nilai_p1, 'Nilai dari Penguji 1'),
  (sidang_id, penguji2_id, 'Nilai Sidang', nilai_p2, 'Nilai dari Penguji 2'),
  (sidang_id, penguji3_id, 'Nilai Sidang', nilai_p3, 'Nilai dari Penguji 3');
```

## 📝 Field Explanation

### Mahasiswa Table

| Field | Type | Keterangan |
|-------|------|------------|
| `status_kelulusan` | ENUM | 'LULUS' atau 'BELUM_LULUS' |
| `gagal_sidang` | BOOLEAN | true jika tidak lulus sidang |
| `periode_gagal_id` | INT | ID periode saat gagal (untuk tracking) |
| `alasan_gagal` | TEXT | Alasan detail kenapa gagal |
| `status_gagal` | TEXT | Kategori gagal: 'NILAI_TIDAK_MEMENUHI', 'KHUSUS', dll |

### Status Gagal Categories

1. **`NILAI_TIDAK_MEMENUHI`** - Gagal karena nilai < minimal
2. **`KHUSUS`** - Gagal karena dihapus dari jadwal oleh admin
3. **`NULL`** - Tidak gagal / belum ada status

## 🎯 Contoh Kasus

### Kasus 1: Mahasiswa LULUS

**Input:**
```json
{
  "sidang_id": 1,
  "nilai_penguji1": 85,
  "nilai_penguji2": 80,
  "nilai_penguji3": 90
}
```

**Pengaturan:**
- Rumus: `(p1 + p2 + p3) / 4`
- Nilai Minimal: `50`

**Perhitungan:**
```
Nilai Akhir = (85 + 80 + 90) / 4 = 63.75
63.75 >= 50 → LULUS ✅
```

**Update Database:**
```sql
-- mahasiswa
status_kelulusan = 'LULUS'
gagal_sidang = false
periode_gagal_id = NULL
alasan_gagal = NULL
status_gagal = NULL

-- sidang
status_hasil = 'lulus'
selesai_sidang = true

-- tugas_akhir
status = 'LULUS_TANPA_REVISI'
```

**Response:**
```json
{
  "status": "sukses",
  "message": "Nilai berhasil disimpan. Mahasiswa LULUS",
  "data": {
    "nilai_akhir": 63.75,
    "status": "LULUS",
    "nilai_minimal": 50
  }
}
```

### Kasus 2: Mahasiswa TIDAK LULUS

**Input:**
```json
{
  "sidang_id": 2,
  "nilai_penguji1": 40,
  "nilai_penguji2": 45,
  "nilai_penguji3": 50
}
```

**Pengaturan:**
- Rumus: `(p1 + p2 + p3) / 4`
- Nilai Minimal: `50`
- Periode Aktif: `1` (Periode TA 2024)

**Perhitungan:**
```
Nilai Akhir = (40 + 45 + 50) / 4 = 33.75
33.75 < 50 → TIDAK LULUS ❌
```

**Update Database:**
```sql
-- mahasiswa
status_kelulusan = 'BELUM_LULUS'
gagal_sidang = true
periode_gagal_id = 1
alasan_gagal = 'Nilai sidang (33.75) tidak mencapai nilai minimal (50)'
status_gagal = 'NILAI_TIDAK_MEMENUHI'

-- sidang
status_hasil = 'tidak_lulus'
selesai_sidang = true

-- tugas_akhir
status = 'GAGAL'
```

**Response:**
```json
{
  "status": "sukses",
  "message": "Nilai berhasil disimpan. Mahasiswa TIDAK LULUS",
  "data": {
    "nilai_akhir": 33.75,
    "status": "TIDAK LULUS",
    "nilai_minimal": 50
  }
}
```

## 🔍 Query untuk Monitoring

### 1. Cek Mahasiswa Gagal Sidang per Periode

```sql
SELECT 
  m.nim,
  u.name as mahasiswa,
  m.alasan_gagal,
  m.status_gagal,
  pt.nama as periode_gagal
FROM mahasiswa m
JOIN users u ON m.user_id = u.id
LEFT JOIN periode_ta pt ON m.periode_gagal_id = pt.id
WHERE m.gagal_sidang = true
ORDER BY m.periode_gagal_id DESC, u.name;
```

### 2. Statistik Kelulusan per Periode

```sql
SELECT 
  pt.nama as periode,
  COUNT(DISTINCT m.id) as total_mahasiswa,
  SUM(CASE WHEN m.status_kelulusan = 'LULUS' THEN 1 ELSE 0 END) as lulus,
  SUM(CASE WHEN m.gagal_sidang = true THEN 1 ELSE 0 END) as gagal,
  ROUND(SUM(CASE WHEN m.status_kelulusan = 'LULUS' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT m.id), 2) as persentase_lulus
FROM periode_ta pt
LEFT JOIN mahasiswa m ON m.periode_gagal_id = pt.id OR (m.status_kelulusan = 'LULUS' AND EXISTS (
  SELECT 1 FROM tugas_akhir ta WHERE ta.mahasiswa_id = m.id AND ta.periode_ta_id = pt.id
))
WHERE pt.status = 'AKTIF'
GROUP BY pt.id, pt.nama;
```

### 3. Detail Nilai Sidang Mahasiswa

```sql
SELECT 
  u.name as mahasiswa,
  s.status_hasil,
  ns.aspek,
  ns.skor,
  d.user_id,
  ud.name as penguji
FROM sidang s
JOIN tugas_akhir ta ON s.tugas_akhir_id = ta.id
JOIN mahasiswa m ON ta.mahasiswa_id = m.id
JOIN users u ON m.user_id = u.id
LEFT JOIN nilai_sidang ns ON ns.sidang_id = s.id
LEFT JOIN dosen d ON ns.dosen_id = d.id
LEFT JOIN users ud ON d.user_id = ud.id
WHERE s.id = [SIDANG_ID]
ORDER BY ns.id;
```

## ⚠️ Validasi & Error Handling

### Validasi Input

1. ✅ User harus pembimbing1
2. ✅ Sidang harus punya 3 penguji
3. ✅ Nilai belum pernah diinput
4. ✅ Rumus penilaian valid
5. ✅ Nilai dalam range 0-100

### Error Messages

| Error | Message |
|-------|---------|
| Bukan pembimbing1 | "Akses ditolak: Anda bukan sekretaris (pembimbing 1) dari sidang ini" |
| Penguji tidak lengkap | "Sidang belum memiliki 3 penguji" |
| Duplicate input | "Nilai sudah pernah diinput untuk sidang ini" |
| Rumus invalid | "Rumus penilaian tidak valid" |

## 🔐 Security

1. **Authentication** - JWT token required
2. **Authorization** - Hanya pembimbing1
3. **Validation** - Input validation & business rules
4. **Transaction** - Atomic updates (all or nothing)
5. **Audit Trail** - Semua perubahan tercatat di nilai_sidang

## 📊 Impact Analysis

### Jika Mahasiswa LULUS:
- ✅ Bisa wisuda
- ✅ Status kelulusan LULUS
- ✅ Tidak masuk daftar gagal sidang

### Jika Mahasiswa TIDAK LULUS:
- ❌ Tidak bisa wisuda
- ❌ Status kelulusan BELUM_LULUS
- ❌ Masuk daftar gagal sidang periode ini
- ⚠️ Harus mengulang sidang di periode berikutnya

## 🚀 Future Enhancements

- [ ] Notifikasi email/WA ke mahasiswa
- [ ] History nilai sidang
- [ ] Revisi nilai (dengan approval)
- [ ] Export transkrip nilai
- [ ] Dashboard statistik kelulusan

---

**Dibuat oleh**: Tim Pengembang SITA-BI  
**Terakhir diupdate**: 2024
