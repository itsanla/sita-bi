# ANALISIS MENDALAM SISTEM PENJADWALAN SIDANG TUGAS AKHIR

## 🎯 OVERVIEW SISTEM

Sistem penjadwalan sidang adalah sistem **MULTI-LAYER** yang sangat kompleks dengan 3 subsistem utama:

1. **Subsistem Pengaturan Penjadwalan** (PenjadwalanSidang)
2. **Subsistem Penjadwalan Otomatis** (JadwalSidang)
3. **Subsistem Akses Kontrol** (Guards & Status)

---

## 📊 ARSITEKTUR DATABASE

### 1. Tabel `penjadwalan_sidang`
**Fungsi**: Mengontrol KAPAN jadwal akan di-generate dan status publikasi

```prisma
model PenjadwalanSidang {
  id               Int                      @id
  tanggal_generate DateTime?                // Kapan jadwal akan dipublish
  status           StatusPenjadwalanSidang  // BELUM_DIJADWALKAN | DIJADWALKAN | SELESAI
  dibuat_oleh      Int?
  created_at       DateTime
  updated_at       DateTime
}
```

**Status Flow**:
```
BELUM_DIJADWALKAN → DIJADWALKAN → SELESAI
     (default)      (set tanggal)  (auto/manual)
```

**Karakteristik Penting**:
- ❌ TIDAK ada relasi ke `periode_ta_id` (global untuk semua periode)
- ✅ Hanya ada 1 record aktif per waktu
- ✅ Auto-update status saat `tanggal_generate` tercapai
- ✅ Trigger auto-generate jadwal saat status berubah ke SELESAI

### 2. Tabel `jadwal_sidang`
**Fungsi**: Menyimpan detail jadwal sidang per mahasiswa

```prisma
model JadwalSidang {
  id            Int      @id
  sidang_id     Int      // FK ke Sidang
  tanggal       DateTime
  waktu_mulai   String   // HH:mm
  waktu_selesai String   // HH:mm
  ruangan_id    Int      // FK ke Ruangan
  created_at    DateTime
  updated_at    DateTime
}
```

**Relasi Krusial**:
```
JadwalSidang → Sidang → TugasAkhir → Mahasiswa
                  ↓
            PeranDosenTa (penguji1, penguji2, penguji3, pembimbing1)
```

### 3. Tabel `sidang`
**Fungsi**: Entitas sidang dengan status hasil

```prisma
model Sidang {
  id                    Int
  tugas_akhir_id        Int
  pendaftaran_sidang_id Int?
  jenis_sidang          JenisSidang  // PROPOSAL | AKHIR
  status_hasil          HasilSidang  // menunggu_penjadwalan | dijadwalkan | lulus | lulus_revisi | tidak_lulus
  selesai_sidang        Boolean
  is_active             Boolean
}
```

**Status Flow**:
```
menunggu_penjadwalan → dijadwalkan → lulus/lulus_revisi/tidak_lulus
   (after approved)    (scheduled)        (after sidang)
```

### 4. Tabel `mahasiswa`
**Fungsi**: Status mahasiswa terkait sidang

```prisma
model Mahasiswa {
  siap_sidang      Boolean  // Sudah divalidasi, siap dijadwalkan
  sidang_terjadwal Boolean  // Sudah masuk jadwal
  gagal_sidang     Boolean  // Tidak terjadwalkan (karena tidak daftar/ditolak)
  periode_gagal_id Int?     // Periode saat gagal
}
```

**Status Mahasiswa**:
- `siap_sidang = true` → Mahasiswa sudah divalidasi semua pihak
- `sidang_terjadwal = true` → Mahasiswa sudah masuk jadwal
- `gagal_sidang = true` → Mahasiswa tidak terjadwalkan di periode ini

### 5. Tabel `peran_dosen_ta`
**Fungsi**: Menyimpan peran dosen (pembimbing + penguji)

```prisma
model PeranDosenTa {
  tugas_akhir_id Int
  dosen_id       Int
  peran          PeranDosen  // pembimbing1 | pembimbing2 | penguji1 | penguji2 | penguji3
}
```

