import prisma from '../../config/database';
import type { PengaturanJadwal } from './types';

export class DiagnosticService {
  async runSmartDiagnostic(
    pengaturan: PengaturanJadwal,
    getPengaturanByKey: (key: string) => Promise<string>,
  ): Promise<{
    success: boolean;
    error?: {
      status: string;
      masalah: string;
      saran?: string;
      perhitungan?: string;
      detail?: Record<string, unknown>;
    };
    info?: {
      mahasiswaCount: number;
      totalDosen: number;
      ruanganCount: number;
      hariKerja: number;
      slotPerHari: number;
      estimasiHari: number;
      warnings: { problems: string[]; suggestions: string[] } | null;
    };
  }> {
    const mahasiswaCount = await prisma.mahasiswa.count({
      where: { siap_sidang: true },
    });
    const totalDosen = await prisma.dosen.count();
    const ruanganCount = pengaturan.ruangan_sidang.length;
    const hariLiburCount = pengaturan.hari_libur_tetap.length;

    const [jamMulai = 0, menitMulai = 0] = pengaturan.jam_mulai_sidang
      .split(':')
      .map(Number);
    const [jamSelesai = 0, menitSelesai = 0] = pengaturan.jam_selesai_sidang
      .split(':')
      .map(Number);
    const totalMenit =
      jamSelesai * 60 + menitSelesai - (jamMulai * 60 + menitMulai);
    const durasiPerSidang =
      pengaturan.durasi_sidang_menit + pengaturan.jeda_sidang_menit;
    const slotPerHari = Math.floor(totalMenit / durasiPerSidang) * ruanganCount;
    const hariKerja = 7 - hariLiburCount;

    const problems: string[] = [];
    const suggestions: string[] = [];

    if (mahasiswaCount === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_MAHASISWA',
          masalah: 'Tidak ada mahasiswa yang siap sidang.',
          saran:
            'Pastikan ada mahasiswa dengan status "siap_sidang = true" di sistem.',
          detail: { mahasiswaCount: 0 },
        },
      };
    }

    if (ruanganCount === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_RUANGAN',
          masalah: 'Tidak ada ruangan sidang yang tersedia.',
          saran:
            'Tambahkan minimal 1 ruangan di menu Aturan Umum → Ruangan Sidang.',
          detail: { ruanganCount: 0 },
        },
      };
    }

    if (totalDosen === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_DOSEN',
          masalah: 'Tidak ada dosen di sistem.',
          saran: 'Tambahkan dosen melalui menu manajemen pengguna.',
          detail: { totalDosen: 0 },
        },
      };
    }

    if (hariKerja === 0) {
      return {
        success: false,
        error: {
          status: 'SEMUA_HARI_LIBUR',
          masalah: 'Semua hari (Senin-Minggu) diatur sebagai hari libur.',
          saran:
            'Uncheck beberapa hari di menu Aturan Umum → Hari Libur Tetap agar ada hari kerja untuk sidang.',
          detail: { hariLiburCount, hariKerja: 0 },
        },
      };
    }

    if (totalMenit < pengaturan.durasi_sidang_menit) {
      return {
        success: false,
        error: {
          status: 'JAM_OPERASIONAL_PENDEK',
          masalah: `Jam operasional (${totalMenit} menit) lebih pendek dari durasi sidang (${pengaturan.durasi_sidang_menit} menit).`,
          saran: `Perlebar jam operasional di menu Aturan Umum atau kurangi durasi sidang.`,
          detail: { totalMenit, durasiSidang: pengaturan.durasi_sidang_menit },
        },
      };
    }

    const maxPembimbingAktifStr = await getPengaturanByKey(
      'max_pembimbing_aktif',
    );
    const maxPembimbingAktif = parseInt(
      maxPembimbingAktifStr !== '' ? maxPembimbingAktifStr : '4',
      10,
    );
    const marginPersen = totalDosen > 0 ? maxPembimbingAktif / totalDosen : 0.2;
    const totalSlotDosen = totalDosen * pengaturan.max_mahasiswa_uji_per_dosen;
    const slotDibutuhkan = mahasiswaCount * 3;
    const slotDibutuhkanDenganMargin = Math.ceil(
      slotDibutuhkan * (1 + marginPersen),
    );

    if (totalSlotDosen < slotDibutuhkanDenganMargin) {
      const kuotaMinimal = Math.ceil(slotDibutuhkanDenganMargin / totalDosen);

      const perhitungan = [
        `📊 Perhitungan Kapasitas:`,
        ``,
        `1. Slot Dibutuhkan (Tanpa Margin):`,
        `   ${mahasiswaCount} mahasiswa × 3 penguji = ${slotDibutuhkan} slot`,
        ``,
        `2. Margin Safety (Cadangan Fleksibilitas):`,
        `   Apa itu Margin?`,
        `   Margin adalah cadangan slot tambahan yang diperlukan karena ada`,
        `   pembatasan: pembimbing TIDAK BOLEH menjadi penguji untuk mahasiswa`,
        `   yang dibimbingnya sendiri.`,
        ``,
        `   Margin dipengaruhi oleh:`,
        `   - Maksimal Pembimbing Aktif (${maxPembimbingAktif} mahasiswa/dosen)`,
        `   - Total Dosen (${totalDosen} dosen)`,
        ``,
        `   Rumus Margin:`,
        `   Margin = Maksimal Pembimbing Aktif / Total Dosen`,
        `   Margin = ${maxPembimbingAktif} / ${totalDosen} = ${(marginPersen * 100).toFixed(1)}%`,
        ``,
        `   Artinya: Jika semua dosen membimbing ${maxPembimbingAktif} mahasiswa, maka untuk`,
        `   setiap mahasiswa hanya ada ${totalDosen - 1} dosen (bukan ${totalDosen}) yang bisa jadi`,
        `   penguji. Semakin banyak mahasiswa per pembimbing, semakin besar`,
        `   margin yang dibutuhkan.`,
        ``,
        `3. Slot Dibutuhkan (Dengan Margin):`,
        `   ${slotDibutuhkan} slot + ${(marginPersen * 100).toFixed(1)}% margin = ${slotDibutuhkanDenganMargin} slot`,
        ``,
        `4. Kapasitas Tersedia:`,
        `   ${totalDosen} dosen × ${pengaturan.max_mahasiswa_uji_per_dosen} quota = ${totalSlotDosen} slot`,
        ``,
        `5. Hasil:`,
        `   ${totalSlotDosen} slot < ${slotDibutuhkanDenganMargin} slot → TIDAK CUKUP! ❌`,
        ``,
        `6. Quota Minimal yang Dibutuhkan:`,
        `   ${slotDibutuhkanDenganMargin} slot / ${totalDosen} dosen = ${(slotDibutuhkanDenganMargin / totalDosen).toFixed(1)} → ${kuotaMinimal} quota/dosen`,
      ].join('\n');

      return {
        success: false,
        error: {
          status: 'KAPASITAS_DOSEN_TIDAK_CUKUP',
          masalah: `Kapasitas dosen tidak mencukupi untuk ${mahasiswaCount} mahasiswa.`,
          perhitungan,
          saran: `Naikkan "Maksimal Mahasiswa Uji per Dosen" dari ${pengaturan.max_mahasiswa_uji_per_dosen} menjadi minimal ${kuotaMinimal} di menu Aturan Umum.`,
          detail: {
            totalDosen,
            maxPembimbingAktif,
            marginPersen: `${(marginPersen * 100).toFixed(1)}%`,
            kuotaSekarang: pengaturan.max_mahasiswa_uji_per_dosen,
            kuotaMinimal,
            totalSlotDosen,
            mahasiswaCount,
            slotDibutuhkan,
            slotDibutuhkanDenganMargin,
          },
        },
      };
    }

    const hariDibutuhkan = Math.ceil(mahasiswaCount / slotPerHari);

    if (slotPerHari === 0) {
      return {
        success: false,
        error: {
          status: 'TIDAK_ADA_SLOT_WAKTU',
          masalah: 'Tidak ada slot waktu yang tersedia per hari.',
          saran:
            'Perlebar jam operasional atau tambah ruangan di menu Aturan Umum.',
          detail: { slotPerHari: 0, totalMenit, durasiPerSidang },
        },
      };
    }

    if (hariDibutuhkan > 60) {
      problems.push(
        `Estimasi butuh ${hariDibutuhkan} hari kerja untuk ${mahasiswaCount} mahasiswa.`,
      );
      suggestions.push(
        `Tambah ruangan (sekarang: ${ruanganCount}) atau perlebar jam operasional untuk mempercepat.`,
      );
    }

    return {
      success: true,
      info: {
        mahasiswaCount,
        totalDosen,
        ruanganCount,
        hariKerja,
        slotPerHari,
        estimasiHari: hariDibutuhkan,
        warnings: problems.length > 0 ? { problems, suggestions } : null,
      },
    };
  }
}
