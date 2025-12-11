# 📊 Analisis Beban Kerja Pemisahan Periode Per Tabel

## 🎯 Metodologi Analisis

### Kriteria Penilaian:
1. **Kompleksitas Migrasi** (1-5): Seberapa sulit migrasi data existing
2. **Impact ke Kode** (1-5): Berapa banyak kode yang harus diubah
3. **Risk Level** (1-5): Risiko error/bug setelah implementasi
4. **Effort (Jam Kerja)**: Estimasi waktu implementasi
5. **Priority**: Seberapa penting untuk bisnis

**Skala:**
- 1 = Sangat Rendah/Mudah
- 3 = Sedang
- 5 = Sangat Tinggi/Sulit

---

## 📋 Analisis Per Tabel

### **KATEGORI 1: ENTITAS INTI (Core Entities)**

#### 1. **TugasAkhir** ✅ SUDAH ADA
```prisma
model TugasAkhir {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | ✅ 0 | Sudah ada, tidak perlu migrasi |
| Impact ke Kode | ✅ 0 | Sudah digunakan di seluruh sistem |
| Risk Level | ✅ 0 | Sudah production-ready |
| Effort | ✅ 0 jam | Tidak ada pekerjaan |
| Priority | ✅ DONE | Sudah selesai |

**Status:** ✅ **COMPLETE** - Tidak ada pekerjaan

---

#### 2. **BimbinganTA** ❌ BELUM ADA
```prisma
model BimbinganTA {
  id                Int
  tugas_akhir_id    Int
  dosen_id          Int
  periode_ta_id     Int? // ❌ PERLU DITAMBAHKAN
  peran             String
  sesi_ke           Int
  // ... 10 fields lainnya
}
```

**Analisis Data:**
- Relasi: `tugasAkhir` (parent), `dosen`, `catatan[]`, `lampiran[]`, `historyPerubahan[]`
- Estimasi records: ~500-1000 per periode (50 mahasiswa × 10-20 sesi)
- Query frequency: **SANGAT TINGGI** (setiap hari)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟡 2 | Ambil dari `tugasAkhir.periode_ta_id` |
| Impact ke Kode | 🔴 4 | Banyak query bimbingan harus update |
| Risk Level | 🟡 3 | Medium - banyak fitur tergantung bimbingan |
| Effort | 🔴 16 jam | Schema (2h) + Migrasi (4h) + API (8h) + Testing (2h) |
| Priority | 🔴 CRITICAL | Bimbingan adalah core activity |

**Affected Files (Estimasi 15-20 files):**
```
✏️ Schema: schema.prisma
✏️ API: bimbingan.router.ts, bimbingan.service.ts
✏️ Frontend: 
   - /dashboard/mahasiswa/bimbingan/*
   - /dashboard/dosen/bimbingan/*
   - /dashboard/admin/bimbingan/*
✏️ Query: Semua query BimbinganTA harus tambah filter periode
```

**Migration Script:**
```sql
-- Step 1: Add column
ALTER TABLE bimbingan_ta ADD COLUMN periode_ta_id INTEGER;

-- Step 2: Populate from parent
UPDATE bimbingan_ta 
SET periode_ta_id = (
  SELECT periode_ta_id 
  FROM tugas_akhir 
  WHERE tugas_akhir.id = bimbingan_ta.tugas_akhir_id
);

-- Step 3: Add index
CREATE INDEX idx_bimbingan_periode ON bimbingan_ta(periode_ta_id);
```

**Beban Kerja Detail:**
- ✏️ Update schema: 0.5 jam
- ✏️ Generate migration: 0.5 jam
- ✏️ Test migration di dev: 1 jam
- ✏️ Update API endpoints (5 endpoints): 4 jam
- ✏️ Update frontend queries (10 pages): 6 jam
- ✏️ Update service layer: 2 jam
- ✏️ Testing end-to-end: 2 jam
- **Total: 16 jam**

---

#### 3. **Sidang** ✅ SUDAH ADA
```prisma
model Sidang {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | ✅ 0 | Sudah ada |
| Impact ke Kode | ✅ 0 | Sudah digunakan |
| Risk Level | ✅ 0 | Sudah production |
| Effort | ✅ 0 jam | Tidak ada pekerjaan |
| Priority | ✅ DONE | Sudah selesai |

**Status:** ✅ **COMPLETE**

---

#### 4. **NilaiSidang** ❌ BELUM ADA
```prisma
model NilaiSidang {
  id         Int
  sidang_id  Int
  dosen_id   Int
  periode_ta_id Int? // ❌ PERLU DITAMBAHKAN
  aspek      String
  skor       Float
  // ... 4 fields lainnya
}
```

**Analisis Data:**
- Relasi: `sidang` (parent), `dosen`
- Estimasi records: ~150 per periode (50 mahasiswa × 3 penguji)
- Query frequency: **MEDIUM** (saat input & laporan)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟢 1 | Ambil dari `sidang.periode_ta_id` |
| Impact ke Kode | 🟡 3 | Beberapa query nilai & laporan |
| Risk Level | 🟡 2 | Low-Medium - fitur terisolasi |
| Effort | 🟡 8 jam | Schema (1h) + Migrasi (2h) + API (3h) + Testing (2h) |
| Priority | 🔴 HIGH | Nilai harus terpisah per periode |

**Affected Files (Estimasi 8-10 files):**
```
✏️ Schema: schema.prisma
✏️ API: penilaian-sidang.router.ts
✏️ Frontend: 
   - /dashboard/dosen/penilaian/*
   - /dashboard/admin/laporan-nilai/*
✏️ Reports: Laporan nilai per periode
```

**Migration Script:**
```sql
ALTER TABLE nilai_sidang ADD COLUMN periode_ta_id INTEGER;

UPDATE nilai_sidang 
SET periode_ta_id = (
  SELECT periode_ta_id 
  FROM sidang 
  WHERE sidang.id = nilai_sidang.sidang_id
);

CREATE INDEX idx_nilai_periode ON nilai_sidang(periode_ta_id);
```

**Beban Kerja Detail:**
- ✏️ Update schema: 0.5 jam
- ✏️ Migration: 0.5 jam
- ✏️ Update API (3 endpoints): 2 jam
- ✏️ Update frontend (3 pages): 3 jam
- ✏️ Update laporan: 2 jam
- **Total: 8 jam**

---

#### 5. **DokumenTa** ❌ BELUM ADA
```prisma
model DokumenTa {
  id                 Int
  tugas_akhir_id     Int
  periode_ta_id      Int? // ❌ PERLU DITAMBAHKAN
  tipe_dokumen       TipeDokumenBimbingan
  file_path          String
  version            Int
  // ... 8 fields lainnya
}
```

**Analisis Data:**
- Relasi: `tugasAkhir` (parent), `validatorP1`, `validatorP2`
- Estimasi records: ~200-300 per periode (50 mahasiswa × 4-6 dokumen)
- Query frequency: **MEDIUM** (upload & validasi)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟡 2 | Ambil dari `tugasAkhir.periode_ta_id` |
| Impact ke Kode | 🟡 3 | Upload, download, validasi dokumen |
| Risk Level | 🟡 2 | Low-Medium - file storage terisolasi |
| Effort | 🟡 10 jam | Schema (1h) + Migrasi (2h) + API (5h) + Testing (2h) |
| Priority | 🟡 MEDIUM | Penting untuk tracking dokumen |

**Affected Files (Estimasi 10-12 files):**
```
✏️ Schema: schema.prisma
✏️ API: dokumen.router.ts, dokumen.service.ts
✏️ Frontend: 
   - /dashboard/mahasiswa/dokumen/*
   - /dashboard/dosen/validasi-dokumen/*
✏️ Storage: File path management
```

**Beban Kerja Detail:**
- ✏️ Update schema: 0.5 jam
- ✏️ Migration: 1 jam
- ✏️ Update API (6 endpoints): 4 jam
- ✏️ Update frontend (4 pages): 3 jam
- ✏️ Testing: 1.5 jam
- **Total: 10 jam**

---

### **KATEGORI 2: ENTITAS PENDUKUNG (Supporting Entities)**

#### 6. **JadwalSidang** ✅ SUDAH ADA
```prisma
model JadwalSidang {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

**Status:** ✅ **COMPLETE**

---

#### 7. **PendaftaranSidang** ✅ SUDAH ADA
```prisma
model PendaftaranSidang {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

**Status:** ✅ **COMPLETE**

---

#### 8. **TawaranTopik** ✅ SUDAH ADA
```prisma
model TawaranTopik {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

**Status:** ✅ **COMPLETE**

---

#### 9. **PengajuanBimbingan** ✅ SUDAH ADA
```prisma
model PengajuanBimbingan {
  periode_ta_id Int? // ✅ SUDAH IMPLEMENTASI
}
```

**Status:** ✅ **COMPLETE**

---

### **KATEGORI 3: HISTORY & AUDIT (History Tables)**

#### 10. **HistoryTopikMahasiswa** ❌ BELUM ADA
```prisma
model HistoryTopikMahasiswa {
  id               Int
  mahasiswa_id     Int
  tawaran_topik_id Int
  periode_ta_id    Int? // ❌ PERLU DITAMBAHKAN
  status           String
}
```

**Analisis Data:**
- Estimasi records: ~100-200 per periode
- Query frequency: **LOW** (hanya untuk audit)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟢 1 | Ambil dari `tawaranTopik.periode_ta_id` |
| Impact ke Kode | 🟢 1 | Minimal - hanya history view |
| Risk Level | 🟢 1 | Very Low - tidak critical |
| Effort | 🟢 3 jam | Schema (0.5h) + Migrasi (1h) + API (1h) + Testing (0.5h) |
| Priority | 🟢 LOW | Nice to have |

**Beban Kerja:** 3 jam

---

#### 11. **HistoryPerubahanJadwal** ❌ BELUM ADA
```prisma
model HistoryPerubahanJadwal {
  id               Int
  bimbingan_ta_id  Int
  mahasiswa_id     Int
  periode_ta_id    Int? // ❌ PERLU DITAMBAHKAN
  // ... 7 fields lainnya
}
```

**Analisis Data:**
- Estimasi records: ~50-100 per periode
- Query frequency: **LOW** (audit trail)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟢 1 | Ambil dari `bimbinganTA.periode_ta_id` |
| Impact ke Kode | 🟢 1 | Minimal |
| Risk Level | 🟢 1 | Very Low |
| Effort | 🟢 3 jam | Schema + Migrasi + Testing |
| Priority | 🟢 LOW | Nice to have |

**Beban Kerja:** 3 jam

---

#### 12. **HistoryPerubahanSidang** ❌ BELUM ADA
```prisma
model HistoryPerubahanSidang {
  id               Int
  sidang_id        Int
  user_id          Int?
  periode_ta_id    Int? // ❌ PERLU DITAMBAHKAN
  perubahan        String
}
```

**Analisis Data:**
- Estimasi records: ~30-50 per periode
- Query frequency: **LOW** (audit)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟢 1 | Ambil dari `sidang.periode_ta_id` |
| Impact ke Kode | 🟢 1 | Minimal |
| Risk Level | 🟢 1 | Very Low |
| Effort | 🟢 3 jam | Schema + Migrasi + Testing |
| Priority | 🟢 LOW | Nice to have |

**Beban Kerja:** 3 jam

---

#### 13. **HistoryPenugasanDosen** ❌ BELUM ADA
```prisma
model HistoryPenugasanDosen {
  id             Int
  tugas_akhir_id Int
  admin_id       Int
  dosen_id       Int
  periode_ta_id  Int? // ❌ PERLU DITAMBAHKAN
  peran          String
  action         String
}
```

**Analisis Data:**
- Estimasi records: ~100-150 per periode
- Query frequency: **LOW** (audit)

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🟢 1 | Ambil dari `tugasAkhir.periode_ta_id` |
| Impact ke Kode | 🟢 1 | Minimal |
| Risk Level | 🟢 1 | Very Low |
| Effort | 🟢 3 jam | Schema + Migrasi + Testing |
| Priority | 🟢 LOW | Nice to have |

**Beban Kerja:** 3 jam

---

### **KATEGORI 4: ENTITAS TAMBAHAN (Optional)**

#### 14. **BimbinganLampiran** ⚪ OPTIONAL
```prisma
model BimbinganLampiran {
  id              Int
  bimbingan_ta_id Int
  periode_ta_id   Int? // ⚪ OPTIONAL - inherit dari BimbinganTA
  file_path       String
}
```

**Analisis:**
- Bisa inherit dari `bimbinganTA.periode_ta_id`
- Tidak perlu field terpisah

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | ⚪ N/A | Tidak perlu - inherit dari parent |
| Impact ke Kode | ⚪ 0 | Tidak ada perubahan |
| Risk Level | ⚪ 0 | No risk |
| Effort | ⚪ 0 jam | Tidak perlu implementasi |
| Priority | ⚪ SKIP | Inherit dari BimbinganTA |

**Rekomendasi:** ❌ **SKIP** - Gunakan join ke BimbinganTA

---

#### 15. **CatatanBimbingan** ⚪ OPTIONAL
```prisma
model CatatanBimbingan {
  id              Int
  bimbingan_ta_id Int
  periode_ta_id   Int? // ⚪ OPTIONAL - inherit dari BimbinganTA
  author_id       Int
  catatan         String
}
```

**Rekomendasi:** ❌ **SKIP** - Inherit dari BimbinganTA

---

#### 16. **PendaftaranSidangFile** ⚪ OPTIONAL
```prisma
model PendaftaranSidangFile {
  id                    Int
  pendaftaran_sidang_id Int
  periode_ta_id         Int? // ⚪ OPTIONAL - inherit
  file_path             String
}
```

**Rekomendasi:** ❌ **SKIP** - Inherit dari PendaftaranSidang

---

### **KATEGORI 5: ENTITAS MAHASISWA (Special Case)**

#### 17. **Mahasiswa** 🔵 SPECIAL CASE
```prisma
model Mahasiswa {
  id               Int
  user_id          Int
  nim              String
  // Status fields - TIDAK PERLU periode_ta_id langsung
  siap_sidang      Boolean
  sidang_terjadwal Boolean
  gagal_sidang     Boolean
  periode_gagal_id Int? // ✅ SUDAH ADA untuk tracking gagal
  status_kelulusan StatusKelulusan
}
```

**Analisis:**
- Mahasiswa adalah entitas permanen (tidak per periode)
- Status mahasiswa bisa berubah per periode
- **Solusi:** Buat tabel terpisah `MahasiswaPeriode`

**Rekomendasi:** Buat tabel baru:
```prisma
model MahasiswaPeriode {
  id                Int              @id @default(autoincrement())
  mahasiswa_id      Int
  periode_ta_id     Int
  status_periode    String           // "AKTIF", "LULUS", "GAGAL", "MENGULANG"
  siap_sidang       Boolean          @default(false)
  sidang_terjadwal  Boolean          @default(false)
  gagal_sidang      Boolean          @default(false)
  status_kelulusan  StatusKelulusan  @default(BELUM_LULUS)
  created_at        DateTime         @default(now())
  updated_at        DateTime         @updatedAt
  
  mahasiswa         Mahasiswa        @relation(fields: [mahasiswa_id], references: [id])
  periodeTa         PeriodeTa        @relation(fields: [periode_ta_id], references: [id])
  
  @@unique([mahasiswa_id, periode_ta_id])
}
```

| Aspek | Score | Keterangan |
|-------|-------|------------|
| Kompleksitas Migrasi | 🔴 4 | Perlu migrasi status ke tabel baru |
| Impact ke Kode | 🔴 5 | Banyak query mahasiswa harus update |
| Risk Level | 🔴 4 | High - core entity |
| Effort | 🔴 24 jam | Schema (2h) + Migrasi (6h) + API (12h) + Testing (4h) |
| Priority | 🟡 MEDIUM | Penting tapi bisa phase 2 |

**Beban Kerja Detail:**
- ✏️ Design tabel baru: 1 jam
- ✏️ Update schema: 1 jam
- ✏️ Migrasi data existing: 6 jam (complex logic)
- ✏️ Update API (15+ endpoints): 10 jam
- ✏️ Update frontend (20+ pages): 8 jam
- ✏️ Testing end-to-end: 4 jam
- **Total: 30 jam**

---

## 📊 RINGKASAN BEBAN KERJA

### **Tabel Prioritas & Effort**

| No | Tabel | Status | Priority | Effort | Complexity | Risk |
|----|-------|--------|----------|--------|------------|------|
| 1 | TugasAkhir | ✅ DONE | - | 0h | - | - |
| 2 | **BimbinganTA** | ❌ TODO | 🔴 CRITICAL | **16h** | 🟡 Medium | 🟡 Medium |
| 3 | Sidang | ✅ DONE | - | 0h | - | - |
| 4 | **NilaiSidang** | ❌ TODO | 🔴 HIGH | **8h** | 🟢 Low | 🟢 Low |
| 5 | **DokumenTa** | ❌ TODO | 🟡 MEDIUM | **10h** | 🟡 Medium | 🟢 Low |
| 6 | JadwalSidang | ✅ DONE | - | 0h | - | - |
| 7 | PendaftaranSidang | ✅ DONE | - | 0h | - | - |
| 8 | TawaranTopik | ✅ DONE | - | 0h | - | - |
| 9 | PengajuanBimbingan | ✅ DONE | - | 0h | - | - |
| 10 | HistoryTopikMahasiswa | ❌ TODO | 🟢 LOW | **3h** | 🟢 Low | 🟢 Low |
| 11 | HistoryPerubahanJadwal | ❌ TODO | 🟢 LOW | **3h** | 🟢 Low | 🟢 Low |
| 12 | HistoryPerubahanSidang | ❌ TODO | 🟢 LOW | **3h** | 🟢 Low | 🟢 Low |
| 13 | HistoryPenugasanDosen | ❌ TODO | 🟢 LOW | **3h** | 🟢 Low | 🟢 Low |
| 14 | BimbinganLampiran | ⚪ SKIP | - | 0h | - | - |
| 15 | CatatanBimbingan | ⚪ SKIP | - | 0h | - | - |
| 16 | PendaftaranSidangFile | ⚪ SKIP | - | 0h | - | - |
| 17 | **MahasiswaPeriode** | ❌ NEW | 🟡 MEDIUM | **30h** | 🔴 High | 🔴 High |

---

## 🎯 TOTAL BEBAN KERJA

### **Phase 1: Critical (Must Have)**
| Tabel | Effort |
|-------|--------|
| BimbinganTA | 16 jam |
| NilaiSidang | 8 jam |
| DokumenTa | 10 jam |
| **TOTAL PHASE 1** | **34 jam** ≈ **4-5 hari kerja** |

### **Phase 2: History Tables (Nice to Have)**
| Tabel | Effort |
|-------|--------|
| HistoryTopikMahasiswa | 3 jam |
| HistoryPerubahanJadwal | 3 jam |
| HistoryPerubahanSidang | 3 jam |
| HistoryPenugasanDosen | 3 jam |
| **TOTAL PHASE 2** | **12 jam** ≈ **1.5 hari kerja** |

### **Phase 3: Mahasiswa Periode (Optional)**
| Tabel | Effort |
|-------|--------|
| MahasiswaPeriode (NEW) | 30 jam |
| **TOTAL PHASE 3** | **30 jam** ≈ **4 hari kerja** |

---

## 📈 TOTAL KESELURUHAN

```
Phase 1 (Critical):  34 jam  (4-5 hari)
Phase 2 (History):   12 jam  (1.5 hari)
Phase 3 (Optional):  30 jam  (4 hari)
─────────────────────────────────────
GRAND TOTAL:         76 jam  (9-10 hari kerja)
```

**Dengan buffer 20%:** **~92 jam** ≈ **12 hari kerja** ≈ **2.5 minggu**

---

## 💡 REKOMENDASI STRATEGI

### **Strategi A: Minimal (Phase 1 Only)**
✅ **Implementasi:** BimbinganTA, NilaiSidang, DokumenTa
⏱️ **Waktu:** 34 jam (1 minggu)
💰 **ROI:** High - Solve 80% masalah pemisahan periode
🎯 **Cocok untuk:** Quick win, minimal disruption

### **Strategi B: Optimal (Phase 1 + 2)**
✅ **Implementasi:** Critical + History tables
⏱️ **Waktu:** 46 jam (1.5 minggu)
💰 **ROI:** Very High - Complete audit trail per periode
🎯 **Cocok untuk:** Production-ready dengan audit lengkap

### **Strategi C: Complete (All Phases)**
✅ **Implementasi:** Semua termasuk MahasiswaPeriode
⏱️ **Waktu:** 76 jam (2.5 minggu)
💰 **ROI:** Maximum - Future-proof system
🎯 **Cocok untuk:** Long-term investment, mahasiswa mengulang

---

## ⚠️ RISIKO & MITIGASI

### **Risiko Tinggi:**
1. **BimbinganTA** - Banyak fitur depend on this
   - Mitigasi: Testing menyeluruh, rollback plan
   
2. **MahasiswaPeriode** - Perubahan fundamental
   - Mitigasi: Implementasi di phase terakhir, extensive testing

### **Risiko Rendah:**
1. **NilaiSidang** - Fitur terisolasi
2. **History Tables** - Tidak critical untuk operasional

---

## 📋 CHECKLIST IMPLEMENTASI

### **Pre-Implementation:**
- [ ] Backup database production
- [ ] Setup staging environment
- [ ] Prepare rollback script
- [ ] Inform stakeholders

### **Implementation:**
- [ ] Update Prisma schema
- [ ] Generate migration files
- [ ] Test migration di dev
- [ ] Update API endpoints
- [ ] Update frontend queries
- [ ] Update documentation

### **Post-Implementation:**
- [ ] Run migration di staging
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 🎯 KESIMPULAN

**Rekomendasi Akhir:** **Strategi B (Phase 1 + 2)**

**Alasan:**
1. ✅ Cover semua critical entities
2. ✅ Audit trail lengkap per periode
3. ✅ Waktu reasonable (1.5 minggu)
4. ✅ ROI tinggi
5. ✅ MahasiswaPeriode bisa ditunda ke future release

**Effort Total:** **46 jam** ≈ **6 hari kerja** ≈ **1.5 minggu**

**Timeline Realistis:**
- Week 1: Phase 1 (BimbinganTA, NilaiSidang, DokumenTa)
- Week 2: Phase 2 (History tables) + Testing + Deploy

**Next Steps:**
1. Approval dari stakeholder
2. Schedule implementation window
3. Prepare backup & rollback plan
4. Execute Phase 1
5. Testing & validation
6. Execute Phase 2
7. Final testing & deploy