**Constraint**: `@@unique([tugas_akhir_id, peran])`

**Peran dalam Sidang**:
- `pembimbing1` → Sekretaris (hadir, input nilai final)
- `penguji1` → Ketua Penguji
- `penguji2` → Anggota Penguji I
- `penguji3` → Anggota Penguji II

---

## 🔄 ALUR LENGKAP SISTEM

### FASE 1: Pendaftaran Sidang (Status: BELUM_DIJADWALKAN/DIJADWALKAN)

**Akses**:
- ✅ Pendaftaran Sidang: TERBUKA
- ❌ Jadwal Sidang: TERTUTUP (overlay)

**Proses**:
1. Mahasiswa upload dokumen (NASKAH_TA, TOEIC, RAPOR, IJAZAH_SLTA, BEBAS_JURUSAN)
2. Mahasiswa submit pendaftaran
3. Validasi bertingkat:
   - Pembimbing 1 validasi
   - Pembimbing 2 validasi
   - Prodi validasi (D3/D4)
   - Jurusan validasi
4. Jika semua approve → `mahasiswa.siap_sidang = true`
5. Jika ada yang reject → `pendaftaran_sidang.rejected_by` + `rejection_reason`

**Status Mahasiswa**:
- `belum_daftar`: Belum submit pendaftaran
- `menunggu_validasi`: Submit tapi belum semua approve
- `ditolak`: Ada yang reject
- `siap_sidang`: Semua approve

### FASE 2: Pengaturan Jadwal Generate (Kaprodi)

**Endpoint**: `POST /penjadwalan-sidang/pengaturan`

**Input**:
```json
{
  "tanggal_generate": "2025-01-15T10:00:00"
}
```

**Proses**:
1. Validasi tanggal harus di masa depan
2. Upsert `penjadwalan_sidang`:
   - Jika ada record → update
   - Jika tidak ada → create
3. Set `status = DIJADWALKAN`
4. Set `tanggal_generate`

**Polling Mechanism**:
- Frontend polling setiap 15 detik
- Cek apakah `tanggal_generate <= now()`
- Jika ya → auto-update status ke SELESAI
- Trigger auto-generate jadwal

### FASE 3: Generate Jadwal Otomatis

**Trigger**:
1. Manual: Klik "Jadwalkan Sekarang"
2. Auto: Saat `tanggal_generate` tercapai

**Endpoint**: `POST /jadwal-sidang-smart/generate`

**Algoritma Smart Scheduling**:

#### Step 1: Load Data
```typescript
const pengaturan = await getPengaturan(); // Dari pengaturan_sistem
const mahasiswaSiap = await getMahasiswaSiapSidang(); // siap_sidang = true
const ruanganIds = await getRuanganIds(pengaturan.ruangan_sidang);
```

#### Step 2: Smart Diagnostic
```typescript
const diagnostic = await runSmartDiagnostic(pengaturan);
// Validasi:
// - Mahasiswa > 0
// - Ruangan > 0
// - Dosen > 0
// - Hari kerja > 0
// - Jam operasional cukup
// - Kapasitas dosen cukup (dengan margin safety)
```

**Perhitungan Kapasitas Dosen**:
```
Slot Dibutuhkan = mahasiswaCount × 3 penguji
Margin Safety = max_pembimbing_aktif / total_dosen
Slot Dibutuhkan (dengan margin) = Slot Dibutuhkan × (1 + Margin)
Kapasitas Tersedia = total_dosen × max_mahasiswa_uji_per_dosen

Jika Kapasitas Tersedia < Slot Dibutuhkan (dengan margin) → ERROR
```

**Contoh**:
- 20 mahasiswa, 10 dosen, max_pembimbing_aktif = 4, max_mahasiswa_uji = 4
- Slot dibutuhkan = 20 × 3 = 60
- Margin = 4 / 10 = 40%
- Slot dibutuhkan (dengan margin) = 60 × 1.4 = 84
- Kapasitas tersedia = 10 × 4 = 40
- 40 < 84 → ERROR (kuota minimal = 84 / 10 = 9)

