import prisma from '../../config/database';
import type { TimeSlot } from './types';

export class ConflictValidatorService {
  async isSlotAvailable(slot: TimeSlot): Promise<boolean> {
    const existing = await prisma.jadwalSidang.findFirst({
      where: {
        tanggal: slot.tanggal,
        ruangan_id: slot.ruangan_id,
        NOT: [
          { waktu_selesai: { lte: slot.waktu_mulai } },
          { waktu_mulai: { gte: slot.waktu_selesai } },
        ],
      },
    });

    return !existing;
  }

  async validateNoConflict(
    slot: TimeSlot,
    pengujiIds: number[],
    pembimbingIds: number[],
  ): Promise<boolean> {
    const allDosenIds = [...pengujiIds, ...pembimbingIds];

    const conflicts = await prisma.jadwalSidang.findMany({
      where: {
        tanggal: slot.tanggal,
        waktu_mulai: slot.waktu_mulai,
        waktu_selesai: slot.waktu_selesai,
      },
      include: {
        sidang: {
          include: {
            tugasAkhir: {
              include: {
                peranDosenTa: {
                  where: {
                    peran: {
                      in: ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'],
                    },
                  },
                },
              },
            },
          },
        },
        ruangan: true,
      },
    });

    for (const conflict of conflicts) {
      const conflictDosenIds = conflict.sidang.tugasAkhir.peranDosenTa
        .filter((p) =>
          ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'].includes(p.peran),
        )
        .map((p) => p.dosen_id);

      const conflictingDosen = allDosenIds.filter((id) =>
        conflictDosenIds.includes(id),
      );

      if (conflictingDosen.length > 0) {
        return false;
      }
    }

    return true;
  }
}
