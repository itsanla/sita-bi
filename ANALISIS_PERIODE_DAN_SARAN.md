# 📊 Analisis Sistem Periode & Saran Pemisahan Data

## 🔍 Analisis Sistem Periode Saat Ini

### 1. **Model PeriodeTa**
```prisma
model PeriodeTa {
  id                    Int           @id
  tahun                 Int           @unique
  nama                  String
  tanggal_buka          DateTime?
  tanggal_tutup         DateTime?
  status                StatusPeriode // PERSIAPAN, AKTIF, SELESAI
  pengaturan_snapshot   String?       // JSON snapshot pengaturan
  dibuka_oleh           Int?
  ditutup_oleh          Int?
  catatan_penutupan     String?
}
```

**Status Periode:**
- `PERSIAPAN`: Periode baru dibuat, belum aktif
- `AKTIF`: Periode sedang berjalan (hanya 1 periode aktif)
- `SELESAI`: Periode sudah ditutup

### 2. **Relasi dengan Entitas Lain**

#### ✅ **Sudah Terhubung dengan Periode:**
1. **TugasAkhir** → `periode_ta_id`
2. **TawaranTopik** → `periode_ta_id`
3. **PengajuanBimbingan** → `periode_ta_id`
4. **Sidang** → `periode_ta_id`
5. **PendaftaranSidang** → `periode_ta_id`
6. **JadwalSidang** → `periode_ta_id`
7. **PenjadwalanSidang** → `periode_ta_id`

#### ❌ **Belum Terhubung dengan Periode:**
1. **BimbinganTA** - Tidak ada `periode_ta_id`
2. **NilaiSidang** - Tidak ada `periode_ta_id`
3. **DokumenTa** - Tidak ada `periode_ta_id`
4. **HistoryTopikMahasiswa** - Tidak ada `periode_ta_id`
5. **HistoryPerubahanJadwal** - Tidak ada `periode_ta_id`
6. **HistoryPerubahanSidang** - Tidak ada `periode_ta_id`
7. **HistoryPenugasanDosen** - Tidak ada `periode_ta_id`

---

## 🎯 Saran Pemisahan Data Per Periode

### **A. Strategi Pemisahan Data**

#### **1. Pemisahan Langsung (Direct Period Link)**
Entitas yang **harus** memiliki `periode_ta_id`:

```prisma
// ✅ SUDAH ADA - Perlu dipastikan konsisten
model TugasAkhir {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}

model Sidang {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}

// ❌ PERLU DITAMBAHKAN
model BimbinganTA {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}

model NilaiSidang {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}

model DokumenTa {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

#### **2. Pemisahan Tidak Langsung (Inherited Period)**
Entitas yang **mewarisi** periode dari parent:

```typescript
// Contoh: NilaiSidang mewarisi periode dari Sidang
const nilaiSidang = await prisma.nilaiSidang.findMany({
  where: {
    sidang: {
      periode_ta_id: periodeAktif.id
    }
  }
});