#### Step 3: Generate Time Slots
```typescript
for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
  const tanggal = startDate + dayOffset;
  
  // Skip hari libur
  if (isHariLibur(tanggal, pengaturan)) continue;
  
  // Generate slots per ruangan
  const slots = generateTimeSlots(tanggal, pengaturan, ruanganIds);
  // Slots = jam_mulai sampai jam_selesai dengan interval (durasi + jeda)
  // Dengan mempertimbangkan waktu_istirahat dan jadwal_hari_khusus
}
```

**Fitur Jadwal Hari Khusus**:
```json
{
  "jadwal_hari_khusus": [
    {
      "hari": "jumat",
      "jam_mulai": "08:00",
      "jam_selesai": "11:00",
      "durasi_sidang_menit": 60,
      "jeda_sidang_menit": 10,
      "waktu_istirahat": [
        { "waktu": "10:00", "durasi_menit": 15 }
      ]
    }
  ]
}
```

#### Step 4: Assign Mahasiswa ke Slot
```typescript
for (const slot of slots) {
  if (unscheduled.length === 0) break;
  
  // Cek slot available (ruangan tidak bentrok)
  if (!await isSlotAvailable(slot)) continue;
  
  for (const sidang of unscheduled) {
    const pembimbingIds = getPembimbingIds(sidang);
    
    // Cari dosen available
    let availableDosen = await getDosenAvailable(slot, pembimbingIds, pengaturan, false);
    
    // Jika kurang dari 3, coba dengan soft constraint
    if (availableDosen.length < 3) {
      availableDosen = await getDosenAvailable(slot, pembimbingIds, pengaturan, true);
    }
    
    if (availableDosen.length >= 3) {
      // Random shuffle untuk fairness
      const pengujiIds = shuffleArray(availableDosen).slice(0, 3);
      
      // Validasi tidak ada conflict
      if (await validateNoConflict(slot, pengujiIds, pembimbingIds)) {
        // Simpan jadwal
        await saveJadwal(sidang, slot, pengujiIds);
        unscheduled.splice(i, 1);
      }
    }
  }
}
```

**Constraint Checking**:

1. **Hard Constraint** (HARUS dipenuhi):
   - Dosen tidak boleh di 2 tempat pada waktu EXACT yang sama
   - Pembimbing tidak boleh jadi penguji
   - Ruangan tidak bentrok

2. **Soft Constraint** (diusahakan):
   - Minimal ada jeda antar sidang untuk dosen yang sama
   - Load balancing beban dosen

**Load Balancing**:
```typescript
// Hitung total beban dosen (semua peran penguji dijumlahkan)
const dosenLoadMap = new Map<number, number>();
dosenLoadRaw.forEach((peran) => {
  const current = dosenLoadMap.get(peran.dosen_id) || 0;
  dosenLoadMap.set(peran.dosen_id, current + 1);
});

// Sort dosen by load (ascending)
availableDosen.sort((a, b) => {
  return (dosenLoadMap.get(a) || 0) - (dosenLoadMap.get(b) || 0);
});
```

#### Step 5: Update Status
```typescript
// Set mahasiswa yang terjadwalkan
await prisma.mahasiswa.update({
  where: { id: mahasiswa.id },
  data: { sidang_terjadwal: true }
});

// Set mahasiswa yang gagal
await prisma.mahasiswa.updateMany({
  where: {
    tugasAkhir: { periode_ta_id: periodeAktif.id },
    sidang_terjadwal: false,
    gagal_sidang: false,
  },
  data: {
    gagal_sidang: true,
    periode_gagal_id: periodeAktif.id,
  }
});

// Update status penjadwalan
await prisma.penjadwalanSidang.update({
  where: { id: penjadwalan.id },
  data: { status: 'SELESAI' }
});
```

### FASE 4: Publikasi Jadwal (Status: SELESAI)

**Akses**:
- ❌ Pendaftaran Sidang: TERTUTUP (PendaftaranSidangGuard)
- ✅ Jadwal Sidang: TERBUKA (semua mahasiswa bisa lihat)

**Guard Behavior**:

**JadwalSidangGuard** (3 kondisi):

