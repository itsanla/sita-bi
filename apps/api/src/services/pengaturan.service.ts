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
      } else if (setting.key === 'syarat_pendaftaran_sidang') {
        result[setting.key] = JSON.parse(setting.value);
      } else if (setting.key === 'hari_libur_tetap') {
        result[setting.key] = setting.value.split(',').map((h) => h.trim());
      } else if (setting.key === 'tanggal_libur_khusus') {
        result[setting.key] = JSON.parse(setting.value);
      } else if (
        setting.key === 'max_similaritas_persen' ||
        setting.key === 'min_bimbingan_valid' ||
        setting.key === 'max_pembimbing_aktif' ||
        setting.key === 'max_mahasiswa_uji_per_dosen' ||
        setting.key === 'durasi_sidang_menit' ||
        setting.key === 'jeda_sidang_menit'
      ) {
        result[setting.key] = parseInt(setting.value, 10);
      } else if (setting.key === 'nilai_minimal_lolos') {
        result[setting.key] = parseFloat(setting.value);
      } else if (
        setting.key === 'validasi_pendaftaran_sidang_aktif' ||
        setting.key === 'validasi_pembimbing_1' ||
        setting.key === 'validasi_pembimbing_2' ||
        setting.key === 'validasi_prodi' ||
        setting.key === 'validasi_jurusan' ||
        setting.key === 'tampilkan_rincian_nilai_ke_sekretaris' ||
        setting.key === 'cek_similaritas_semua_periode' ||
        setting.key === 'nonaktifkan_cek_similaritas'
      ) {
        result[setting.key] = setting.value === 'true';
      } else if (setting.key === 'waktu_istirahat') {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch {
          result[setting.key] = [];
        }
      } else if (setting.key === 'jadwal_hari_khusus') {
        try {
          result[setting.key] = JSON.parse(setting.value);
        } catch {
          result[setting.key] = [];
        }
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

    if (data.max_mahasiswa_uji_per_dosen !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'max_mahasiswa_uji_per_dosen' },
          update: {
            value: data.max_mahasiswa_uji_per_dosen.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'max_mahasiswa_uji_per_dosen',
            value: data.max_mahasiswa_uji_per_dosen.toString(),
            deskripsi:
              'Jumlah maksimal mahasiswa yang dapat diuji oleh satu dosen dalam satu periode sidang',
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
            deskripsi: 'Waktu jeda antar sidang dalam menit',
          },
        }),
      );
    }

    if (data.jam_mulai_sidang !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'jam_mulai_sidang' },
          update: {
            value: data.jam_mulai_sidang,
            updated_at: new Date(),
          },
          create: {
            key: 'jam_mulai_sidang',
            value: data.jam_mulai_sidang,
            deskripsi: 'Jam mulai operasional sidang',
          },
        }),
      );
    }

    if (data.jam_selesai_sidang !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'jam_selesai_sidang' },
          update: {
            value: data.jam_selesai_sidang,
            updated_at: new Date(),
          },
          create: {
            key: 'jam_selesai_sidang',
            value: data.jam_selesai_sidang,
            deskripsi: 'Jam selesai operasional sidang',
          },
        }),
      );
    }

    if (data.hari_libur_tetap !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'hari_libur_tetap' },
          update: {
            value: data.hari_libur_tetap.join(','),
            updated_at: new Date(),
          },
          create: {
            key: 'hari_libur_tetap',
            value: data.hari_libur_tetap.join(','),
            deskripsi: 'Hari libur tetap (dipisahkan dengan koma)',
          },
        }),
      );
    }

    if (data.tanggal_libur_khusus !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'tanggal_libur_khusus' },
          update: {
            value: JSON.stringify(data.tanggal_libur_khusus),
            updated_at: new Date(),
          },
          create: {
            key: 'tanggal_libur_khusus',
            value: JSON.stringify(data.tanggal_libur_khusus),
            deskripsi: 'Tanggal libur khusus (JSON array)',
          },
        }),
      );
    }

    if (data.syarat_pendaftaran_sidang !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'syarat_pendaftaran_sidang' },
          update: {
            value: JSON.stringify(data.syarat_pendaftaran_sidang),
            updated_at: new Date(),
          },
          create: {
            key: 'syarat_pendaftaran_sidang',
            value: JSON.stringify(data.syarat_pendaftaran_sidang),
            deskripsi:
              'Daftar dokumen yang harus diupload untuk pendaftaran sidang',
          },
        }),
      );
    }

    if (data.validasi_pendaftaran_sidang_aktif !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'validasi_pendaftaran_sidang_aktif' },
          update: {
            value: data.validasi_pendaftaran_sidang_aktif.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'validasi_pendaftaran_sidang_aktif',
            value: data.validasi_pendaftaran_sidang_aktif.toString(),
            deskripsi: 'Apakah validasi pendaftaran sidang aktif',
          },
        }),
      );
    }

    if (data.validasi_pembimbing_1 !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'validasi_pembimbing_1' },
          update: {
            value: data.validasi_pembimbing_1.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'validasi_pembimbing_1',
            value: data.validasi_pembimbing_1.toString(),
            deskripsi: 'Validasi oleh pembimbing 1',
          },
        }),
      );
    }

    if (data.validasi_pembimbing_2 !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'validasi_pembimbing_2' },
          update: {
            value: data.validasi_pembimbing_2.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'validasi_pembimbing_2',
            value: data.validasi_pembimbing_2.toString(),
            deskripsi: 'Validasi oleh pembimbing 2',
          },
        }),
      );
    }

    if (data.validasi_prodi !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'validasi_prodi' },
          update: {
            value: data.validasi_prodi.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'validasi_prodi',
            value: data.validasi_prodi.toString(),
            deskripsi: 'Validasi oleh prodi',
          },
        }),
      );
    }

    if (data.validasi_jurusan !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'validasi_jurusan' },
          update: {
            value: data.validasi_jurusan.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'validasi_jurusan',
            value: data.validasi_jurusan.toString(),
            deskripsi: 'Validasi oleh jurusan',
          },
        }),
      );
    }

    if ((data as any).waktu_istirahat !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'waktu_istirahat' },
          update: {
            value: JSON.stringify((data as any).waktu_istirahat),
            updated_at: new Date(),
          },
          create: {
            key: 'waktu_istirahat',
            value: JSON.stringify((data as any).waktu_istirahat),
            deskripsi:
              'Waktu istirahat tambahan di tengah jadwal sidang (JSON array)',
          },
        }),
      );
    }

    if ((data as any).jadwal_hari_khusus !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'jadwal_hari_khusus' },
          update: {
            value: JSON.stringify((data as any).jadwal_hari_khusus),
            updated_at: new Date(),
          },
          create: {
            key: 'jadwal_hari_khusus',
            value: JSON.stringify((data as any).jadwal_hari_khusus),
            deskripsi:
              'Jadwal jam operasional khusus untuk hari tertentu (JSON array)',
          },
        }),
      );
    }

    if ((data as any).rumus_penilaian !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'rumus_penilaian' },
          update: {
            value: (data as any).rumus_penilaian,
            updated_at: new Date(),
          },
          create: {
            key: 'rumus_penilaian',
            value: (data as any).rumus_penilaian,
            deskripsi:
              'Rumus perhitungan nilai akhir sidang menggunakan p1, p2, p3',
          },
        }),
      );
    }

    if ((data as any).nilai_minimal_lolos !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'nilai_minimal_lolos' },
          update: {
            value: (data as any).nilai_minimal_lolos.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'nilai_minimal_lolos',
            value: (data as any).nilai_minimal_lolos.toString(),
            deskripsi:
              'Nilai minimal untuk lolos sidang (di bawah nilai ini = gagal sidang)',
          },
        }),
      );
    }

    if ((data as any).tampilkan_rincian_nilai_ke_sekretaris !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'tampilkan_rincian_nilai_ke_sekretaris' },
          update: {
            value: (
              data as any
            ).tampilkan_rincian_nilai_ke_sekretaris.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'tampilkan_rincian_nilai_ke_sekretaris',
            value: (
              data as any
            ).tampilkan_rincian_nilai_ke_sekretaris.toString(),
            deskripsi:
              'Tampilkan rumus penilaian dan nilai minimal lolos ke sekretaris saat input nilai',
          },
        }),
      );
    }

    if ((data as any).cek_similaritas_semua_periode !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'cek_similaritas_semua_periode' },
          update: {
            value: (data as any).cek_similaritas_semua_periode.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'cek_similaritas_semua_periode',
            value: (data as any).cek_similaritas_semua_periode.toString(),
            deskripsi:
              'Jika diaktifkan, pengecekan kemiripan judul akan menggunakan semua judul dari semua periode termasuk periode 2014',
          },
        }),
      );
    }

    if ((data as any).nonaktifkan_cek_similaritas !== undefined) {
      updates.push(
        prisma.pengaturanSistem.upsert({
          where: { key: 'nonaktifkan_cek_similaritas' },
          update: {
            value: (data as any).nonaktifkan_cek_similaritas.toString(),
            updated_at: new Date(),
          },
          create: {
            key: 'nonaktifkan_cek_similaritas',
            value: (data as any).nonaktifkan_cek_similaritas.toString(),
            deskripsi:
              'Jika diaktifkan, pengecekan kemiripan judul akan dinonaktifkan sepenuhnya',
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
