# Jadwal Sidang Per Periode TA

## Perubahan yang Dilakukan

### 1. Schema Database (schema.prisma)
- Menambahkan kolom `periode_ta_id` (nullable) ke model `JadwalSidang`
- Menambahkan relasi `periodeTa` di model `JadwalSidang`
- Menambahkan relasi `jadwalSidang` di model `PeriodeTa`

```prisma
model JadwalSidang {
  id            Int      @id @default(autoincrement())
  sidang_id     Int
  periode_ta_id Int?     // ← BARU
  tanggal       DateTime
  waktu_mulai   String
  waktu_selesai String
  ruangan_id    Int
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  sidang    Sidang     @relation(fields: [sidang_id], references: [id], onDelete: Cascade)
  periodeTa PeriodeTa? @relation(fields: [periode_ta_id], references: [id])  // ← BARU
  ruangan   Ruangan    @relation(fields: [ruangan_id], references: [id])

  @@map("jadwal_sidang")
}
```

### 2. Service (jadwal-sidang.service.ts)

#### a. generateJadwalOtomatis()
- Saat membuat jadwal baru, otomatis menyimpan `periode_ta_id` dari periode aktif
- Jadwal sidang sekarang terikat dengan periode TA yang sedang aktif

```typescript
const periodeAktif = await tx.periodeTa.findFirst({
  where: { status: 'AKTIF' },
});

const jadwal = await tx.jadwalSidang.create({
  data: {
    sidang_id: sidang.id,
    periode_ta_id: periodeAktif?.id,  // ← BARU
    tanggal: slot.tanggal,
    waktu_mulai: slot.waktu_mulai,
    waktu_selesai: slot.waktu_selesai,
    ruangan_id: slot.ruangan_id,
  },
  include: { ruangan: true },
});
```

#### b. getJadwalSidang()
- Hanya menampilkan jadwal sidang untuk periode aktif
- Jadwal dari periode lama tidak akan muncul

```typescript
const periodeAktif = await prisma.periodeTa.findFirst({
  where: { status: 'AKTIF' },
});

const jadwal = await prisma.jadwalSidang.findMany({
  where: {
    periode_ta_id: periodeAktif?.id,  // ← BARU: Filter by periode
  },
  include: { ... },
});
```

#### c. deleteAllJadwal()
- Hanya menghapus jadwal untuk periode aktif
- Jadwal dari periode lama tetap tersimpan di database

```typescript
// Hapus jadwal untuk periode aktif saja
const result = await tx.jadwalSidang.deleteMany({
  where: { periode_ta_id: periodeAktif?.id },  // ← BARU
});
```

## Manfaat

### 1. **Segmentasi Data Per Periode**
- Setiap periode TA memiliki jadwal sidang sendiri
- Data tidak tercampur antar periode

### 2. **Histori Terjaga**
- Jadwal sidang periode lama tetap tersimpan
- Bisa digunakan untuk laporan atau audit

### 3. **Isolasi Operasi**
- Hapus jadwal hanya mempengaruhi periode aktif
- Generate jadwal baru tidak mengganggu data periode lama

### 4. **Konsistensi Data**
- Relasi antara jadwal, sidang, dan periode lebih jelas
- Mudah untuk query data per periode

## Migrasi Database

Migration telah dibuat dan dijalankan:
```
20251211042559_add_periode_to_jadwal_sidang
```

Kolom `periode_ta_id` bersifat nullable untuk backward compatibility dengan data lama.

## Testing

Setelah implementasi, pastikan untuk test:
1. Generate jadwal sidang → cek `periode_ta_id` terisi
2. Lihat jadwal → hanya muncul jadwal periode aktif
3. Hapus jadwal → hanya jadwal periode aktif yang terhapus
4. Tutup periode → jadwal periode lama tetap ada di database
5. Buka periode baru → generate jadwal baru dengan `periode_ta_id` baru

## Backward Compatibility

- Jadwal lama yang tidak punya `periode_ta_id` (NULL) tidak akan muncul di list
- Ini aman karena jadwal lama seharusnya sudah tidak relevan
- Jika perlu, bisa dilakukan data migration untuk mengisi `periode_ta_id` jadwal lama
