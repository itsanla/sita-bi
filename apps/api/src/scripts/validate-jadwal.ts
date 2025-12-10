import prisma from '../config/database';

interface ConflictReport {
  tanggal: string;
  waktu: string;
  dosen: string;
  ruangan1: string;
  ruangan2: string;
  peran1: string;
  peran2: string;
}

async function validateJadwal() {
  console.log('🔍 Validating jadwal sidang...\n');

  const jadwal = await prisma.jadwalSidang.findMany({
    include: {
      ruangan: true,
      sidang: {
        include: {
          tugasAkhir: {
            include: {
              mahasiswa: { include: { user: true } },
              peranDosenTa: {
                where: {
                  peran: { in: ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'] },
                },
                include: { dosen: { include: { user: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: [{ tanggal: 'asc' }, { waktu_mulai: 'asc' }],
  });

  console.log(`📊 Total jadwal: ${jadwal.length}\n`);

  // Group by date and time
  const timeSlots = new Map<string, typeof jadwal>();
  jadwal.forEach((j) => {
    const key = `${j.tanggal.toISOString().split('T')[0]}_${j.waktu_mulai}_${j.waktu_selesai}`;
    if (!timeSlots.has(key)) {
      timeSlots.set(key, []);
    }
    timeSlots.get(key)!.push(j);
  });

  const conflicts: ConflictReport[] = [];
  let totalSlots = 0;
  let conflictSlots = 0;

  // Check each time slot
  for (const [key, slots] of timeSlots) {
    totalSlots++;
    const [tanggal, waktuMulai, waktuSelesai] = key.split('_');

    if (slots.length < 2) continue;

    // Collect all dosen in this time slot
    const dosenMap = new Map<number, { nama: string; ruangan: string; peran: string }[]>();

    slots.forEach((slot) => {
      slot.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
        const dosenId = peran.dosen_id;
        const dosenNama = peran.dosen.user.name;
        const ruangan = slot.ruangan.nama_ruangan;
        const peranStr = peran.peran;

        if (!dosenMap.has(dosenId)) {
          dosenMap.set(dosenId, []);
        }
        dosenMap.get(dosenId)!.push({ nama: dosenNama, ruangan, peran: peranStr });
      });
    });

    // Check for conflicts
    let hasConflict = false;
    dosenMap.forEach((locations, dosenId) => {
      if (locations.length > 1) {
        hasConflict = true;
        conflicts.push({
          tanggal,
          waktu: `${waktuMulai} - ${waktuSelesai}`,
          dosen: locations[0].nama,
          ruangan1: locations[0].ruangan,
          ruangan2: locations[1].ruangan,
          peran1: locations[0].peran,
          peran2: locations[1].peran,
        });
      }
    });

    if (hasConflict) conflictSlots++;
  }

  // Load balancing analysis
  const dosenLoadMap = new Map<string, number>();
  jadwal.forEach((j) => {
    j.sidang.tugasAkhir.peranDosenTa.forEach((peran) => {
      const nama = peran.dosen.user.name;
      dosenLoadMap.set(nama, (dosenLoadMap.get(nama) || 0) + 1);
    });
  });

  const sortedLoad = Array.from(dosenLoadMap.entries()).sort((a, b) => b[1] - a[1]);
  const avgLoad = Array.from(dosenLoadMap.values()).reduce((a, b) => a + b, 0) / dosenLoadMap.size;
  const maxLoad = sortedLoad[0]?.[1] || 0;
  const minLoad = sortedLoad[sortedLoad.length - 1]?.[1] || 0;

  // Print results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 HASIL VALIDASI JADWAL SIDANG');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (conflicts.length === 0) {
    console.log('✅ TIDAK ADA KONFLIK HARD CONSTRAINT!\n');
  } else {
    console.log(`❌ DITEMUKAN ${conflicts.length} KONFLIK HARD CONSTRAINT:\n`);
    conflicts.forEach((c, i) => {
      console.log(`${i + 1}. ${c.tanggal} ${c.waktu}`);
      console.log(`   Dosen: ${c.dosen}`);
      console.log(`   Konflik: ${c.peran1} (${c.ruangan1}) + ${c.peran2} (${c.ruangan2})`);
      console.log('');
    });
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log('📊 ANALISIS DISTRIBUSI BEBAN KERJA\n');
  console.log(`Rata-rata: ${avgLoad.toFixed(1)} kali per dosen`);
  console.log(`Beban maksimal: ${maxLoad} kali`);
  console.log(`Beban minimal: ${minLoad} kali`);
  console.log(`Variance: ${(maxLoad - minLoad).toFixed(0)}\n`);

  console.log('Top 10 Dosen dengan Beban Tertinggi:');
  sortedLoad.slice(0, 10).forEach(([nama, count], i) => {
    const indicator = count > avgLoad * 1.2 ? '⚠️' : '✅';
    console.log(`${i + 1}. ${indicator} ${nama}: ${count} kali`);
  });

  console.log('\nDosen dengan Beban Terendah:');
  sortedLoad.slice(-5).forEach(([nama, count]) => {
    console.log(`   ${nama}: ${count} kali`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 STATISTIK PENJADWALAN\n');
  console.log(`Total slot waktu: ${totalSlots}`);
  console.log(`Slot dengan konflik: ${conflictSlots}`);
  console.log(`Tingkat keberhasilan: ${((1 - conflictSlots / totalSlots) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (conflicts.length > 0) {
    console.log('💡 REKOMENDASI:');
    console.log('   1. Jalankan ulang generate jadwal dengan algoritma yang sudah diperbaiki');
    console.log('   2. Pastikan max_mahasiswa_uji_per_dosen cukup besar');
    console.log('   3. Tambah ruangan atau perlebar jam operasional jika masih ada konflik\n');
  }

  await prisma.$disconnect();
}

validateJadwal().catch(console.error);