1. **BELUM_DIJADWALKAN**:
   - Tampilkan overlay dengan status pendaftaran mahasiswa
   - Notifikasi: "Kaprodi belum mengatur jadwal publish"

2. **DIJADWALKAN**:
   - Tampilkan overlay dengan status pendaftaran + tanggal publish
   - Notifikasi: "Jadwal akan dipublish pada [tanggal]"

3. **SELESAI**:
   - Tampilkan banner notifikasi sesuai status:
     - Belum daftar → Red banner
     - Menunggu validasi → Amber banner
     - Disetujui → Green banner
   - Tampilkan children (daftar jadwal untuk SEMUA mahasiswa)

**PendaftaranSidangGuard**:
- Jika `status === SELESAI` → Block akses pendaftaran
- Redirect ke menu Jadwal Sidang

---

## 🔧 FITUR MANAJEMEN JADWAL

### 1. Edit Jadwal Individual
**Endpoint**: `PATCH /jadwal-sidang-smart/jadwal/:id`

**Validasi**:
- Conflict check (ruangan + dosen)
- Pembimbing tidak boleh jadi penguji
- Waktu mulai < waktu selesai

**Proses**:
```typescript
await prisma.$transaction(async (tx) => {
  // Update jadwal
  await tx.jadwalSidang.update({ where: { id }, data: updateData });
  
  // Update penguji (jika ada perubahan)
  if (penguji_ids_changed) {
    await tx.peranDosenTa.deleteMany({ where: { tugas_akhir_id, peran: 'penguji*' } });
    await tx.peranDosenTa.createMany({ data: newPenguji });
  }
});
```

### 2. Swap Schedule (Tukar Jadwal)
**Endpoint**: `POST /jadwal-sidang-smart/swap-schedule`

**Input**:
```json
{
  "jadwal1_id": 1,
  "jadwal2_id": 2
}
```

**Proses**:
```typescript
// Swap tanggal, waktu, dan ruangan
const temp = { tanggal: jadwal1.tanggal, waktu_mulai: jadwal1.waktu_mulai, ... };
await tx.jadwalSidang.update({ where: { id: jadwal1_id }, data: jadwal2Data });
await tx.jadwalSidang.update({ where: { id: jadwal2_id }, data: temp });
```

### 3. Move Schedule (Pindahkan Jadwal Massal)
**Endpoint**: `POST /jadwal-sidang-smart/move-schedule`

**Input**:
```json
{
  "from_date": "2025-01-15",
  "to_date": "2025-01-20"
}
```

**Proses**:
```typescript
const daysDiff = (to_date - from_date) / (1000 * 60 * 60 * 24);

for (const jadwal of jadwalToMove) {
  const daysFromStart = (jadwal.tanggal - from_date) / (1000 * 60 * 60 * 24);
  const newDate = to_date + daysFromStart;
  await tx.jadwalSidang.update({ where: { id: jadwal.id }, data: { tanggal: newDate } });
}
```

### 4. Export PDF/Excel
**Service**: `ExportService`

**Fitur**:
- Header akademik (Politeknik Negeri Padang)
- Tabel dengan kolom: No, Mahasiswa, NIM, Ketua, Sekretaris, Anggota I, Anggota II, Hari/Tanggal, Pukul, Ruangan
- Auto pagination untuk PDF
- Styling profesional

---

## 🔐 SISTEM AKSES KONTROL

### Guards Hierarchy
```
PeriodeGuard (cek periode aktif)
  └─ TAGuard (cek punya tugas akhir)
      └─ PendaftaranSidangGuard (cek status penjadwalan)
      └─ JadwalSidangGuard (cek status penjadwalan)
```

### Polling Mechanism

**usePenjadwalanSidangStatus Hook**:
```typescript
useEffect(() => {
  // Initial fetch
  fetchStatus();
  
  // Polling setiap 15 detik jika status = DIJADWALKAN
  if (status?.status === 'DIJADWALKAN') {
    const interval = setInterval(() => {
      fetchStatus();
    }, 15000);
    return () => clearInterval(interval);
  }
}, [status]);
```

**Auto-reload saat status berubah**:
```typescript
useEffect(() => {
  if (wasNotGeneratedRef.current && status?.status === 'SELESAI') {
    window.location.reload();
  }
}, [status]);
```