// Contoh: BimbinganTA mewarisi periode dari TugasAkhir
const bimbingan = await prisma.bimbinganTA.findMany({
  where: {
    tugasAkhir: {
      periode_ta_id: periodeAktif.id
    }
  }
});
```

---

## 📋 Rekomendasi Implementasi

### **Prioritas 1: Entitas Wajib Periode (CRITICAL)**

#### **1. BimbinganTA**
```prisma
model BimbinganTA {
  id                Int             @id @default(autoincrement())
  tugas_akhir_id    Int
  dosen_id          Int
  periode_ta_id     Int?            // ✅ TAMBAHKAN
  peran             String
  sesi_ke           Int
  // ... fields lainnya
  
  periodeTa         PeriodeTa?      @relation(fields: [periode_ta_id], references: [id])
}
```

**Alasan:**
- Bimbingan adalah aktivitas utama per periode
- Perlu tracking bimbingan per periode untuk laporan
- Mahasiswa bisa mengulang TA di periode berbeda

**Migrasi Data:**
```typescript
// Set periode_ta_id dari TugasAkhir parent
UPDATE bimbingan_ta 
SET periode_ta_id = (
  SELECT periode_ta_id 
  FROM tugas_akhir 
  WHERE tugas_akhir.id = bimbingan_ta.tugas_akhir_id
)
```

#### **2. NilaiSidang**
```prisma
model NilaiSidang {
  id            Int      @id @default(autoincrement())
  sidang_id     Int
  dosen_id      Int
  periode_ta_id Int?     // ✅ TAMBAHKAN
  aspek         String
  skor          Float
  // ... fields lainnya
  
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

**Alasan:**
- Nilai sidang harus terpisah per periode
- Mahasiswa yang gagal bisa sidang ulang di periode baru
- Laporan nilai per periode

**Migrasi Data:**
```typescript
// Set periode_ta_id dari Sidang parent
UPDATE nilai_sidang 
SET periode_ta_id = (
  SELECT periode_ta_id 
  FROM sidang 
  WHERE sidang.id = nilai_sidang.sidang_id
)
```

#### **3. DokumenTa**
```prisma
model DokumenTa {
  id                 Int                  @id @default(autoincrement())
  tugas_akhir_id     Int
  periode_ta_id      Int?                 // ✅ TAMBAHKAN
  tipe_dokumen       TipeDokumenBimbingan
  version            Int
  // ... fields lainnya
  
  periodeTa          PeriodeTa?           @relation(fields: [periode_ta_id], references: [id])
}
```

**Alasan:**
- Dokumen bisa berbeda per periode (revisi, update)
- Tracking versi dokumen per periode
- Mahasiswa mengulang perlu upload dokumen baru

---

### **Prioritas 2: Entitas History (MEDIUM)**

#### **4. HistoryTopikMahasiswa**
```prisma
model HistoryTopikMahasiswa {
  id               Int      @id @default(autoincrement())
  mahasiswa_id     Int
  tawaran_topik_id Int
  periode_ta_id    Int?     // ✅ TAMBAHKAN
  status           String
  
  periodeTa        PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

**Alasan:**
- Mahasiswa bisa ganti topik di periode berbeda
- Tracking history pemilihan topik per periode

#### **5. HistoryPerubahanJadwal**
```prisma
model HistoryPerubahanJadwal {
  id               Int       @id @default(autoincrement())
  bimbingan_ta_id  Int
  mahasiswa_id     Int
  periode_ta_id    Int?      // ✅ TAMBAHKAN
  // ... fields lainnya
  
  periodeTa        PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

#### **6. HistoryPerubahanSidang**
```prisma
model HistoryPerubahanSidang {
  id               Int      @id @default(autoincrement())
  sidang_id        Int
  user_id          Int?
  periode_ta_id    Int?     // ✅ TAMBAHKAN
  perubahan        String
  
  periodeTa        PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

#### **7. HistoryPenugasanDosen**
```prisma
model HistoryPenugasanDosen {
  id             Int      @id @default(autoincrement())
  tugas_akhir_id Int
  admin_id       Int
  dosen_id       Int
  periode_ta_id  Int?     // ✅ TAMBAHKAN
  peran          String
  action         String
  
  periodeTa      PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

---

### **Prioritas 3: Entitas Mahasiswa (LOW - Optional)**

#### **8. Mahasiswa - Tracking Status Per Periode**

**Opsi A: Tambah Field Periode di Mahasiswa (Simple)**
```prisma
model Mahasiswa {
  id                    Int              @id
  // ... fields existing
  periode_aktif_id      Int?             // Periode TA yang sedang dijalani
  periode_gagal_id      Int?             // ✅ SUDAH ADA
  
  periodeAktif          PeriodeTa?       @relation("MahasiswaPeriodeAktif", fields: [periode_aktif_id], references: [id])
}
```

**Opsi B: Tabel Terpisah (Recommended)**
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
  @@map("mahasiswa_periode")
}
```

**Keuntungan Opsi B:**
- ✅ History lengkap status mahasiswa per periode
- ✅ Mahasiswa bisa mengulang di periode baru dengan status fresh
- ✅ Laporan per periode lebih mudah
- ✅ Tidak mengubah struktur tabel Mahasiswa existing

---

## 🔄 Strategi Migrasi Data

### **Step 1: Tambah Kolom periode_ta_id**
```sql
-- BimbinganTA
ALTER TABLE bimbingan_ta ADD COLUMN periode_ta_id INTEGER;

-- NilaiSidang
ALTER TABLE nilai_sidang ADD COLUMN periode_ta_id INTEGER;

-- DokumenTa
ALTER TABLE dokumen_ta ADD COLUMN periode_ta_id INTEGER;

-- History tables
ALTER TABLE history_topik_mahasiswa ADD COLUMN periode_ta_id INTEGER;
ALTER TABLE history_perubahan_jadwal ADD COLUMN periode_ta_id INTEGER;
ALTER TABLE history_perubahan_sidang ADD COLUMN periode_ta_id INTEGER;
ALTER TABLE history_penugasan_dosen ADD COLUMN periode_ta_id INTEGER;
```

### **Step 2: Populate Data dari Parent**
```typescript
// BimbinganTA: ambil dari TugasAkhir
await prisma.$executeRaw`
  UPDATE bimbingan_ta 
  SET periode_ta_id = (
    SELECT periode_ta_id 
    FROM tugas_akhir 
    WHERE tugas_akhir.id = bimbingan_ta.tugas_akhir_id
  )
`;

// NilaiSidang: ambil dari Sidang
await prisma.$executeRaw`
  UPDATE nilai_sidang 
  SET periode_ta_id = (
    SELECT periode_ta_id 
    FROM sidang 
    WHERE sidang.id = nilai_sidang.sidang_id
  )
`;

// DokumenTa: ambil dari TugasAkhir
await prisma.$executeRaw`
  UPDATE dokumen_ta 
  SET periode_ta_id = (
    SELECT periode_ta_id 
    FROM tugas_akhir 
    WHERE tugas_akhir.id = dokumen_ta.tugas_akhir_id
  )
`;
```

### **Step 3: Update Prisma Schema**
```prisma
// Update schema dengan relasi baru
model BimbinganTA {
  periode_ta_id Int?
  periodeTa     PeriodeTa? @relation(fields: [periode_ta_id], references: [id])
}
```

### **Step 4: Generate & Deploy**
```bash
npx prisma generate
npx prisma migrate dev --name add_periode_to_entities
```

---

## 🎯 Query Pattern Setelah Implementasi

### **1. Filter Data Per Periode Aktif**
```typescript
// Get periode aktif
const periodeAktif = await prisma.periodeTa.findFirst({
  where: { status: 'AKTIF' }
});

// Query dengan filter periode
const bimbingan = await prisma.bimbinganTA.findMany({
  where: {
    periode_ta_id: periodeAktif.id
  }
});

const nilaiSidang = await prisma.nilaiSidang.findMany({
  where: {
    periode_ta_id: periodeAktif.id
  }
});
```

### **2. Laporan Per Periode**
```typescript
// Statistik bimbingan per periode
const statsBimbingan = await prisma.bimbinganTA.groupBy({
  by: ['periode_ta_id', 'status_bimbingan'],
  _count: true,
  where: {
    periode_ta_id: periodeId
  }
});

// Statistik kelulusan per periode
const statsKelulusan = await prisma.nilaiSidang.groupBy({
  by: ['periode_ta_id'],
  _avg: { skor: true },
  _count: true,
  where: {
    periode_ta_id: periodeId
  }
});
```

### **3. Mahasiswa Mengulang**
```typescript
// Cari mahasiswa yang gagal di periode sebelumnya
const mahasiswaMengulang = await prisma.mahasiswa.findMany({
  where: {
    gagal_sidang: true,
    periode_gagal_id: periodeLaluId,
    tugasAkhir: {
      periode_ta_id: periodeAktif.id // Mengulang di periode baru
    }
  }
});
```

---

## 📊 Keuntungan Implementasi

### **1. Isolasi Data Per Periode**
- ✅ Data periode lama tidak tercampur dengan periode baru
- ✅ Mahasiswa mengulang punya data fresh di periode baru
- ✅ Laporan per periode akurat

### **2. Performance**
- ✅ Query lebih cepat dengan filter periode
- ✅ Index pada `periode_ta_id` mempercepat pencarian
- ✅ Tidak perlu scan semua data

### **3. Audit & Compliance**
- ✅ History lengkap per periode
- ✅ Tracking perubahan per periode
- ✅ Laporan akreditasi per periode

### **4. Fleksibilitas**
- ✅ Bisa buka/tutup periode kapan saja
- ✅ Mahasiswa bisa mengulang tanpa konflik data
- ✅ Pengaturan bisa berbeda per periode (snapshot)

---

## ⚠️ Pertimbangan Penting

### **1. Backward Compatibility**
- Data lama (tanpa periode) harus tetap bisa diakses
- Gunakan `periode_ta_id: null` untuk legacy data
- Query harus handle `OR [{ periode_ta_id: aktif }, { periode_ta_id: null }]`

### **2. Cascade Delete**
- Jangan cascade delete periode ke data
- Gunakan soft delete untuk periode
- Data historis harus tetap ada meski periode dihapus

### **3. Unique Constraints**
- Beberapa constraint perlu update dengan periode
- Contoh: `@@unique([mahasiswa_id, periode_ta_id])` untuk MahasiswaPeriode

---

## 🚀 Roadmap Implementasi

### **Phase 1: Critical Entities (Week 1-2)**
1. ✅ Tambah `periode_ta_id` ke BimbinganTA
2. ✅ Tambah `periode_ta_id` ke NilaiSidang
3. ✅ Tambah `periode_ta_id` ke DokumenTa
4. ✅ Migrasi data existing
5. ✅ Update API untuk filter periode

### **Phase 2: History Entities (Week 3)**
1. ✅ Tambah `periode_ta_id` ke semua History tables
2. ✅ Migrasi data existing
3. ✅ Update laporan untuk include periode

### **Phase 3: Mahasiswa Periode (Week 4)**
1. ✅ Buat tabel MahasiswaPeriode
2. ✅ Migrasi status mahasiswa ke tabel baru
3. ✅ Update logic mahasiswa mengulang
4. ✅ Testing end-to-end

### **Phase 4: Optimization (Week 5)**
1. ✅ Tambah index pada `periode_ta_id`
2. ✅ Optimize query dengan periode
3. ✅ Performance testing
4. ✅ Documentation

---

## 📝 Kesimpulan

**Rekomendasi Utama:**
1. **Implementasikan periode_ta_id di semua entitas utama** (BimbinganTA, NilaiSidang, DokumenTa)
2. **Buat tabel MahasiswaPeriode** untuk tracking status mahasiswa per periode
3. **Gunakan strategi migrasi bertahap** untuk minimize downtime
4. **Maintain backward compatibility** untuk data legacy

**Prioritas Implementasi:**
- 🔴 **HIGH**: BimbinganTA, NilaiSidang, DokumenTa
- 🟡 **MEDIUM**: History tables
- 🟢 **LOW**: MahasiswaPeriode (nice to have)

Dengan implementasi ini, sistem akan memiliki **pemisahan data yang jelas per periode**, memudahkan **mahasiswa mengulang**, dan menghasilkan **laporan yang akurat**.
