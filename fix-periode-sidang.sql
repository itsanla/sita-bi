-- ============================================================================
-- SCRIPT FIX PERIODE_TA_ID NULL PADA SIDANG
-- ============================================================================
-- Tujuan: Mengisi periode_ta_id yang NULL pada tabel sidang
-- Tanggal: 2024
-- Author: Tim Pengembang SITA-BI
-- ============================================================================

-- STEP 1: BACKUP DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS sidang_backup_before_fix AS 
SELECT * FROM sidang WHERE periode_ta_id IS NULL;

CREATE TABLE IF NOT EXISTS tugas_akhir_backup_before_fix AS 
SELECT * FROM tugas_akhir WHERE periode_ta_id IS NULL;

-- STEP 2: CEK DATA SEBELUM FIX
-- ============================================================================
SELECT '=== ANALISIS DATA SEBELUM FIX ===' as info;

SELECT 
  'Sidang tanpa periode' as tipe,
  COUNT(*) as jumlah,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sidang), 2) || '%' as persentase
FROM sidang 
WHERE periode_ta_id IS NULL

UNION ALL

SELECT 
  'Total sidang' as tipe,
  COUNT(*) as jumlah,
  '100%' as persentase
FROM sidang;

-- STEP 3: UPDATE SIDANG DARI TUGAS_AKHIR
-- ============================================================================
-- Jika tugas_akhir punya periode_ta_id, gunakan itu
UPDATE sidang 
SET periode_ta_id = (
  SELECT ta.periode_ta_id 
  FROM tugas_akhir ta 
  WHERE ta.id = sidang.tugas_akhir_id 
  AND ta.periode_ta_id IS NOT NULL
  LIMIT 1
)
WHERE periode_ta_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM tugas_akhir ta 
  WHERE ta.id = sidang.tugas_akhir_id 
  AND ta.periode_ta_id IS NOT NULL
);

SELECT 'Step 3: Update dari tugas_akhir - DONE' as status;

-- STEP 4: UPDATE SISANYA KE PERIODE AKTIF
-- ============================================================================
-- Untuk sidang yang masih NULL, set ke periode aktif
UPDATE sidang 
SET periode_ta_id = (
  SELECT id 
  FROM periode_ta 
  WHERE status = 'AKTIF' 
  LIMIT 1
)
WHERE periode_ta_id IS NULL;

SELECT 'Step 4: Update ke periode aktif - DONE' as status;

-- STEP 5: VERIFIKASI HASIL
-- ============================================================================
SELECT '=== VERIFIKASI HASIL ===' as info;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: Semua sidang sudah punya periode'
    ELSE '❌ ERROR: Masih ada ' || COUNT(*) || ' sidang tanpa periode'
  END as status
FROM sidang 
WHERE periode_ta_id IS NULL;

-- STEP 6: DISTRIBUSI SIDANG PER PERIODE
-- ============================================================================
SELECT '=== DISTRIBUSI SIDANG PER PERIODE ===' as info;

SELECT 
  pt.nama as periode,
  pt.status as status_periode,
  COUNT(s.id) as total_sidang,
  SUM(CASE WHEN s.selesai_sidang = 1 THEN 1 ELSE 0 END) as selesai,
  SUM(CASE WHEN s.selesai_sidang = 0 THEN 1 ELSE 0 END) as belum_selesai
FROM periode_ta pt
LEFT JOIN sidang s ON s.periode_ta_id = pt.id
GROUP BY pt.id, pt.nama, pt.status
ORDER BY pt.id DESC;

-- STEP 7: SUMMARY
-- ============================================================================
SELECT '=== SUMMARY ===' as info;

SELECT 
  'Total sidang di backup' as keterangan,
  COUNT(*) as jumlah
FROM sidang_backup_before_fix

UNION ALL

SELECT 
  'Total sidang sekarang' as keterangan,
  COUNT(*) as jumlah
FROM sidang

UNION ALL

SELECT 
  'Sidang tanpa periode (harusnya 0)' as keterangan,
  COUNT(*) as jumlah
FROM sidang
WHERE periode_ta_id IS NULL;

-- ============================================================================
-- SELESAI
-- ============================================================================
-- Jika semua OK, backup table bisa dihapus dengan:
-- DROP TABLE sidang_backup_before_fix;
-- DROP TABLE tugas_akhir_backup_before_fix;
-- ============================================================================