---

## 📝 PENGATURAN DINAMIS

Semua pengaturan disimpan di tabel `pengaturan_sistem`:

### Pengaturan Wajib
```json
{
  "max_mahasiswa_uji_per_dosen": 4,
  "max_pembimbing_aktif": 4,
  "durasi_sidang_menit": 90,
  "jeda_sidang_menit": 15,
  "jam_mulai_sidang": "08:00",
  "jam_selesai_sidang": "15:00",
  "hari_libur_tetap": ["sabtu", "minggu"],
  "ruangan_sidang": ["Ruang 301", "Ruang 302"]
}
```

### Pengaturan Opsional
```json
{
  "tanggal_libur_khusus": [
    { "tanggal": "2025-01-01", "keterangan": "Tahun Baru" }
  ],
  "waktu_istirahat": [
    { "waktu": "12:00", "durasi_menit": 60 }
  ],
  "jadwal_hari_khusus": [
    {
      "hari": "jumat",
      "jam_mulai": "08:00",
      "jam_selesai": "11:00",
      "durasi_sidang_menit": 60,
      "jeda_sidang_menit": 10
    }
  ]
}
```

---

## 🚨 ERROR HANDLING

### Error Types

1. **TIDAK_ADA_MAHASISWA**
```json
{
  "status": "TIDAK_ADA_MAHASISWA",
  "masalah": "Tidak ada mahasiswa yang siap sidang.",
  "saran": "Pastikan ada mahasiswa dengan status siap_sidang = true"
}
```

2. **KAPASITAS_DOSEN_TIDAK_CUKUP**
```json
{
  "status": "KAPASITAS_DOSEN_TIDAK_CUKUP",
  "masalah": "Kapasitas dosen tidak mencukupi",
  "perhitungan": "...", // Detail perhitungan
  "saran": "Naikkan quota dari X menjadi Y",
  "detail": { ... }
}
```

3. **PEMBIMBING_OVERLOAD**
```json
{
  "status": "PEMBIMBING_OVERLOAD",
  "masalah": "Ada N dosen yang membimbing melebihi batas",
  "detail": ["Dosen A (5 mahasiswa, max: 4)"],
  "saran": "Kurangi jumlah mahasiswa atau naikkan max_pembimbing_aktif"
}
```

4. **TIDAK_ADA_SLOT**
```json
{
  "status": "TIDAK_ADA_SLOT",
  "masalah": "Tidak dapat menjadwalkan X mahasiswa dalam 365 hari",
  "saran": "Tambah ruangan atau perbesar jam operasional"
}
```

---

## 🎨 UI/UX FLOW

### Halaman Kaprodi: Penjadwalan

**Komponen**: `PenjadwalanSidang.tsx`

**Sections**:

1. **Atur Jadwal Generate Otomatis**
   - Status BELUM_DIJADWALKAN: Form input tanggal + jam
   - Status DIJADWALKAN: Card biru dengan info + button Batalkan
   - Status SELESAI: Card hijau dengan info + button Hapus

2. **Status Mahasiswa Sidang**
   - Filter: Semua, Siap Sidang, Menunggu Validasi, Ditolak, Belum Daftar
   - Search: Nama/NIM
   - Button: Jadwalkan Sekarang (X mahasiswa)
   - List mahasiswa dengan status badge

3. **Jadwal Sidang Tersimpan**
   - Tabel dengan pagination
   - Search: Nama/NIM/Dosen
   - Actions: Edit, Hapus, Tukar, Pindahkan, Export

**Error Display**:
- Smart error dengan perhitungan detail
- Saran solusi yang actionable
- Detail teknis (collapsible)

### Halaman Mahasiswa: Jadwal Sidang

**Guards**: PeriodeGuard → TAGuard → JadwalSidangGuard

**Behavior**:
- BELUM_DIJADWALKAN: Overlay dengan status pendaftaran
- DIJADWALKAN: Overlay dengan tanggal publish
- SELESAI: Banner notifikasi + daftar jadwal

---

## 🔄 SERVICE DEPENDENCIES

