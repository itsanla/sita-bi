# Jadwal Sidang Service - Modular Architecture

## 📁 Struktur File

```
jadwal-sidang/
├── types.ts                          # Shared interfaces & constants
├── pengaturan.service.ts             # Pengaturan & config management
├── slot-generator.service.ts         # Generate time slots
├── dosen-availability.service.ts     # Cek ketersediaan dosen
├── conflict-validator.service.ts     # Validasi konflik jadwal
├── scheduler.service.ts              # Algoritma penjadwalan
├── diagnostic.service.ts             # Smart diagnostic system
├── crud.service.ts                   # CRUD operations
├── update.service.ts                 # Update jadwal operations
├── jadwal-sidang.service.ts          # Main orchestrator
└── index.ts                          # Public exports
```

## ✅ Keuntungan Refactoring

1. **Menghilangkan Warning Cognitive Complexity** - Setiap service memiliki tanggung jawab tunggal
2. **Meningkatkan Maintainability** - Kode lebih mudah dipahami dan dimodifikasi
3. **Meningkatkan Testability** - Setiap service bisa ditest secara terpisah
4. **Mengikuti SOLID Principles** - Single Responsibility Principle
5. **Meningkatkan Reusability** - Komponen bisa digunakan ulang

## 📦 Service Descriptions

### types.ts
Berisi shared interfaces dan constants:
- `PERAN_PENGUJI`
- `PengaturanJadwal`
- `TimeSlot`

### pengaturan.service.ts
Mengelola konfigurasi sistem:
- `getPengaturan()` - Ambil semua pengaturan
- `getPengaturanByKey(key)` - Ambil pengaturan spesifik
- `getRuanganIds(namaRuangan)` - Convert nama ruangan ke ID

### slot-generator.service.ts
Generate time slots untuk jadwal:
- `generateTimeSlots()` - Generate slot berdasarkan pengaturan
- `isHariLibur()` - Cek apakah hari libur

### dosen-availability.service.ts
Cek ketersediaan dosen:
- `getDosenAvailable()` - Cari dosen yang tersedia
- Load balancing otomatis
- Hard & soft constraint checking

### conflict-validator.service.ts
Validasi konflik jadwal:
- `isSlotAvailable()` - Cek slot ruangan tersedia
- `validateNoConflict()` - Validasi konflik dosen

### scheduler.service.ts
Algoritma penjadwalan:
- `shuffleArray()` - Randomize array dengan crypto-safe

### diagnostic.service.ts
Smart diagnostic system:
- `runSmartDiagnostic()` - Analisis kapasitas & validasi

### crud.service.ts
Operasi CRUD:
- `getMahasiswaGagalSidang()`
- `getMahasiswaSiapSidang()`
- `getJadwalSidang()`
- `deleteAllJadwal()`
- `deleteJadwal(id)`
- `getEditOptions()`
- `moveSchedule()`
- `swapSchedule()`

### update.service.ts
Update jadwal operations:
- `updateJadwal()` - Update jadwal dengan validasi lengkap

### jadwal-sidang.service.ts
Main orchestrator yang menggunakan semua service di atas:
- `generateJadwalOtomatis()` - Generate jadwal otomatis
- Delegate ke service-service lain untuk operasi spesifik

## 🔄 Migration

File original `jadwal-sidang.service.ts` di parent directory sekarang hanya re-export:

```typescript
export { JadwalSidangService } from './jadwal-sidang/jadwal-sidang.service';
```

Semua import existing tetap berfungsi tanpa perubahan!

## 🚀 Usage

```typescript
import { JadwalSidangService } from './services/jadwal-sidang.service';

const service = new JadwalSidangService();
const jadwal = await service.generateJadwalOtomatis();
```

## 📝 Notes

- Backup file original tersimpan di `jadwal-sidang.service.ts.backup`
- Semua logika bisnis tetap sama, hanya struktur yang berubah
- Tidak ada breaking changes untuk API consumers
