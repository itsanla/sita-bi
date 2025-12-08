import prisma from '../config/database';

async function initSyaratSidang() {
  const defaultSyarat = [
    { key: 'NASKAH_TA', label: 'Naskah TA' },
    { key: 'TOEIC', label: 'Sertifikat TOEIC' },
    { key: 'RAPOR', label: 'Transkrip Nilai' },
    { key: 'IJAZAH_SLTA', label: 'Ijazah SLTA' },
    { key: 'BEBAS_JURUSAN', label: 'Surat Bebas Jurusan' },
  ];

  await prisma.pengaturanSistem.upsert({
    where: { key: 'syarat_pendaftaran_sidang' },
    update: {
      value: JSON.stringify(defaultSyarat),
      updated_at: new Date(),
    },
    create: {
      key: 'syarat_pendaftaran_sidang',
      value: JSON.stringify(defaultSyarat),
      deskripsi: 'Daftar dokumen yang harus diupload untuk pendaftaran sidang',
    },
  });

  console.log('✅ Syarat pendaftaran sidang berhasil diinisialisasi');
}

initSyaratSidang()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
