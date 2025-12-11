const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const total = await prisma.mahasiswa.count();
  const siapSidang = await prisma.mahasiswa.count({ where: { siap_sidang: true } });
  const terjadwal = await prisma.mahasiswa.count({ where: { sidang_terjadwal: true } });
  const gagal = await prisma.mahasiswa.count({ where: { gagal_sidang: true } });
  
  console.log('Total mahasiswa:', total);
  console.log('siap_sidang=true:', siapSidang);
  console.log('sidang_terjadwal=true:', terjadwal);
  console.log('gagal_sidang=true:', gagal);
  
  const siapTapiTidakTerjadwal = await prisma.mahasiswa.findMany({
    where: {
      siap_sidang: true,
      sidang_terjadwal: false,
    },
    include: {
      user: true,
      tugasAkhir: {
        include: {
          sidang: { where: { is_active: true } }
        }
      }
    }
  });
  
  console.log('\nMahasiswa siap_sidang=true tapi tidak terjadwal:', siapTapiTidakTerjadwal.length);
  siapTapiTidakTerjadwal.slice(0, 5).forEach(m => {
    console.log('-', m.user.name, '| TA:', !!m.tugasAkhir, '| Sidang aktif:', m.tugasAkhir?.sidang.length || 0);
  });
  
  await prisma.$disconnect();
}

check();
