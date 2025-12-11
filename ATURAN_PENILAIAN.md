# Aturan Penilaian Sidang

## 📋 Overview

Fitur Aturan Penilaian memungkinkan Dosen Jurusan untuk menentukan rumus perhitungan nilai akhir sidang secara dinamis dan fleksibel.

## 🎯 Fitur Utama

### 1. Formula Builder
- **Lokasi**: Dashboard Dosen → Aturan Umum → Aturan Penilaian Sidang (paling bawah)
- **Akses**: Hanya Dosen Jurusan
- **Fungsi**: Menentukan rumus perhitungan nilai akhir dari 3 penguji

### 2. Variabel yang Tersedia
- `p1` - Nilai dari Penguji 1 (Ketua)
- `p2` - Nilai dari Penguji 2 (Anggota I)
- `p3` - Nilai dari Penguji 3 (Anggota II)

### 3. Operator Matematika
- `+` - Penjumlahan
- `-` - Pengurangan
- `*` - Perkalian
- `/` - Pembagian
- `(` `)` - Kurung untuk prioritas operasi

## 💡 Contoh Rumus

### 1. Rata-rata Sederhana
```
(p1 + p2 + p3) / 3
```
Semua penguji memiliki bobot yang sama.

### 2. Penguji 1 Bobot 2x
```
(p1 * 2 + p2 + p3) / 4
```
Penguji 1 (Ketua) memiliki bobot 2x lipat dari penguji lainnya.

### 3. Rata-rata Bertingkat
```
((p1 + p2) / 2 + p3) / 2
```
Rata-rata P1 & P2 terlebih dahulu, kemudian dirata-rata dengan P3.

### 4. Bobot Persentase
```
(p1 * 0.4 + p2 * 0.3 + p3 * 0.3)
```
- Penguji 1: 40%
- Penguji 2: 30%
- Penguji 3: 30%

### 5. Rumus Custom
```
((p1 + p2) - p3) / 3
```
Dosen Jurusan bebas membuat rumus sesuai kebutuhan.

## 🔧 Cara Penggunaan

### 1. Akses Halaman Aturan
```
http://localhost:3001/dashboard/dosen/aturan-umum
```

### 2. Scroll ke Bagian "Aturan Penilaian Sidang"
Terletak di paling bawah halaman.

### 3. Input Rumus
- Ketik rumus secara manual, atau
- Gunakan tombol quick insert untuk variabel dan operator
- Gunakan contoh rumus yang tersedia

### 4. Validasi Otomatis
Sistem akan otomatis memvalidasi rumus:
- ✅ **Valid**: Menampilkan contoh hasil perhitungan
- ❌ **Invalid**: Menampilkan pesan error

### 5. Simpan Perubahan
Klik tombol "Simpan Perubahan" di bagian bawah halaman.

## 🗄️ Struktur Database

### Tabel: `pengaturan_sistem`
```sql
key: 'rumus_penilaian'
value: '(p1 + p2 + p3) / 3'
deskripsi: 'Rumus perhitungan nilai akhir sidang menggunakan p1, p2, p3'
```

## 🔐 Keamanan

### Validasi Frontend
- Validasi sintaks rumus secara real-time
- Preview hasil perhitungan dengan nilai dummy
- Mencegah input rumus yang invalid

### Validasi Backend
- Zod schema validation
- Minimal 1 karakter
- Disimpan sebagai string di database

## 📊 Implementasi di Sistem Penilaian

### Flow Penggunaan Rumus
1. Sekretaris (Pembimbing 1) input nilai dari 3 penguji
2. Sistem mengambil rumus dari `pengaturan_sistem`
3. Replace variabel: `p1`, `p2`, `p3` dengan nilai aktual
4. Evaluasi rumus menggunakan JavaScript `eval()`
5. Hasil = Nilai Akhir Sidang

### Contoh Implementasi
```typescript
// Ambil rumus dari database
const rumus = await getPengaturanByKey('rumus_penilaian');
// Default: '(p1 + p2 + p3) / 3'

// Nilai dari 3 penguji
const nilaiP1 = 85;
const nilaiP2 = 80;
const nilaiP3 = 90;

// Replace variabel
const formula = rumus
  .replace(/p1/g, nilaiP1.toString())
  .replace(/p2/g, nilaiP2.toString())
  .replace(/p3/g, nilaiP3.toString());

// Evaluasi
const nilaiAkhir = eval(formula);
// Hasil: (85 + 80 + 90) / 3 = 85
```

## ⚠️ Catatan Penting

1. **Hanya Dosen Jurusan** yang dapat mengubah rumus
2. **Rumus berlaku global** untuk semua sidang
3. **Perubahan rumus** tidak mempengaruhi nilai sidang yang sudah selesai
4. **Validasi ketat** untuk mencegah rumus yang error
5. **Default rumus**: `(p1 + p2 + p3) / 3` (rata-rata sederhana)

## 🚀 Fitur Mendatang

- [ ] History perubahan rumus
- [ ] Multiple rumus untuk periode berbeda
- [ ] Rumus berbeda untuk D3 dan D4
- [ ] Preview dengan data sidang real
- [ ] Export/Import rumus

## 📝 Changelog

### v1.0.0 (2024)
- ✅ Formula builder dengan quick insert
- ✅ Validasi real-time
- ✅ Contoh rumus siap pakai
- ✅ Backend API integration
- ✅ Database storage

---

**Dibuat oleh**: Tim Pengembang SITA-BI  
**Terakhir diupdate**: 2024
