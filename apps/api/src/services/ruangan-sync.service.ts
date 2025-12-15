import prisma from '../config/database';

export class RuanganSyncService {
  async syncRuanganFromPengaturan(): Promise<{
    synced: number;
    ruanganList?: string[];
  }> {
    console.warn('[BACKEND SYNC] 🔄 Starting ruangan sync...');

    const pengaturan = await prisma.pengaturanSistem.findFirst({
      where: { key: 'ruangan_sidang' },
    });

    if (!pengaturan) {
      console.warn('[BACKEND SYNC] ⚠️ No ruangan_sidang setting found');
      return { synced: 0 };
    }

    console.warn('[BACKEND SYNC] 📝 Raw value:', pengaturan.value);

    let ruanganList: string[] = [];
    try {
      ruanganList = JSON.parse(pengaturan.value);
      console.warn('[BACKEND SYNC] ✅ Parsed as JSON:', ruanganList);
    } catch {
      if (typeof pengaturan.value === 'string') {
        ruanganList = pengaturan.value
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean);
        console.warn('[BACKEND SYNC] ✅ Parsed as CSV:', ruanganList);
      }
    }

    if (ruanganList.length === 0) {
      console.warn('[BACKEND SYNC] ⚠️ No ruangan to sync');
      return { synced: 0 };
    }

    let synced = 0;
    for (const namaRuangan of ruanganList) {
      console.warn('[BACKEND SYNC] 🏢 Upserting ruangan:', namaRuangan);
      await prisma.ruangan.upsert({
        where: { nama_ruangan: namaRuangan },
        create: {
          nama_ruangan: namaRuangan,
          lokasi: 'Gedung Utama',
          kapasitas: 30,
        },
        update: {},
      });
      synced++;
    }

    console.warn('[BACKEND SYNC] ✅ Sync completed:', synced, 'ruangan');
    return { synced, ruanganList };
  }
}
