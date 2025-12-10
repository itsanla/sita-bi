import { PrismaClient, Prodi, StatusTugasAkhir, PeranDosen, AudiensPengumuman, PrioritasPengumuman, KategoriPengumuman, JenisSidang, HasilSidang } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.jadwalSidang.deleteMany();
  await prisma.nilaiSidang.deleteMany();
  await prisma.sidang.deleteMany();
  await prisma.pendaftaranSidangFile.deleteMany();
  await prisma.pendaftaranSidang.deleteMany();
  await prisma.pengumumanLampiran.deleteMany();
  await prisma.pengumumanPembaca.deleteMany();
  await prisma.pengumuman.deleteMany();
  await prisma.historyTopikMahasiswa.deleteMany();
  await prisma.historyPenugasanDosen.deleteMany();
  await prisma.peranDosenTa.deleteMany();
  await prisma.dokumenTa.deleteMany();
  await prisma.catatanBimbingan.deleteMany();
  await prisma.bimbinganLampiran.deleteMany();
  await prisma.historyPerubahanJadwal.deleteMany();
  await prisma.bimbinganTA.deleteMany();
  await prisma.tugasAkhir.deleteMany();
  await prisma.tawaranTopik.deleteMany();
  await prisma.pengajuanBimbingan.deleteMany();
  await prisma.periodeTa.deleteMany();
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
      roles: { connect: { name: 'jurusan' } },
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
      roles: { connect: { name: 'prodi_d3' } },
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
      roles: { connect: { name: 'prodi_d4' } },
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

  // Create Mahasiswa (80 mahasiswa)
  console.log('👨🎓 Creating mahasiswa...');
  faker.seed(12345);
  const mahasiswaData: any[] = [];
  const usedNims = new Set<string>();
  const usedNames = new Set<string>();
  
  for (let i = 0; i < 80; i++) {
    const prodi = i < 40 ? Prodi.D4 : Prodi.D3;
    const kelas = i % 2 === 0 ? (prodi === Prodi.D4 ? '4A' : '3A') : (prodi === Prodi.D4 ? '4B' : '3B');
    
    let nim: string;
    do {
      const tahun = prodi === Prodi.D4 ? '2101' : '2201';
      const randomDigits = faker.string.numeric(6);
      nim = `${tahun}${randomDigits}`;
    } while (usedNims.has(nim));
    usedNims.add(nim);
    
    let name: string;
    do {
      name = faker.person.fullName();
    } while (usedNames.has(name));
    usedNames.add(name);
    
    mahasiswaData.push({ name, nim, prodi, kelas });
  }

  const mahasiswaUsers: any[] = [];
  for (let idx = 0; idx < mahasiswaData.length; idx++) {
    const data = mahasiswaData[idx]!;
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: `${data.nim}@student.pnp.ac.id`,
        phone_number: `08567${String(idx).padStart(6, '0')}`,
        password: hashedPassword,
        email_verified_at: emailVerifiedAt,
        roles: { connect: { name: 'mahasiswa' } },
        mahasiswa: {
          create: {
            nim: data.nim,
            prodi: data.prodi,
            kelas: data.kelas,
            siap_sidang: true,
          },
        },
      },
      include: { mahasiswa: true },
    });
    mahasiswaUsers.push(user);
  }

  // Create Periode TA
  console.log('📅 Creating periode TA...');
  const periodeAktif = await prisma.periodeTa.create({
    data: {
      tahun: 2024,
      nama: 'Periode TA 2024',
      status: 'AKTIF',
      tanggal_buka: new Date('2024-01-01T08:00:00+07:00'),
      dibuka_oleh: admin.id,
    },
  });

  const periodeTidakAktif = await prisma.periodeTa.create({
    data: {
      tahun: 2023,
      nama: 'Periode TA 2023',
      status: 'SELESAI',
      tanggal_buka: new Date('2023-01-01T08:00:00+07:00'),
      tanggal_tutup: new Date('2023-12-31T17:00:00+07:00'),
      dibuka_oleh: admin.id,
      ditutup_oleh: admin.id,
    },
  });

  const periodePersiapan = await prisma.periodeTa.create({
    data: {
      tahun: 2025,
      nama: 'Periode TA 2025',
      status: 'PERSIAPAN',
      tanggal_buka: new Date('2025-02-01T08:00:00+07:00'),
      dibuka_oleh: admin.id,
    },
  });

  // Create Tugas Akhir untuk 80 mahasiswa
  console.log('📝 Creating tugas akhir...');
  
  const judulTopik = [
    'Sistem Informasi', 'Aplikasi Mobile', 'Platform Web', 'Dashboard Analitik', 'Sistem Monitoring',
    'Aplikasi Desktop', 'Website E-Commerce', 'Portal Informasi', 'Sistem Prediksi', 'Aplikasi IoT'
  ];
  
  const bidang = [
    'Manajemen Data', 'Kesehatan', 'Pendidikan', 'Bisnis', 'Pemerintahan',
    'Industri', 'Pariwisata', 'Pertanian', 'Transportasi', 'Keuangan'
  ];

  for (let i = 0; i < 80; i++) {
    const ta = await prisma.tugasAkhir.create({
      data: {
        mahasiswa_id: mahasiswaUsers[i].mahasiswa.id,
        judul: `${judulTopik[i % 10]} ${bidang[(i + 3) % 10]} Berbasis ${i % 2 === 0 ? 'Web' : 'Mobile'}`,
        status: StatusTugasAkhir.BIMBINGAN,
        tanggal_pengajuan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        disetujui_oleh: admin.id,
        periode_ta_id: periodeAktif.id,
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

    // Update mahasiswa siap_sidang status
    // 60 mahasiswa pertama: siap_sidang = true
    // 20 mahasiswa terakhir: siap_sidang = false (akan punya status berbeda)
    if (i >= 60) {
      await prisma.mahasiswa.update({
        where: { id: mahasiswaUsers[i].mahasiswa.id },
        data: { siap_sidang: false },
      });
    }

    // Create pendaftaran sidang untuk mahasiswa dengan status berbeda
    if (i >= 60 && i < 70) {
      // 10 mahasiswa: Menunggu Validasi
      await prisma.pendaftaranSidang.create({
        data: {
          tugas_akhir_id: ta.id,
          periode_ta_id: periodeAktif.id,
          is_submitted: true,
          status_validasi: 'pending',
          divalidasi_pembimbing_1: i % 2 === 0,
          divalidasi_pembimbing_2: false,
          divalidasi_prodi: false,
          divalidasi_jurusan: false,
        },
      });
    } else if (i >= 70 && i < 75) {
      // 5 mahasiswa: Ditolak
      await prisma.pendaftaranSidang.create({
        data: {
          tugas_akhir_id: ta.id,
          periode_ta_id: periodeAktif.id,
          is_submitted: true,
          status_validasi: 'rejected',
          rejected_by: admin.id,
          rejection_reason: 'Dokumen tidak lengkap. Harap melengkapi berkas TOEIC dan Bebas Jurusan.',
        },
      });
    }
    // 5 mahasiswa terakhir (75-79): Belum Daftar (tidak ada pendaftaran)
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

  // Ruangan akan diatur oleh dosen jurusan di menu Aturan Umum
  console.log('🏢 Skipping ruangan (will be set by jurusan)...');

  // Jadwal sidang akan di-generate oleh sistem penjadwalan
  console.log('📅 Skipping jadwal sidang (will be generated by system)...');

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Roles: ${roles.length}`);
  console.log('- Admin: 1');
  console.log('- Jurusan Level: 1');
  console.log('- Prodi Level: 2 (D3 & D4)');
  console.log(`- Dosen: ${dosenUsers.length}`);
  console.log(`- Mahasiswa: ${mahasiswaUsers.length}`);
  console.log('  • 60 Siap Sidang');
  console.log('  • 10 Menunggu Validasi');
  console.log('  • 5 Ditolak');
  console.log('  • 5 Belum Daftar');
  console.log('- Periode TA: 3 (1 AKTIF, 1 SELESAI, 1 PERSIAPAN)');
  console.log(`- Tugas Akhir: ${mahasiswaUsers.length} (SEMUA DENGAN PEMBIMBING 1 & 2)`);
  console.log('- Tawaran Topik: 10');
  console.log('- Pengumuman: 8');
  console.log('- Ruangan: 0 (akan diatur oleh jurusan)');
  console.log('- Sidang Terjadwal: 0 (akan di-generate oleh sistem)')
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
