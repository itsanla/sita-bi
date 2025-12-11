# Fix Periode Sidang NULL

## 🚨 Masalah

Banyak data sidang yang `periode_ta_id` nya `NULL`, ini akan menyebabkan masalah di produksi karena:

1. ❌ Data tidak terpisah per periode
2. ❌ Laporan per periode tidak akurat
3. ❌ Sulit tracking data historis
4. ❌ Potensi data tercampur antar periode

## 🔍 Cek Data

```sql
-- Cek berapa banyak sidang yang periode_ta_id NULL
SELECT 
  COUNT(*) as total_sidang_null,
  (SELECT COUNT(*) FROM sidang) as total_sidang,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sidang), 2) as persentase
FROM sidang 
WHERE periode_ta_id IS NULL;
```

## 🔧 Solusi Sementara (Sudah Diterapkan)

Backend sekarang menggunakan `OR` condition:

```typescript
where: {
  OR: [
    { periode_ta_id: periodeAktif?.id }, // Sidang dengan periode aktif
    { periode_ta_id: null },              // ATAU sidang legacy tanpa periode
  ]
}
```

**Kelebihan:**
- ✅ Backward compatible dengan data lama
- ✅ Tidak break existing data
- ✅ Sistem tetap berjalan

**Kekurangan:**
- ⚠️ Data tidak terpisah per periode
- ⚠️ Bisa menampilkan sidang dari periode lama

## ✅ Solusi Permanen (Harus Dilakukan)

### 1. Update Data Legacy

Jalankan script SQL untuk set `periode_ta_id` ke periode aktif:

```sql
-- Backup dulu
CREATE TABLE sidang_backup AS SELECT * FROM sidang;

-- Update sidang yang NULL ke periode aktif
UPDATE sidang 
SET periode_ta_id = (SELECT id FROM periode_ta WHERE status = 'AKTIF' LIMIT 1)
WHERE periode_ta_id IS NULL;

-- Verifikasi
SELECT 
  COUNT(*) as sidang_tanpa_periode
FROM sidang 
WHERE periode_ta_id IS NULL;
-- Harusnya 0
```

### 2. Tambah Constraint di Database

Setelah semua data ter-update, tambahkan constraint:

```sql
-- Buat periode_ta_id NOT NULL (setelah semua data ter-update)
-- HATI-HATI: Ini akan error jika masih ada NULL
ALTER TABLE sidang 
  ALTER COLUMN periode_ta_id SET NOT NULL;
```

### 3. Update Prisma Schema

```prisma
model Sidang {
  id                    Int         @id @default(autoincrement())
  tugas_akhir_id        Int
  pendaftaran_sidang_id Int?        @unique
  periode_ta_id         Int         // Hapus tanda ? untuk make it required
  // ... fields lainnya
}
```

### 4. Generate Migration

```bash
cd packages/db
npx prisma migrate dev --name make_periode_ta_id_required
```

### 5. Update Backend (Hapus OR Condition)

Setelah semua data clean, hapus OR condition:

```typescript
// SEBELUM (temporary)
where: {
  OR: [
    { periode_ta_id: periodeAktif?.id },
    { periode_ta_id: null },
  ]
}

// SESUDAH (permanent)
where: {
  periode_ta_id: periodeAktif?.id,
}
```

## 📋 Checklist Migrasi

### Pre-Migration
- [ ] Backup database
- [ ] Cek jumlah sidang dengan periode_ta_id NULL
- [ ] Identifikasi periode yang tepat untuk setiap sidang NULL
- [ ] Test di development environment

### Migration
- [ ] Update semua sidang NULL ke periode yang sesuai
- [ ] Verifikasi tidak ada lagi NULL
- [ ] Test query dengan filter periode
- [ ] Test laporan per periode

### Post-Migration
- [ ] Tambah constraint NOT NULL di database
- [ ] Update Prisma schema
- [ ] Generate migration
- [ ] Update backend code (hapus OR condition)
- [ ] Deploy ke production
- [ ] Monitor error logs

## 🎯 Script Migrasi Lengkap

```sql
-- 1. BACKUP
CREATE TABLE sidang_backup_20240101 AS SELECT * FROM sidang;
CREATE TABLE tugas_akhir_backup_20240101 AS SELECT * FROM tugas_akhir;

-- 2. CEK DATA
SELECT 
  'Sidang NULL' as tipe,
  COUNT(*) as jumlah
FROM sidang 
WHERE periode_ta_id IS NULL

UNION ALL

SELECT 
  'TA NULL' as tipe,
  COUNT(*) as jumlah
FROM tugas_akhir 
WHERE periode_ta_id IS NULL;

-- 3. UPDATE SIDANG
-- Ambil periode_ta_id dari tugas_akhir jika ada
UPDATE sidang 
SET periode_ta_id = (
  SELECT ta.periode_ta_id 
  FROM tugas_akhir ta 
  WHERE ta.id = sidang.tugas_akhir_id 
  AND ta.periode_ta_id IS NOT NULL
)
WHERE periode_ta_id IS NULL
AND EXISTS (
  SELECT 1 FROM tugas_akhir ta 
  WHERE ta.id = sidang.tugas_akhir_id 
  AND ta.periode_ta_id IS NOT NULL
);

-- 4. UPDATE SISANYA KE PERIODE AKTIF
UPDATE sidang 
SET periode_ta_id = (SELECT id FROM periode_ta WHERE status = 'AKTIF' LIMIT 1)
WHERE periode_ta_id IS NULL;

-- 5. VERIFIKASI
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SEMUA SIDANG PUNYA PERIODE'
    ELSE '❌ MASIH ADA ' || COUNT(*) || ' SIDANG TANPA PERIODE'
  END as status
FROM sidang 
WHERE periode_ta_id IS NULL;

-- 6. CEK DISTRIBUSI PER PERIODE
SELECT 
  pt.nama as periode,
  COUNT(s.id) as jumlah_sidang
FROM periode_ta pt
LEFT JOIN sidang s ON s.periode_ta_id = pt.id
GROUP BY pt.id, pt.nama
ORDER BY pt.id DESC;
```

## ⚠️ Peringatan

1. **JANGAN** langsung hapus OR condition sebelum data clean
2. **BACKUP** database sebelum migrasi
3. **TEST** di development dulu
4. **KOORDINASI** dengan tim sebelum deploy
5. **MONITOR** logs setelah deploy

## 📊 Monitoring Query

```sql
-- Monitor sidang tanpa periode (harusnya 0 setelah fix)
SELECT COUNT(*) FROM sidang WHERE periode_ta_id IS NULL;

-- Monitor distribusi sidang per periode
SELECT 
  pt.nama,
  COUNT(s.id) as total_sidang,
  SUM(CASE WHEN s.selesai_sidang THEN 1 ELSE 0 END) as selesai,
  SUM(CASE WHEN NOT s.selesai_sidang THEN 1 ELSE 0 END) as belum_selesai
FROM periode_ta pt
LEFT JOIN sidang s ON s.periode_ta_id = pt.id
GROUP BY pt.id, pt.nama
ORDER BY pt.id DESC;
```

## 🚀 Timeline Rekomendasi

1. **Minggu 1**: Analisis data, identifikasi periode yang tepat
2. **Minggu 2**: Test migrasi di development
3. **Minggu 3**: Backup & migrasi di production
4. **Minggu 4**: Monitor & cleanup code

---

**Status Saat Ini**: ⚠️ Temporary fix dengan OR condition  
**Target**: ✅ Semua sidang punya periode_ta_id yang valid  
**Priority**: 🔴 HIGH - Harus segera diperbaiki sebelum periode baru dimulai
