import { PrismaClient, Prodi, StatusTugasAkhir, PeranDosen, AudiensPengumuman, PrioritasPengumuman, KategoriPengumuman, JenisSidang, HasilSidang } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.jadwalSidang.deleteMany();
  await prisma.sidang.deleteMany();
  await prisma.pengumumanLampiran.deleteMany();
  await prisma.pengumuman.deleteMany();
  await prisma.historyTopikMahasiswa.deleteMany();
  await prisma.historyPenugasanDosen.deleteMany();
  await prisma.peranDosenTa.deleteMany();
  await prisma.tugasAkhir.deleteMany();
  await prisma.tawaranTopik.deleteMany();
  await prisma.mahasiswa.deleteMany();
  await prisma.dosen.deleteMany();
  await prisma.ruangan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create Roles
  console.log('👥 Creating roles...');
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'admin', guard_name: 'api' } }),
    prisma.role.create({ data: { name: 'jurusan', guard_name: 'api' } }),
    prisma.role.create({ data: { name: 'prodi_d3', guard_name: 'api' } }),
    prisma.role.create({ data: { name: 'prodi_d4', guard_name: 'api' } }),
    prisma.role.create({ data: { name: 'dosen', guard_name: 'api' } }),
    prisma.role.create({ data: { name: 'mahasiswa', guard_name: 'api' } }),
  ]);

  const hashedPassword = await bcrypt.hash('password123', 10);
  const emailVerifiedAt = new Date();

  // Create Admin
  console.log('👨💼 Creating admin...');
  const admin = await prisma.user.create({
    data: {
      name: 'Admin SITA-BI',
      email: 'admin@pnp.ac.id',
      phone_number: '081234567890',
      password: hashedPassword,
      email_verified_at: emailVerifiedAt,
      roles: { connect: { name: 'admin' } },
    },
  });

  // Create Jurusan Level Access
  console.log('👨🏫 Creating jurusan level access...');
  await prisma.user.create({
    data: {
      name: 'Dr. Yohannes Telaumbanua, S.Hum.,M.Pd',
      email: 'jurusan@pnp.ac.id',
      phone_number: '081234567891',
      password: hashedPassword,
      email_verified_at: emailVerifiedAt,
      roles: { connect: [{ name: 'jurusan' }, { name: 'dosen' }] },
      dosen: {
        create: {
          nip: '197808062009121001',
          kuota_bimbingan: 4,
        },
      },
    },
  });

  // Create Prodi D3 Level Access
  console.log('👨🏫 Creating prodi D3 level access...');
  await prisma.user.create({
    data: {
      name: 'Dr. Siti Aminah, M.T',
      email: 'prodi.d3@pnp.ac.id',
      phone_number: '081234567892',
      password: hashedPassword,
      email_verified_at: emailVerifiedAt,
      roles: { connect: [{ name: 'prodi_d3' }, { name: 'dosen' }] },
      dosen: {
        create: {
          nip: '0002028802',
          kuota_bimbingan: 4,
        },
      },
    },
  });

  // Create Prodi D4 Level Access
  console.log('👨🏫 Creating prodi D4 level access...');
  await prisma.user.create({
    data: {
      name: 'Dr. Ahmad Fauzi, M.Kom',
      email: 'prodi.d4@pnp.ac.id',
      phone_number: '081234567893',
      password: hashedPassword,
      email_verified_at: emailVerifiedAt,
      roles: { connect: [{ name: 'prodi_d4' }, { name: 'dosen' }] },
      dosen: {
        create: {
          nip: '0003038803',
          kuota_bimbingan: 4,
        },
      },
    },
  });

  // Create Dosen (25 dosen)
  console.log('👨🏫 Creating dosen...');
  const dosenData = [
    { name: 'Dra. Rina Anggraini, M.Pd', email: 'rina.anggraini@pnp.ac.id', nip: '196903071993032001', prodi: Prodi.D4 },
    { name: 'Dra. Martini, M.Pd.', email: 'martini@pnp.ac.id', nip: '196403061991032001', prodi: Prodi.D3 },
    { name: 'Dra. Kotrini, M.Pd', email: 'kotrini@pnp.ac.id', nip: '196509031990032001', prodi: Prodi.D4 },
    { name: 'Dony Marzuki, S.S., M.Ed., Ph.D', email: 'dony.marzuki@pnp.ac.id', nip: '197503282005011001', prodi: Prodi.D3 },
    { name: 'Sariani, SS., MA Appl Ling', email: 'sariani@pnp.ac.id', nip: '197604232006042001', prodi: Prodi.D4 },
    { name: 'Dr. Difiani Apriyanti, SS., M.Pd', email: 'difiani.apriyanti@pnp.ac.id', nip: '198104032006042003', prodi: Prodi.D3 },
    { name: 'Hasbi, SS.,M.Ed.M', email: 'hasbi@pnp.ac.id', nip: '197404121999031003', prodi: Prodi.D4 },
    { name: 'Sumira, S.Pd., M.Pd', email: 'sumira@pnp.ac.id', nip: '197804012009122003', prodi: Prodi.D3 },
    { name: 'Desi Yulastri, M.EIL', email: 'desi.yulastri@pnp.ac.id', nip: '198012112010122002', prodi: Prodi.D4 },
    { name: 'Witri Handayani, SS., M.Pd', email: 'witri.handayani@pnp.ac.id', nip: '198112302010122004', prodi: Prodi.D3 },
    { name: 'Silvia Djonnaidi, SS., M.Hum', email: 'silvia.djonnaidi@pnp.ac.id', nip: '198311252015042002', prodi: Prodi.D4 },
    { name: 'Nini Wahyuni, S.Pd., M.Pd', email: 'nini.wahyuni@pnp.ac.id', nip: '198501242014042001', prodi: Prodi.D3 },

    { name: 'Titin Ritmi,, SS, M.Hum', email: 'titin.ritmi@pnp.ac.id', nip: '197108052003122002', prodi: Prodi.D3 },
    { name: 'Hendro Saptopramono, SS, M.Ed', email: 'hendro.saptopramono@pnp.ac.id', nip: '197509022000121001', prodi: Prodi.D4 },
    { name: 'Dr. Sabriandi Erdian, S.S., M.Hum', email: 'sabriandi.erdian@pnp.ac.id', nip: '197905142010121002', prodi: Prodi.D3 },
    { name: 'Mutia El Khairat, SS., M.Hum', email: 'mutia.elkhairat@pnp.ac.id', nip: '198707012014042002', prodi: Prodi.D4 },
    { name: 'Astuti Pratiwi Rahmadhani, S.Pd., M.Pd..', email: 'astuti.pratiwi@pnp.ac.id', nip: '198904092019032012', prodi: Prodi.D3 },
    { name: 'Fithratul Miladiyenti, S.S., M.Hum.', email: 'fithratul.miladiyenti@pnp.ac.id', nip: '198809262019032019', prodi: Prodi.D4 },
    { name: 'Gilang Surendra, S.IP., M.I.Kom.', email: 'gilang.surendra@pnp.ac.id', nip: '199310132022031012', prodi: Prodi.D3 },
    { name: 'Yaningsih, S.S., M.Hum.', email: 'yaningsih@pnp.ac.id', nip: '197301072002122001', prodi: Prodi.D4 },
    { name: 'Novi Fitria, S.S., M.Pd.', email: 'novi.fitria@pnp.ac.id', nip: '198111112008122003', prodi: Prodi.D3 },
    { name: 'Melyanda Agustin Chairina, S.S., M.Hum.', email: 'melyanda.agustin@pnp.ac.id', nip: '198908052024062001', prodi: Prodi.D4 },
    { name: 'Tia Kharina Elvonny, S.Pd., M.Hum.', email: 'tia.kharina@pnp.ac.id', nip: '199103162024062003', prodi: Prodi.D3 },
    { name: 'Gema Febriansyah, M.Hum', email: 'gema.febriansyah@pnp.ac.id', nip: '199302072024061001', prodi: Prodi.D4 },
  ];

  const dosenUsers: any[] = [];
  for (let idx = 0; idx < dosenData.length; idx++) {
    const data = dosenData[idx]!;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone_number: `0812345678${idx + 10}`,
        password: hashedPassword,
        email_verified_at: emailVerifiedAt,
        roles: { connect: { name: 'dosen' } },
        dosen: {
          create: {
            nip: data.nip,
            kuota_bimbingan: 4,
          },
        },
      },
      include: { dosen: true },
    });
    dosenUsers.push(user);
  }

  // Create Mahasiswa (20 mahasiswa)
  console.log('👨🎓 Creating mahasiswa...');
  const mahasiswaData = [
    { name: 'Andi Pratama', nim: '2101010001', prodi: Prodi.D4, kelas: '4A' },
    { name: 'Budi Santoso', nim: '2101010002', prodi: Prodi.D4, kelas: '4A' },
    { name: 'Citra Dewi', nim: '2101010003', prodi: Prodi.D4, kelas: '4B' },
    { name: 'Dian Permata', nim: '2101010004', prodi: Prodi.D4, kelas: '4B' },
    { name: 'Eko Prasetyo', nim: '2101010005', prodi: Prodi.D4, kelas: '4A' },
    { name: 'Fajar Ramadhan', nim: '2101010006', prodi: Prodi.D4, kelas: '4B' },
    { name: 'Gita Savitri', nim: '2101010007', prodi: Prodi.D4, kelas: '4A' },
    { name: 'Hadi Wijaya', nim: '2101010008', prodi: Prodi.D4, kelas: '4B' },
    { name: 'Indah Sari', nim: '2101010009', prodi: Prodi.D4, kelas: '4A' },
    { name: 'Joko Susilo', nim: '2101010010', prodi: Prodi.D4, kelas: '4B' },
    { name: 'Kartika Putri', nim: '2201010001', prodi: Prodi.D3, kelas: '3A' },
    { name: 'Lukman Hakim', nim: '2201010002', prodi: Prodi.D3, kelas: '3A' },
    { name: 'Maya Anggraini', nim: '2201010003', prodi: Prodi.D3, kelas: '3B' },
    { name: 'Nanda Pratama', nim: '2201010004', prodi: Prodi.D3, kelas: '3B' },
    { name: 'Oki Setiawan', nim: '2201010005', prodi: Prodi.D3, kelas: '3A' },
    { name: 'Putri Ayu', nim: '2201010006', prodi: Prodi.D3, kelas: '3B' },
    { name: 'Qori Maulana', nim: '2201010007', prodi: Prodi.D3, kelas: '3A' },
    { name: 'Rina Safitri', nim: '2201010008', prodi: Prodi.D3, kelas: '3B' },
    { name: 'Sandi Kurniawan', nim: '2201010009', prodi: Prodi.D3, kelas: '3A' },
    { name: 'Tari Wulandari', nim: '2201010010', prodi: Prodi.D3, kelas: '3B' },
  ];

  const mahasiswaUsers: any[] = [];
  for (let idx = 0; idx < mahasiswaData.length; idx++) {
    const data = mahasiswaData[idx]!;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: `${data.nim}@student.pnp.ac.id`,
        phone_number: `08567890${String(idx).padStart(4, '0')}`,
        password: hashedPassword,
        email_verified_at: emailVerifiedAt,
        roles: { connect: { name: 'mahasiswa' } },
        mahasiswa: {
          create: {
            nim: data.nim,
            prodi: data.prodi,
            kelas: data.kelas,
          },
        },
      },
      include: { mahasiswa: true },
    });
    mahasiswaUsers.push(user);
  }

  // Create Tugas Akhir
  console.log('📝 Creating tugas akhir...');
  
  // 5 TA DISETUJUI
  for (let i = 0; i < 5; i++) {
    await prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaUsers[i].mahasiswa.id,
        judul: `Sistem Informasi ${['Manajemen', 'Monitoring', 'Analisis', 'Prediksi', 'Optimasi'][i]} Berbasis Web`,
        status: StatusTugasAkhir.DISETUJUI,
        tanggal_pengajuan: new Date(),
        disetujui_oleh: admin.id,
      },
    });
  }

  // 5 TA BIMBINGAN
  for (let i = 5; i < 10; i++) {
    const ta = await prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaUsers[i].mahasiswa.id,
        judul: `Aplikasi ${['Mobile', 'Desktop', 'Cloud', 'IoT', 'AI'][i - 5]} untuk ${['Pendidikan', 'Kesehatan', 'Bisnis', 'Pemerintahan', 'Industri'][i - 5]}`,
        status: StatusTugasAkhir.BIMBINGAN,
        tanggal_pengajuan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        disetujui_oleh: admin.id,
      },
    });

    await prisma.peranDosenTa.createMany({
      data: [
        {
          tugas_akhir_id: ta.id,
          dosen_id: dosenUsers[i % dosenUsers.length].dosen.id,
          peran: PeranDosen.pembimbing1,
        },
        {
          tugas_akhir_id: ta.id,
          dosen_id: dosenUsers[(i + 1) % dosenUsers.length].dosen.id,
          peran: PeranDosen.pembimbing2,
        },
      ],
    });
  }

  // 5 TA DRAFT
  for (let i = 10; i < 15; i++) {
    await prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaUsers[i].mahasiswa.id,
        judul: `Rancang Bangun ${['Website', 'Aplikasi', 'Platform', 'Dashboard', 'Portal'][i - 10]} ${['E-Commerce', 'E-Learning', 'E-Government', 'E-Health', 'E-Tourism'][i - 10]}`,
        status: StatusTugasAkhir.DRAFT,
      },
    });
  }

  // Create Tawaran Topik
  console.log('💡 Creating tawaran topik...');
  const topikData = [
    { judul: 'Sistem Informasi Manajemen Perpustakaan Berbasis Web', deskripsi: 'Pengembangan sistem untuk mengelola perpustakaan digital', kuota: 2 },
    { judul: 'Aplikasi Mobile Monitoring Kesehatan Pasien', deskripsi: 'Aplikasi monitoring kesehatan real-time', kuota: 1 },
    { judul: 'Platform E-Learning Interaktif dengan Gamifikasi', deskripsi: 'Platform pembelajaran dengan elemen game', kuota: 2 },
    { judul: 'Sistem Prediksi Penjualan Menggunakan Machine Learning', deskripsi: 'Implementasi ML untuk prediksi penjualan', kuota: 1 },
    { judul: 'Dashboard Analitik Data Mahasiswa', deskripsi: 'Dashboard visualisasi data akademik', kuota: 2 },
    { judul: 'Aplikasi Manajemen Proyek Berbasis Agile', deskripsi: 'Tools manajemen proyek Agile/Scrum', kuota: 1 },
    { judul: 'Sistem Deteksi Plagiarisme Dokumen', deskripsi: 'Deteksi kemiripan dokumen dengan NLP', kuota: 1 },
    { judul: 'Platform Marketplace UMKM Lokal', deskripsi: 'E-commerce untuk produk UMKM', kuota: 2 },
    { judul: 'Aplikasi Smart Home Automation', deskripsi: 'Kontrol perangkat rumah pintar IoT', kuota: 1 },
    { judul: 'Sistem Rekomendasi Wisata Berbasis AI', deskripsi: 'Rekomendasi wisata dengan AI', kuota: 2 },
  ];

  for (let i = 0; i < topikData.length; i++) {
    await prisma.tawaranTopik.create({
      data: {
        user_id: dosenUsers[i % dosenUsers.length]!.id,
        judul_topik: topikData[i]!.judul,
        deskripsi: topikData[i]!.deskripsi,
        kuota: topikData[i]!.kuota,
      },
    });
  }

  // Create Pengumuman
  console.log('📢 Creating pengumuman...');
  const pengumumanData = [
    { judul: 'Jadwal Sidang TA Periode Januari 2025', isi: 'Sidang TA periode Januari 2025 akan dilaksanakan mulai tanggal 15-20 Januari 2025.', audiens: AudiensPengumuman.mahasiswa, prioritas: PrioritasPengumuman.TINGGI, kategori: KategoriPengumuman.AKADEMIK },
    { judul: 'Pengumuman Libur Semester', isi: 'Libur semester dimulai 25 Desember 2024 hingga 5 Januari 2025.', audiens: AudiensPengumuman.all_users, prioritas: PrioritasPengumuman.MENENGAH, kategori: KategoriPengumuman.AKADEMIK },
    { judul: 'Batas Akhir Pengajuan Judul TA', isi: 'Batas akhir pengajuan judul TA adalah 30 November 2024.', audiens: AudiensPengumuman.mahasiswa, prioritas: PrioritasPengumuman.TINGGI, kategori: KategoriPengumuman.AKADEMIK },
    { judul: 'Workshop Metodologi Penelitian', isi: 'Workshop metodologi penelitian pada 10 Desember 2024 di Aula Utama.', audiens: AudiensPengumuman.mahasiswa, prioritas: PrioritasPengumuman.MENENGAH, kategori: KategoriPengumuman.KEMAHASISWAAN },
    { judul: 'Rapat Koordinasi Dosen Pembimbing', isi: 'Rapat koordinasi dosen pembimbing pada 8 Desember 2024 pukul 13.00 WIB.', audiens: AudiensPengumuman.dosen, prioritas: PrioritasPengumuman.TINGGI, kategori: KategoriPengumuman.AKADEMIK },
    { judul: 'Pembaruan Format Laporan TA', isi: 'Format laporan TA telah diperbarui. Template tersedia di website jurusan.', audiens: AudiensPengumuman.mahasiswa, prioritas: PrioritasPengumuman.MENENGAH, kategori: KategoriPengumuman.AKADEMIK },
    { judul: 'Pendaftaran Beasiswa Prestasi', isi: 'Pendaftaran beasiswa prestasi dibuka 1-15 Desember 2024.', audiens: AudiensPengumuman.mahasiswa, prioritas: PrioritasPengumuman.MENENGAH, kategori: KategoriPengumuman.ADMINISTRASI },
    { judul: 'Maintenance Sistem Informasi', isi: 'Maintenance sistem pada 5 Desember 2024 pukul 00.00-06.00 WIB.', audiens: AudiensPengumuman.all_users, prioritas: PrioritasPengumuman.TINGGI, kategori: KategoriPengumuman.LAINNYA },
  ];

  for (const data of pengumumanData) {
    await prisma.pengumuman.create({
      data: {
        judul: data.judul,
        isi: data.isi,
        dibuat_oleh: admin.id,
        audiens: data.audiens,
        is_published: true,
        prioritas: data.prioritas,
        kategori: data.kategori,
        tanggal_dibuat: new Date(),
      },
    });
  }

  // Create Ruangan
  console.log('🏢 Creating ruangan...');
  const ruanganData = [
    { nama: 'A', lokasi: 'Gedung A Lantai 3', kapasitas: 30 },
    { nama: 'B', lokasi: 'Gedung A Lantai 3', kapasitas: 30 },
  ];

  const ruanganList: any[] = [];
  for (const data of ruanganData) {
    const ruangan = await prisma.ruangan.create({
      data: {
        nama_ruangan: data.nama,
        lokasi: data.lokasi,
        kapasitas: data.kapasitas,
      },
    });
    ruanganList.push(ruangan);
  }

  // Create Sidang & Jadwal
  console.log('📅 Creating sidang & jadwal...');
  for (let i = 5; i < 8; i++) {
    const ta = await prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaUsers[i].mahasiswa.id },
    });

    if (ta) {
      const sidang = await prisma.sidang.create({
        data: {
          tugas_akhir_id: ta.id,
          jenis_sidang: JenisSidang.AKHIR,
          status_hasil: HasilSidang.dijadwalkan,
          is_active: true,
        },
      });

      const tanggalSidang = new Date();
      tanggalSidang.setDate(tanggalSidang.getDate() + (i - 4) * 2);

      await prisma.jadwalSidang.create({
        data: {
          sidang_id: sidang.id,
          tanggal: tanggalSidang,
          waktu_mulai: '09:00',
          waktu_selesai: '11:00',
          ruangan_id: ruanganList[i % ruanganList.length].id,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Roles: ${roles.length}`);
  console.log('- Admin: 1');
  console.log('- Jurusan Level: 1');
  console.log('- Prodi Level: 2 (D3 & D4)');
  console.log(`- Dosen: ${dosenUsers.length}`);
  console.log(`- Mahasiswa: ${mahasiswaUsers.length}`);
  console.log('- Tugas Akhir: 15 (5 DISETUJUI, 5 BIMBINGAN, 5 DRAFT)');
  console.log('- Tawaran Topik: 10');
  console.log('- Pengumuman: 8');
  console.log('- Ruangan: 2 (A & B)');
  console.log('- Sidang Terjadwal: 3');
  console.log('\n🔑 Login Credentials (password: password123):');
  console.log('- Admin: admin@pnp.ac.id');
  console.log('- Jurusan Level: jurusan@pnp.ac.id');
  console.log('- Prodi D3 Level: prodi.d3@pnp.ac.id');
  console.log('- Prodi D4 Level: prodi.d4@pnp.ac.id');
  console.log('- Dosen: rina.anggraini@pnp.ac.id (dan 24 dosen lainnya)');
  console.log('- Mahasiswa: 2101010001@student.pnp.ac.id (dan 19 mahasiswa lainnya)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
