import prisma from '../config/database';
import { PeranDosen } from '../prisma-client';
import { PengaturanService } from '../services/pengaturan.service';

let pengaturanServiceInstance: PengaturanService | null = null;

const getPengaturanService = (): PengaturanService => {
  if (!pengaturanServiceInstance) {
    pengaturanServiceInstance = new PengaturanService();
  }
  return pengaturanServiceInstance;
};

/**
 * Memvalidasi apakah komposisi tim TA valid sesuai aturan.
 * Aturan:
 * - 2 Pembimbing (Pembimbing 1 & 2)
 * - 3 Penguji
 *
 * Fungsi ini mengecek apakah penambahan peran baru akan melanggar aturan.
 * @param tugasAkhirId ID Tugas Akhir
 * @param newRole Peran yang akan ditambahkan
 */
export const validateTeamComposition = async (
  tugasAkhirId: number,
  newRole: PeranDosen,
): Promise<boolean> => {
  const currentRoles = await prisma.peranDosenTa.findMany({
    where: { tugas_akhir_id: tugasAkhirId },
  });

  const countByRole = currentRoles.reduce<Record<string, number>>(
    (acc, curr) => {
      const currentCount = acc[curr.peran] ?? 0;
      acc[curr.peran] = currentCount + 1;
      return acc;
    },
    {},
  );

  // Check pembimbing limit
  if (
    newRole === PeranDosen.pembimbing1 ||
    newRole === PeranDosen.pembimbing2
  ) {
    if (
      newRole === PeranDosen.pembimbing1 &&
      (countByRole[PeranDosen.pembimbing1] ?? 0) > 0
    ) {
      throw new Error('Pembimbing 1 sudah terisi.');
    }
    if (
      newRole === PeranDosen.pembimbing2 &&
      (countByRole[PeranDosen.pembimbing2] ?? 0) > 0
    ) {
      throw new Error('Pembimbing 2 sudah terisi.');
    }
    // Total pembimbing check (redundant but safe)
    const count1 = countByRole[PeranDosen.pembimbing1] ?? 0;
    const count2 = countByRole[PeranDosen.pembimbing2] ?? 0;
    const totalPembimbing = count1 + count2;
    if (totalPembimbing >= 2) {
      throw new Error('Maksimal 2 pembimbing.');
    }
  }

  const isPenguji = newRole.startsWith('penguji');
  if (isPenguji) {
    const pengujiRoles = [
      PeranDosen.penguji1,
      PeranDosen.penguji2,
      PeranDosen.penguji3,
    ];
    if (!pengujiRoles.includes(newRole as any)) {
      if ((newRole as any) === 'penguji4') {
        throw new Error('Maksimal 3 penguji.');
      }
    }

    const roleCount = countByRole[newRole] ?? 0;
    if (roleCount > 0) {
      throw new Error(`Posisi ${newRole} sudah terisi.`);
    }
  }

  return true;
};

/**
 * Memvalidasi beban kerja dosen.
 * Aturan: Maksimal bimbing mahasiswa bersamaan sesuai pengaturan sistem.
 * @param dosenId ID Dosen
 */
export const validateDosenWorkload = async (
  dosenId: number,
): Promise<boolean> => {
  const ps = getPengaturanService();
  const maxPembimbingAktif = await ps.getPengaturanByKey(
    'max_pembimbing_aktif',
  );
  const kuotaBimbingan =
    maxPembimbingAktif !== null ? parseInt(maxPembimbingAktif, 10) : 4;

  const activeBimbinganCount = await prisma.peranDosenTa.count({
    where: {
      dosen_id: dosenId,
      peran: {
        in: [PeranDosen.pembimbing1, PeranDosen.pembimbing2],
      },
      tugasAkhir: {
        status: {
          notIn: [
            'LULUS_TANPA_REVISI',
            'LULUS_DENGAN_REVISI',
            'SELESAI',
            'GAGAL',
            'DITOLAK',
            'DIBATALKAN',
          ],
        },
      },
    },
  });

  if (activeBimbinganCount >= kuotaBimbingan) {
    throw new Error(
      `Dosen telah mencapai batas kuota bimbingan (${kuotaBimbingan} mahasiswa).`,
    );
  }

  return true;
};

/**
 * Mendapatkan nilai pengaturan minimal bimbingan valid dari database
 */
export const getMinBimbinganValid = async (): Promise<number> => {
  const ps = getPengaturanService();
  const value = await ps.getPengaturanByKey(
    'min_bimbingan_valid',
  );
  return value !== null ? parseInt(value, 10) : 9;
};

/**
 * Mendapatkan nilai pengaturan maksimal similaritas dari database
 * Mengembalikan 0 jika pengecekan similaritas dinonaktifkan
 */
export const getMaxSimilaritasPersen = async (): Promise<number> => {
  const ps = getPengaturanService();
  const nonaktifkanCek = await ps.getPengaturanByKey(
    'nonaktifkan_cek_similaritas',
  );
  if (nonaktifkanCek === 'true') {
    return 0;
  }

  const value = await ps.getPengaturanByKey(
    'max_similaritas_persen',
  );
  return value !== null ? parseInt(value, 10) : 80;
};

/**
 * Mendapatkan daftar ruangan sidang dari database
 */
export const getRuanganSidang = async (): Promise<string[]> => {
  const ps = getPengaturanService();
  const value = await ps.getPengaturanByKey('ruangan_sidang');
  return value !== null ? value.split(',').map((r: any) => r.trim()) : [];
};
