const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const penjadwalan = await prisma.penjadwalanSidang.findMany({
    orderBy: { created_at: 'desc' }
  });
  
  console.log('Penjadwalan records:', penjadwalan.length);
  penjadwalan.forEach(p => {
    console.log('-', p.id, '| Status:', p.status, '| Tanggal:', p.tanggal_generate);
  });
  
  await prisma.$disconnect();
}

check();
