import { getPrismaClient } from '../config/database';
;
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import * as bcrypt from 'bcrypt';

const prisma = getPrismaClient();

interface CSVRow {
  NO: string;
  NIM: string;
  'NAMA MAHASISWA': string;
  'JUDUL TUGAS AKHIR': string;
}

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function getProdiFromNIM(nim: string): 'D3' | 'D4' {
  // Digit ke-5 dan ke-6 menentukan prodi
  // Contoh: 0901122010 -> 12 = D3, 11 = D4
  const prodiCode = nim.substring(4, 6);
  return prodiCode === '12' ? 'D3' : 'D4';
}

async function seedDataHistoris() {
  console.log('🚀 Mulai seeding data historis...\n');

  const arsipDir = path.join(__dirname, '../../uploads/arsip/judul-ta');
  
  if (!fs.existsSync(arsipDir)) {
    console.log('⏭️  Folder arsip tidak ditemukan, skip seeding historis');
    return;
  }
  
  const files = fs
    .readdirSync(arsipDir)
    .filter((f) => f.endsWith('.csv'))
    .sort();
  
  if (files.length === 0) {
    console.log('⏭️  Tidak ada file CSV di folder arsip');
    return;
  }

  let totalImported = 0;
  const hashedPassword = await bcrypt.hash('TIDAK_ADA_AKSES', 10);

  for (const file of files) {
    const tahun = parseInt(/\d{4}/.exec(file)?.[0] || '0');
    if (!tahun) continue;

    console.log(`📁 Processing: ${file} (Tahun ${tahun})`);

    // 1. Buat/ambil PeriodeTa
    let periode = await prisma.periodeTa.findUnique({ where: { tahun } });
    if (!periode) {
      periode = await prisma.periodeTa.create({
        data: {
          tahun,
          nama: `Periode TA ${tahun}`,
          status: 'SELESAI',
          tanggal_buka: new Date(`${tahun}-01-01`),
          tanggal_tutup: new Date(`${tahun}-12-31`),
        },
      });
      console.log(`   ✅ Periode ${tahun} dibuat`);
    }

    // 2. Parse CSV
    const filePath = path.join(arsipDir, file);
    const rows = await parseCSV(filePath);
    console.log(`   📊 Ditemukan ${rows.length} data`);

    // 3. Import setiap row
    for (const row of rows) {
      const nim = row.NIM.trim();
      const nama = row['NAMA MAHASISWA'].trim();
      const judul = row['JUDUL TUGAS AKHIR'].trim();

      if (!nim || !nama || !judul) continue;

      try {
        // Cek apakah sudah ada
        const existingMhs = await prisma.mahasiswa.findUnique({
          where: { nim },
        });
        if (existingMhs) {
          console.log(`   ⏭️  Skip: ${nim} (sudah ada)`);
          continue;
        }

        // Buat User
        const user = await prisma.user.create({
          data: {
            name: nama,
            email: `${nim}@historis.local`,
            phone_number: `0000${nim}`,
            password: hashedPassword,
            email_verified_at: new Date(),
          },
        });

        // Buat Mahasiswa
        const mahasiswa = await prisma.mahasiswa.create({
          data: {
            user_id: user.id,
            nim,
            prodi: getProdiFromNIM(nim),
            kelas: `HISTORIS_${tahun}`,
            status_kelulusan: 'LULUS',
          },
        });

        // Buat TugasAkhir
        await prisma.tugasAkhir.create({
          data: {
            mahasiswa_id: mahasiswa.id,
            periode_ta_id: periode.id,
            judul,
            status: 'SELESAI',
            judul_divalidasi_p1: true,
            judul_divalidasi_p2: true,
          },
        });

        totalImported++;
        console.log(`   ✅ ${nim} - ${nama}`);
      } catch (error: any) {
        console.error(`   ❌ Error ${nim}: ${error.message}`);
      }
    }

    console.log(`   ✨ Selesai: ${rows.length} data dari ${file}\n`);
  }

  console.log(
    `\n🎉 Seeding selesai! Total ${totalImported} data berhasil diimport.`,
  );
}

void seedDataHistoris()
  .then(() => {
    console.log('✅ Seeding completed');
    return;
  })
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
