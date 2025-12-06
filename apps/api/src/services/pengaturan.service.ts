import prisma from '../config/database';
import type { UpdatePengaturanDto } from '../dto/pengaturan.dto';

type PengaturanValue = string[] | number | string;

export class PengaturanService {
  async getPengaturan(): Promise<Record<string, PengaturanValue>> {
    const settings = await prisma.pengaturanSistem.findMany();

    const result: Record<string, PengaturanValue> = {};

    for (const setting of settings) {
      if (setting.key === 'ruangan_sidang') {
        result[setting.key] = setting.value.split(',').map((r) => r.trim());
      } else if (
        setting.key === 'max_similaritas_persen' ||
        setting.key === 'min_bimbingan_valid' ||
        setting.key === 'max_pembimbing_aktif' ||
        setting.key === 'durasi_sidang_menit' ||
        setting.key === 'jeda_sidang_menit'
      ) {
        result[setting.key] = parseInt(setting.value, 10);
      } else {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }

  async updatePengaturan(
    data: UpdatePengaturanDto,
  ): Promise<Record<string, PengaturanValue>> {
    const updates = [];

    if (data.max_similaritas_persen !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'max_similaritas_persen' },
          update: {
            value: data.max_similaritas_persen.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'max_similaritas_persen',
            value: data.max_similaritas_persen.toString(),
            deskripsi:
              'Persentase maksimal similaritas yang diperbolehkan untuk dokumen tugas akhir',
          },
        }),
      );
    }

    if (data.min_bimbingan_valid !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'min_bimbingan_valid' },
          update: {
            value: data.min_bimbingan_valid.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'min_bimbingan_valid',
            value: data.min_bimbingan_valid.toString(),
            deskripsi:
              'Jumlah minimal sesi bimbingan valid yang harus diselesaikan sebelum mahasiswa dapat mendaftar sidang',
          },
        }),
      );
    }

    if (data.ruangan_sidang !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'ruangan_sidang' },
          update: {
            value: data.ruangan_sidang.join(','),
            updated_at: new Date(),
          },
          create: {
            key: 'ruangan_sidang',
            value: data.ruangan_sidang.join(','),
            deskripsi:
              'Daftar ruangan yang tersedia untuk sidang (dipisahkan dengan koma)',
          },
        }),
      );
    }

    if (data.max_pembimbing_aktif !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'max_pembimbing_aktif' },
          update: {
            value: data.max_pembimbing_aktif.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'max_pembimbing_aktif',
            value: data.max_pembimbing_aktif.toString(),
            deskripsi:
              'Jumlah maksimal mahasiswa yang dapat dibimbing oleh satu dosen secara bersamaan',
          },
        }),
      );
    }

    if (data.durasi_sidang_menit !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'durasi_sidang_menit' },
          update: {
            value: data.durasi_sidang_menit.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'durasi_sidang_menit',
            value: data.durasi_sidang_menit.toString(),
            deskripsi: 'Durasi standar sidang tugas akhir dalam menit',
          },
        }),
      );
    }

    if (data.jeda_sidang_menit !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'jeda_sidang_menit' },
          update: {
            value: data.jeda_sidang_menit.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'jeda_sidang_menit',
            value: data.jeda_sidang_menit.toString(),
            deskripsi:
              'Waktu jeda antar sidang dalam menit',
          },
        }),
      );
    }

    await prisma.$transaction(updates);

    return this.getPengaturan();
  }

  async getPengaturanByKey(key: string): Promise<string | null> {
    const setting = await prisma.pengaturanSistem.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }
}
