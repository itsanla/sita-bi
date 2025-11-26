import prisma from '../config/database';
import { PeranDosen } from '@repo/db';

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
      acc[curr.peran] = Number(currentCount) + 1;
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
    const totalPembimbing = Number(count1) + Number(count2);
    if (totalPembimbing >= 2) {
      throw new Error('Maksimal 2 pembimbing.');
    }
  }

  const isPenguji = newRole.startsWith('penguji');
  if (isPenguji === true) {
    const pengujiRoles = [
      PeranDosen.penguji1,
      PeranDosen.penguji2,
      PeranDosen.penguji3,
    ];
    if (!pengujiRoles.includes(newRole)) {
      if (newRole === PeranDosen.penguji4) {
        throw new Error('Maksimal 3 penguji.');
      }
    }

    const roleCount = Number(countByRole[newRole] ?? 0);
    if (roleCount > 0) {
      throw new Error(`Posisi ${newRole} sudah terisi.`);
    }
  }

  return true;
};

/**
 * Memvalidasi beban kerja dosen.
 * Aturan: Maksimal bimbing 4 mahasiswa bersamaan.
 * @param dosenId ID Dosen
 */
export const validateDosenWorkload = async (
  dosenId: number,
): Promise<boolean> => {
  const dosen = await prisma.dosen.findUnique({
    where: { id: dosenId },
    select: { kuota_bimbingan: true },
  });

  if (dosen === null) throw new Error('Dosen tidak ditemukan');

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

  if (activeBimbinganCount >= dosen.kuota_bimbingan) {
    throw new Error(
      `Dosen telah mencapai batas kuota bimbingan (${dosen.kuota_bimbingan} mahasiswa).`,
    );
  }

  return true;
};
