# Transparansi Penilaian Sidang

## 🎯 Keputusan Desain

**Keputusan:** ✅ **TAMPILKAN** rumus penilaian dan nilai minimal kepada dosen penilai

## 📊 Analisis Keputusan

### Mengapa Ditampilkan?

#### 1. **Transparansi Akademik** 🔍
Dalam sistem akademik yang baik, semua stakeholder harus memahami aturan main. Dosen sebagai penilai berhak tahu:
- Bagaimana nilai dihitung
- Berapa standar kelulusan
- Apa konsekuensi dari penilaian mereka

#### 2. **Akuntabilitas Bersama** 🤝
Dosen bukan hanya "input data", tapi bagian dari proses akademik. Mereka harus:
- Memahami tanggung jawab mereka
- Menyadari dampak penilaian mereka
- Bertanggung jawab atas keputusan mereka

#### 3. **Mengurangi Konflik** ⚖️
Jika dosen tidak tahu standar dan mahasiswa gagal:
- Dosen merasa "disalahkan" sistem
- Mahasiswa komplain ke dosen
- Jurusan harus mediasi konflik

#### 4. **Best Practice Universitas** 🎓
Kebanyakan universitas menampilkan:
- Rubrik penilaian
- Standar kelulusan
- Bobot penilaian

### Mitigasi Risiko

#### Risiko: Dosen Manipulasi Nilai

**Solusi:**
1. ✅ **Disclaimer Kuat** - "Berikan nilai sesuai kemampuan mahasiswa secara objektif"
2. ✅ **Audit Trail** - Semua nilai tercatat dengan timestamp
3. ✅ **Tidak Ada Kalkulator** - Tidak ada tool untuk "hitung mundur" nilai
4. ✅ **Review Berkala** - Jurusan bisa review pola penilaian dosen

#### Risiko: Dosen Kasihan

**Solusi:**
1. ✅ **Edukasi** - Training untuk dosen tentang standar penilaian
2. ✅ **Peer Review** - 3 penguji saling mengawasi
3. ✅ **Monitoring** - Jurusan monitor distribusi nilai

## 🎨 Implementasi UI

### Informasi yang Ditampilkan

```
┌─────────────────────────────────────────────┐
│ 📊 Informasi Penilaian                      │
├─────────────────────────────────────────────┤
│ Rumus Penilaian:    (p1 + p2 + p3) / 4     │
│ Nilai Minimal Lolos: 50                     │
│                                             │
│ ⚠️ Berikan nilai sesuai kemampuan          │
│    mahasiswa secara objektif                │
└─────────────────────────────────────────────┘
```

### Yang TIDAK Ditampilkan

❌ **Kalkulator Real-time**
```
// JANGAN BUAT INI:
Nilai Akhir Saat Ini: 45.5 ❌ (Kurang 4.5 untuk lulus)
```

❌ **Saran Nilai**
```
// JANGAN BUAT INI:
"Berikan minimal nilai 52 untuk P1 agar mahasiswa lulus"
```

❌ **Preview Hasil**
```
// JANGAN BUAT INI:
Preview: Mahasiswa akan TIDAK LULUS ❌
```

## 📋 Implementasi

### Backend Response

```json
{
  "status": "sukses",
  "data": [...],
  "pengaturan_penilaian": {
    "rumus": "(p1 + p2 + p3) / 4",
    "nilai_minimal_lolos": 50,
    "keterangan": "Berikan nilai sesuai kemampuan mahasiswa secara objektif"
  }
}
```

### Frontend Display

**Lokasi:** Di bagian atas halaman, sebelum daftar sidang

**Style:**
- 🔵 Background biru (informasi)
- 📊 Icon chart untuk visual
- ⚠️ Disclaimer dengan italic
- 💡 Tidak mencolok, tapi jelas

## 🔐 Kontrol Tambahan

### 1. Audit Log
```sql
-- Track semua penilaian
SELECT 
  u.name as sekretaris,
  m.name as mahasiswa,
  ns.skor,
  ns.created_at
FROM nilai_sidang ns
JOIN dosen d ON ns.dosen_id = d.id
JOIN users u ON d.user_id = u.id
ORDER BY ns.created_at DESC;
```

### 2. Monitoring Pola Penilaian

```sql
-- Cek apakah ada dosen yang selalu beri nilai tinggi
SELECT 
  u.name as dosen,
  COUNT(*) as total_penilaian,
  AVG(ns.skor) as rata_rata_nilai,
  MIN(ns.skor) as nilai_terendah,
  MAX(ns.skor) as nilai_tertinggi
FROM nilai_sidang ns
JOIN dosen d ON ns.dosen_id = d.id
JOIN users u ON d.user_id = u.id
GROUP BY d.id, u.name
HAVING AVG(ns.skor) > 90 OR MIN(ns.skor) > 80
ORDER BY rata_rata_nilai DESC;
```

### 3. Alert untuk Jurusan

Jika ada pola mencurigakan:
- Semua nilai > 90
- Tidak ada mahasiswa yang gagal
- Nilai terlalu seragam

## 📚 Referensi Akademik

### Universitas yang Transparan:
- ✅ UI (Universitas Indonesia)
- ✅ ITB (Institut Teknologi Bandung)
- ✅ UGM (Universitas Gadjah Mada)

Semua menampilkan rubrik dan standar penilaian kepada dosen penguji.

## 🎓 Kesimpulan

**Keputusan Final:** ✅ **TAMPILKAN dengan Disclaimer**

**Alasan:**
1. Transparansi > Kerahasiaan dalam konteks akademik
2. Dosen adalah partner, bukan hanya operator
3. Mengurangi konflik dan komplain
4. Sesuai best practice universitas
5. Risiko bisa dimitigasi dengan audit dan monitoring

**Implementasi:**
- ✅ Tampilkan rumus dan nilai minimal
- ✅ Tambahkan disclaimer kuat
- ❌ Tidak ada kalkulator atau preview
- ✅ Audit trail lengkap
- ✅ Monitoring pola penilaian

---

**Prinsip:** *"Trust but Verify"* - Percaya kepada dosen, tapi tetap monitor dan audit.
