import prisma from '../../config/database';
import type { PengaturanJadwal } from './types';

export class PengaturanService {
  async getPengaturan(): Promise<PengaturanJadwal> {
    const settings = await prisma.pengaturanSistem.findMany();

    const config: Record<string, unknown> = {};
    settings.forEach((s) => {
      try {
        config[s.key] = JSON.parse(s.value);
      } catch {
        config[s.key] = s.value;
      }
    });

    let ruanganSidang =
      (config.ruangan_sidang as string[] | string | undefined) ?? [];
    console.warn('[BACKEND] 🏢 Ruangan sidang raw:', ruanganSidang);

    if (typeof ruanganSidang === 'string') {
      ruanganSidang = ruanganSidang
        .split(',')
        .map((r: string) => r.trim())
        .filter(Boolean);
    }

    return {
      max_mahasiswa_uji_per_dosen:
        (config.max_mahasiswa_uji_per_dosen as number | undefined) ?? 4,
      durasi_sidang_menit:
        (config.durasi_sidang_menit as number | undefined) ?? 90,
      jeda_sidang_menit: (config.jeda_sidang_menit as number | undefined) ?? 15,
      jam_mulai_sidang:
        (config.jam_mulai_sidang as string | undefined) ?? '08:00',
      jam_selesai_sidang:
        (config.jam_selesai_sidang as string | undefined) ?? '15:00',
      hari_libur_tetap: (config.hari_libur_tetap as string[] | undefined) ?? [
        'sabtu',
        'minggu',
      ],
      tanggal_libur_khusus:
        (config.tanggal_libur_khusus as
          | { tanggal: string; keterangan: string }[]
          | undefined) ?? [],
      ruangan_sidang: ruanganSidang,
      waktu_istirahat:
        (config.waktu_istirahat as
          | { waktu: string; durasi_menit: number }[]
          | undefined) ?? [],
      jadwal_hari_khusus:
        (config.jadwal_hari_khusus as
          | PengaturanJadwal['jadwal_hari_khusus']
          | undefined) ?? [],
    };
  }

  async getPengaturanByKey(key: string): Promise<string> {
    const setting = await prisma.pengaturanSistem.findUnique({
      where: { key },
    });
    return setting?.value ?? '';
  }

  async getRuanganIds(namaRuangan: string[]): Promise<number[]> {
    const ruangan = await prisma.ruangan.findMany({
      where: { nama_ruangan: { in: namaRuangan } },
    });
    return ruangan.map((r) => r.id);
  }
}
