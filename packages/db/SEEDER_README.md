# 🌱 SITA-BI Database Seeder

## Overview
Seeder ini menyediakan data testing yang komprehensif untuk sistem SITA-BI, mencakup semua role dan skenario yang diperlukan untuk development dan debugging.

## 📦 Data yang Di-generate

### 1. **Roles** (6 roles)
- `admin` - Administrator sistem
- `kajur` - Ketua Jurusan
- `kaprodi_d3` - Ketua Program Studi D3
- `kaprodi_d4` - Ketua Program Studi D4
- `dosen` - Dosen
- `mahasiswa` - Mahasiswa

### 2. **Users**

#### Admin (1)
- **Email**: `admin@pnp.ac.id`
- **Password**: `password123`
- **Role**: Admin

#### Kajur (1)
- **Email**: `kajur@pnp.ac.id`
- **Password**: `password123`
- **Role**: Kajur + Dosen
- **NIP**: 0001018801
- **Prodi**: D4

#### Kaprodi D3 (1)
- **Email**: `kaprodi.d3@pnp.ac.id`
- **Password**: `password123`
- **Role**: Kaprodi D3 + Dosen
- **NIP**: 0002028802
- **Prodi**: D3

#### Kaprodi D4 (1)
- **Email**: `kaprodi.d4@pnp.ac.id`
- **Password**: `password123`
- **Role**: Kaprodi D4 + Dosen
- **NIP**: 0003038803
- **Prodi**: D4

#### Dosen (25)
- **Email Pattern**: `{nama}@pnp.ac.id`
- **Password**: `password123`
- **Kuota Bimbingan**: 4 mahasiswa per dosen
- **Distribusi**: Data real dari mitra dengan NIP resmi

**Daftar Dosen (25 orang):**
1. rina.anggraini@pnp.ac.id - Dra. Rina Anggraini, M.Pd (D4)
2. martini@pnp.ac.id - Dra. Martini, M.Pd. (D3)
3. kotrini@pnp.ac.id - Dra. Kotrini, M.Pd (D4)
4. dony.marzuki@pnp.ac.id - Dony Marzuki, S.S., M.Ed., Ph.D (D3)
5. sariani@pnp.ac.id - Sariani, SS., MA Appl Ling (D4)
6. difiani.apriyanti@pnp.ac.id - Dr. Difiani Apriyanti, SS., M.Pd (D3)
7. hasbi@pnp.ac.id - Hasbi, SS.,M.Ed.M (D4)
8. sumira@pnp.ac.id - Sumira, S.Pd., M.Pd (D3)
9. desi.yulastri@pnp.ac.id - Desi Yulastri, M.EIL (D4)
10. witri.handayani@pnp.ac.id - Witri Handayani, SS., M.Pd (D3)
11. silvia.djonnaidi@pnp.ac.id - Silvia Djonnaidi, SS., M.Hum (D4)
12. nini.wahyuni@pnp.ac.id - Nini Wahyuni, S.Pd., M.Pd (D3)
13. yohannes.telaumbanua@pnp.ac.id - Dr. Yohannes Telaumbanua, S.Hum.,M.Pd (D4)
14. titin.ritmi@pnp.ac.id - Titin Ritmi,, SS, M.Hum (D3)
15. hendro.saptopramono@pnp.ac.id - Hendro Saptopramono, SS, M.Ed (D4)
16. sabriandi.erdian@pnp.ac.id - Dr. Sabriandi Erdian, S.S., M.Hum (D3)
17. mutia.elkhairat@pnp.ac.id - Mutia El Khairat, SS., M.Hum (D4)
18. astuti.pratiwi@pnp.ac.id - Astuti Pratiwi Rahmadhani, S.Pd., M.Pd.. (D3)
19. fithratul.miladiyenti@pnp.ac.id - Fithratul Miladiyenti, S.S., M.Hum. (D4)
20. gilang.surendra@pnp.ac.id - Gilang Surendra, S.IP., M.I.Kom. (D3)
21. yaningsih@pnp.ac.id - Yaningsih, S.S., M.Hum. (D4)
22. novi.fitria@pnp.ac.id - Novi Fitria, S.S., M.Pd. (D3)
23. melyanda.agustin@pnp.ac.id - Melyanda Agustin Chairina, S.S., M.Hum. (D4)
24. tia.kharina@pnp.ac.id - Tia Kharina Elvonny, S.Pd., M.Hum. (D3)
25. gema.febriansyah@pnp.ac.id - Gema Febriansyah, M.Hum (D4)

#### Mahasiswa (20)
- **Email Pattern**: `{nim}@student.pnp.ac.id`
- **Password**: `password123`
- **Distribusi**: 10 mahasiswa D3, 10 mahasiswa D4

**D4 Students (NIM: 2101010001 - 2101010010)**
- Kelas: 4A dan 4B

**D3 Students (NIM: 2201010001 - 2201010010)**
- Kelas: 3A dan 3B

### 3. **Tugas Akhir** (15)

#### Status DISETUJUI (5 TA)
- **Tujuan**: Testing fitur penugasan pembimbing
- **Mahasiswa**: 2101010001 - 2101010005
- **Status**: Sudah disetujui, belum ada pembimbing
- **Use Case**: Admin/Kajur dapat assign pembimbing

#### Status BIMBINGAN (5 TA)
- **Tujuan**: Testing fitur bimbingan aktif
- **Mahasiswa**: 2101010006 - 2101010010
- **Status**: Sudah ada 2 pembimbing
- **Use Case**: Dosen dapat melakukan bimbingan