### RuanganSyncService
**Fungsi**: Sync ruangan dari pengaturan ke tabel Ruangan

```typescript
async syncRuanganFromPengaturan() {
  const pengaturan = await prisma.pengaturanSistem.findFirst({
    where: { key: 'ruangan_sidang' }
  });
  
  let ruanganList = JSON.parse(pengaturan.value);
  
  for (const namaRuangan of ruanganList) {
    await prisma.ruangan.upsert({
      where: { nama_ruangan: namaRuangan },
      create: { nama_ruangan, lokasi: 'Gedung Utama', kapasitas: 30 },
      update: {}
    });
  }
}
```

### ExportService
**Fungsi**: Generate PDF dan Excel

**Methods**:
- `generatePDF(data)`: Export jadwal ke PDF
- `generateExcel(data)`: Export jadwal ke Excel
- `generatePDFGagalSidang(data)`: Export mahasiswa gagal sidang

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Normal Flow
1. Kaprodi set tanggal generate
2. Polling menunggu tanggal tercapai
3. Auto-generate jadwal
4. Status berubah ke SELESAI
5. Mahasiswa bisa lihat jadwal

### Scenario 2: Manual Generate
1. Kaprodi klik "Jadwalkan Sekarang"
2. Generate langsung tanpa tunggu tanggal
3. Status langsung SELESAI

### Scenario 3: Kapasitas Tidak Cukup
1. Generate dengan dosen kurang
2. Error dengan perhitungan detail
3. Saran naikkan quota

### Scenario 4: Edit Jadwal
1. Kaprodi edit jadwal individual
2. Conflict check
3. Update jadwal + penguji

### Scenario 5: Swap Jadwal
1. Kaprodi pilih 2 mahasiswa
2. Swap tanggal, waktu, ruangan
3. Jadwal bertukar

---

## 📊 METRICS & MONITORING

### Logging Points
- `[BACKEND] 🚀 Starting generateJadwalOtomatis`
- `[BACKEND] 🧠 Running Smart Diagnostic`
- `[BACKEND] ✅ [X/Y] Mahasiswa scheduled`
- `[BACKEND] ❌ Failed to schedule X mahasiswa`
- `[FRONTEND] 🔄 Fetching jadwal`
- `[FRONTEND] ✅ Generate completed`

### Performance Considerations
- Batch operations dalam transaksi
- Pagination untuk list mahasiswa
- Lazy loading untuk jadwal tersimpan
- Debounce untuk search

---

## 🔑 KEY TAKEAWAYS

1. **3 Status Penjadwalan**: BELUM_DIJADWALKAN → DIJADWALKAN → SELESAI
2. **Auto-trigger**: Saat tanggal_generate tercapai, auto-generate jadwal
3. **Smart Algorithm**: Constraint satisfaction + load balancing + margin safety
4. **Guards**: Kontrol akses berdasarkan status penjadwalan
5. **Polling**: Auto-refresh setiap 15 detik untuk real-time update
6. **Transparansi**: Semua mahasiswa bisa lihat jadwal setelah dipublish
7. **Error Handling**: Smart diagnostic dengan perhitungan detail dan saran
8. **Manajemen Jadwal**: Edit, Swap, Move, Delete, Export
9. **Validasi Ketat**: Pembimbing tidak boleh jadi penguji, conflict detection
10. **Load Balancing**: Distribusi beban dosen merata

---

## 🎯 CRITICAL POINTS UNTUK TASK SELANJUTNYA

1. **Status Flow**: Pahami 3 status dan transisinya
2. **Polling**: Jangan lupa implement polling untuk auto-update
3. **Guards**: Gunakan guards yang tepat untuk kontrol akses
4. **Constraint**: Pahami hard vs soft constraint
5. **Margin Safety**: Perhitungan kapasitas harus include margin
6. **Load Balancing**: Sort dosen by load untuk fairness
7. **Error Handling**: Tampilkan error dengan detail dan saran
8. **Transaksi**: Gunakan transaction untuk operasi batch
9. **Validasi**: Cek conflict sebelum save
10. **Auto-reload**: Reload page saat status berubah ke SELESAI

