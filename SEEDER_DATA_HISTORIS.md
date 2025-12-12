# Seeder Data Historis

## 📋 Deskripsi

Script untuk mengimport data Tugas Akhir historis (2012-2024) dari file CSV ke database.

## 📂 Struktur Data

```
apps/api/uploads/arsip/
└── judul-ta/
    ├── data-2012.csv
    ├── data-2013.csv
    ├── ...
    └── data-2024.csv
```

## 🚀 Cara Menjalankan

### 1. Pastikan file CSV sudah ada
```bash
ls apps/api/uploads/arsip/judul-ta/
```

### 2. Jalankan seeder
```bash
cd apps/api
pnpm seed:historis
```

## 📊 Proses Import

Seeder akan:

1. ✅ Membaca semua file CSV di folder `judul-ta/`
2. ✅ Membuat PeriodeTa untuk setiap tahun (status: SELESAI)
3. ✅ Membuat User dummy untuk setiap mahasiswa
4. ✅ Membuat Mahasiswa dengan flag `HISTORIS_{tahun}`
5. ✅ Membuat TugasAkhir dengan status SELESAI
6. ✅ Skip data yang sudah ada (berdasarkan NIM)

## 🔍 Data yang Diimport

Dari CSV:
- NO
- NIM
- NAMA MAHASISWA
- JUDUL TUGAS AKHIR

Ke Database:
```typescript
User {
  name: "Nama Mahasiswa"
  email: "{NIM}@historis.local"
  phone_number: "0000{NIM}"
  password: "TIDAK_ADA_AKSES" (hashed)
}

Mahasiswa {
  nim: "0901122010"
  prodi: "D3" | "D4" (dari parsing NIM)
  kelas: "HISTORIS_2012"
  status_kelulusan: "LULUS"
}

TugasAkhir {
  judul: "Judul dari CSV"
  status: "SELESAI"
  periode_ta_id: [periode tahun bersangkutan]
}
```

## 🔐 Pemisahan Data

Data historis PASTI terpisah dari data sistem baru:

### Filter 1: Status Periode
- Historis: `PeriodeTa.status = 'SELESAI'`
- Sistem Baru: `PeriodeTa.status = 'AKTIF'`

### Filter 2: Kelas Mahasiswa
- Historis: `Mahasiswa.kelas = 'HISTORIS_2012'` (dst)
- Sistem Baru: `Mahasiswa.kelas = '3A', '4B'` (dst)

### Filter 3: Tahun
- Historis: `PeriodeTa.tahun < 2025`
- Sistem Baru: `PeriodeTa.tahun >= 2025`

## 📈 Output

```
🚀 Mulai seeding data historis...

📁 Processing: data-2012.csv (Tahun 2012)
   ✅ Periode 2012 dibuat
   📊 Ditemukan 7 data
   ✅ 0901122010 - Sri Wahyuni Hasni
   ✅ 0901122014 - Sonia Rahmadani
   ...
   ✨ Selesai: 7 data dari data-2012.csv

📁 Processing: data-2013.csv (Tahun 2013)
   ...

🎉 Seeding selesai! Total 581 data berhasil diimport.
```

## ⚠️ Catatan

- Script akan skip data yang sudah ada (berdasarkan NIM)
- Jika ada error, akan ditampilkan tapi tidak menghentikan proses
- Data historis tidak memiliki: Pembimbing, Penguji, Jadwal Sidang, Nilai
- User historis tidak bisa login (password: TIDAK_ADA_AKSES)

## 🔄 Re-run Seeder

Aman untuk dijalankan ulang. Script akan:
- Skip mahasiswa yang sudah ada
- Tidak membuat duplikat data
- Hanya import data baru

## 🧹 Rollback (Hapus Data Historis)

Jika ingin menghapus semua data historis:

```sql
-- HATI-HATI: Ini akan menghapus SEMUA data historis!
DELETE FROM tugas_akhir WHERE mahasiswa_id IN (
  SELECT id FROM mahasiswa WHERE kelas LIKE 'HISTORIS_%'
);
DELETE FROM mahasiswa WHERE kelas LIKE 'HISTORIS_%';
DELETE FROM users WHERE email LIKE '%@historis.local';
DELETE FROM periode_ta WHERE tahun < 2025 AND status = 'SELESAI';
```