#### Status DRAFT (5 TA)
- **Tujuan**: Testing approval workflow
- **Mahasiswa**: 2201010001 - 2201010005
- **Status**: Baru diajukan, menunggu approval
- **Use Case**: Kaprodi dapat approve/reject

### 4. **Tawaran Topik** (10)
- Ditawarkan oleh berbagai dosen
- Kuota: 1-2 mahasiswa per topik
- Topik beragam: Web, Mobile, ML, IoT, E-Learning, dll
- **Use Case**: Mahasiswa dapat memilih topik yang ditawarkan

### 5. **Pengumuman** (8)
- **Audiens**: Mahasiswa (5), Dosen (1), All Users (2)
- **Prioritas**: Tinggi (4), Menengah (4)
- **Kategori**: Akademik, Administrasi, Kemahasiswaan, Lainnya
- **Status**: Semua published
- **Use Case**: Testing notifikasi dan pengumuman sistem

### 6. **Ruangan** (2)
- Ruangan A (kapasitas 30)
- Ruangan B (kapasitas 30)
- **Use Case**: Penjadwalan sidang

### 7. **Sidang & Jadwal** (3)
- **Mahasiswa**: 2101010006, 2101010007, 2101010008
- **Jenis**: Sidang Akhir
- **Status**: Dijadwalkan
- **Waktu**: 09:00 - 11:00
- **Use Case**: Testing jadwal sidang dan ruangan

## 🚀 Cara Menjalankan

### 1. Reset Database & Run Seeder
```bash
cd packages/db
pnpm db:push
pnpm db:seed
```

### 2. Atau dari root project
```bash
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:seed
```

## 🧪 Skenario Testing

### 1. **Testing Penugasan Pembimbing**
- Login sebagai: `admin@pnp.ac.id` atau `kajur@pnp.ac.id`
- Navigate ke: `/dashboard/admin/penugasan`
- Akan melihat 5 TA dengan status DISETUJUI
- Assign pembimbing (maksimal 4 mahasiswa per dosen)

### 2. **Testing Kuota Dosen**
- Assign 4 mahasiswa ke 1 dosen
- Coba assign mahasiswa ke-5 ke dosen yang sama
- Sistem harus menolak karena kuota penuh

### 3. **Testing Role-Based Access**
- Login sebagai Kaprodi D3: hanya bisa akses mahasiswa D3
- Login sebagai Kaprodi D4: hanya bisa akses mahasiswa D4
- Login sebagai Kajur: bisa akses semua

### 4. **Testing Bimbingan**
- Login sebagai dosen yang sudah punya mahasiswa bimbingan
- Navigate ke: `/dashboard/dosen/bimbingan`
- Akan melihat mahasiswa yang dibimbing

### 5. **Testing Mahasiswa Dashboard**
- Login sebagai mahasiswa dengan TA status BIMBINGAN
- Navigate ke: `/dashboard/mahasiswa/tugas-akhir`
- Akan melihat detail TA dan pembimbing

## 📊 Data Statistics

```
Total Users: 49
├── Admin: 1
├── Kajur: 1 (+ role dosen)
├── Kaprodi: 2 (+ role dosen)
├── Dosen: 25
└── Mahasiswa: 20

Total Tugas Akhir: 15
├── DISETUJUI (ready for assignment): 5
├── BIMBINGAN (active): 5
└── DRAFT (pending approval): 5

Tawaran Topik: 10
├── Berbagai bidang (Web, Mobile, ML, IoT)
└── Kuota 1-2 mahasiswa per topik

Pengumuman: 8
├── Mahasiswa: 5
├── Dosen: 1
└── All Users: 2

Ruangan: 2 (A & B)
└── Kapasitas 30 orang

Sidang Terjadwal: 3
└── Dengan jadwal dan ruangan

Pembimbing Assignments: 10
├── 5 TA × 2 pembimbing = 10 assignments
└── Distributed across 25 dosen
```

## 🔐 Default Credentials

**Password untuk semua user**: `password123`

### Quick Access
```
Admin:       admin@pnp.ac.id
Kajur:       kajur@pnp.ac.id
Kaprodi D3:  kaprodi.d3@pnp.ac.id
Kaprodi D4:  kaprodi.d4@pnp.ac.id
Dosen:       rina.anggraini@pnp.ac.id
Mahasiswa:   2101010001@student.pnp.ac.id
```

## ⚠️ Important Notes

1. **Data akan dihapus**: Seeder akan menghapus semua data existing sebelum insert data baru
2. **Development Only**: Jangan jalankan di production!
3. **Kuota Dosen**: Setiap dosen memiliki kuota 4 mahasiswa
4. **Phone Numbers**: Auto-generated, mungkin tidak valid untuk testing SMS/WhatsApp

## 🐛 Debugging Tips

### Cek Data di Database
```bash
cd packages/db
npx prisma studio
```

### Cek Jumlah Data
```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Dosen', COUNT(*) FROM dosen
UNION ALL
SELECT 'Mahasiswa', COUNT(*) FROM mahasiswa
UNION ALL
SELECT 'TugasAkhir', COUNT(*) FROM tugas_akhir
UNION ALL
SELECT 'PeranDosenTa', COUNT(*) FROM peran_dosen_ta;
```

### Reset Jika Ada Error
```bash
rm packages/db/prisma/dev.db
pnpm --filter @repo/db db:push
pnpm --filter @repo/db db:seed
```

## 📝 Customization

Untuk menambah/mengubah data seeder, edit file:
```
packages/db/prisma/seed.ts
```

Kemudian jalankan ulang seeder.
