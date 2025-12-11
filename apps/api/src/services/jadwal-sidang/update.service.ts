import prisma from '../../config/database';
import { PeranDosen } from '@prisma/client';
import { PERAN_PENGUJI } from './types';

export class UpdateService {
  async updateJadwal(
    jadwalId: number,
    data: {
      tanggal?: string;
      waktu_mulai?: string;
      waktu_selesai?: string;
      ruangan_id?: number;
      penguji1_id?: number;
      penguji2_id?: number;
      penguji3_id?: number;
    }
  ): Promise<unknown> {
    return await prisma.$transaction(async (tx) => {
      const jadwal = await tx.jadwalSidang.findUnique({
        where: { id: jadwalId },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
          ruangan: true,
        },
      });

      if (!jadwal) {
        const error = new Error('Jadwal tidak ditemukan') as Error & { statusCode: number };
        error.statusCode = 404;
        throw error;
      }

      const pengujiIds = [data.penguji1_id, data.penguji2_id, data.penguji3_id].filter(
        (pengujiId): pengujiId is number => typeof pengujiId === 'number'
      );
      const uniquePenguji = new Set(pengujiIds);
      if (pengujiIds.length !== uniquePenguji.size) {
        const error = new Error('Penguji tidak boleh sama') as Error & { statusCode: number };
        error.statusCode = 400;
        throw error;
      }

      const pembimbingIds = jadwal.sidang.tugasAkhir.peranDosenTa
        .filter((p) => p.peran === 'pembimbing1' || p.peran === 'pembimbing2')
        .map((p) => p.dosen_id);

      const isPengujiSamaDenganPembimbing = pengujiIds.some((pengujiId) => pembimbingIds.includes(pengujiId));
      if (isPengujiSamaDenganPembimbing) {
        const error = new Error('Penguji tidak boleh sama dengan pembimbing') as Error & { statusCode: number };
        error.statusCode = 400;
        throw error;
      }

      const tanggalBaru = data.tanggal !== undefined ? new Date(data.tanggal) : jadwal.tanggal;
      const waktuMulaiBaru = data.waktu_mulai ?? jadwal.waktu_mulai;
      const waktuSelesaiBaru = data.waktu_selesai ?? jadwal.waktu_selesai;
      const ruanganBaru = data.ruangan_id ?? jadwal.ruangan_id;

      if (typeof ruanganBaru !== 'number') {
        const error = new Error('Ruangan harus dipilih') as Error & { statusCode: number };
        error.statusCode = 400;
        throw error;
      }

      const tanggalNormalized = new Date(tanggalBaru);
      tanggalNormalized.setUTCHours(0, 0, 0, 0);

      const toMinutes = (time: string): number => {
        const [h = 0, m = 0] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const newStart = toMinutes(waktuMulaiBaru);
      const newEnd = toMinutes(waktuSelesaiBaru);

      const allConflicts = await tx.jadwalSidang.findMany({
        where: {
          id: { not: jadwalId },
          tanggal: {
            gte: tanggalNormalized,
            lt: new Date(tanggalNormalized.getTime() + 24 * 60 * 60 * 1000),
          },
          ruangan_id: ruanganBaru,
        },
        include: {
          sidang: { include: { tugasAkhir: { include: { mahasiswa: { include: { user: true } } } } } },
          ruangan: true,
        },
      });

      const conflictRuangan = allConflicts.find((c) => {
        const existStart = toMinutes(c.waktu_mulai);
        const existEnd = toMinutes(c.waktu_selesai);
        return !(existEnd <= newStart || existStart >= newEnd);
      });

      if (conflictRuangan) {
        const error = new Error(
          `Ruangan ${conflictRuangan.ruangan.nama_ruangan} sudah digunakan untuk sidang ${conflictRuangan.sidang.tugasAkhir.mahasiswa.user.name} pada waktu tersebut`
        ) as Error & { statusCode: number };
        error.statusCode = 409;
        throw error;
      }

      const allDosenIds = [...pengujiIds, ...pembimbingIds];
      const allSchedules = await tx.jadwalSidang.findMany({
        where: {
          id: { not: jadwalId },
          tanggal: {
            gte: tanggalNormalized,
            lt: new Date(tanggalNormalized.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
        },
      });

      const conflictDosen = allSchedules.filter((c) => {
        const existStart = toMinutes(c.waktu_mulai);
        const existEnd = toMinutes(c.waktu_selesai);
        return !(existEnd <= newStart || existStart >= newEnd);
      });

      for (const conflict of conflictDosen) {
        const PERAN_DOSEN_SIDANG = ['penguji1', 'penguji2', 'penguji3', 'pembimbing1'] as const;
        const conflictDosenIds = conflict.sidang.tugasAkhir.peranDosenTa
          .filter((p) => PERAN_DOSEN_SIDANG.includes(p.peran as typeof PERAN_DOSEN_SIDANG[number]))
          .map((p) => p.dosen_id);

        const bentrok = allDosenIds.filter((dosenId) => conflictDosenIds.includes(dosenId));

        if (bentrok.length > 0) {
          const dosenBentrok = conflict.sidang.tugasAkhir.peranDosenTa.find((p) => bentrok.includes(p.dosen_id));
          const error = new Error(
            `Dosen ${dosenBentrok?.dosen.user.name ?? 'Unknown'} sudah dijadwalkan untuk sidang ${conflict.sidang.tugasAkhir.mahasiswa.user.name} pada waktu tersebut`
          ) as Error & { statusCode: number };
          error.statusCode = 409;
          throw error;
        }
      }

      const updateData: {
        tanggal?: Date;
        waktu_mulai?: string;
        waktu_selesai?: string;
        ruangan_id?: number;
      } = {};
      if (data.tanggal !== undefined) updateData.tanggal = new Date(data.tanggal);
      if (data.waktu_mulai !== undefined) updateData.waktu_mulai = data.waktu_mulai;
      if (data.waktu_selesai !== undefined) updateData.waktu_selesai = data.waktu_selesai;
      if (data.ruangan_id !== undefined) updateData.ruangan_id = data.ruangan_id;

      await tx.jadwalSidang.update({ where: { id: jadwalId }, data: updateData });

      if (data.penguji1_id !== undefined && data.penguji2_id !== undefined && data.penguji3_id !== undefined) {
        await tx.peranDosenTa.deleteMany({
          where: { tugas_akhir_id: jadwal.sidang.tugas_akhir_id, peran: { in: [...PERAN_PENGUJI] } },
        });

        await tx.peranDosenTa.createMany({
          data: [
            { tugas_akhir_id: jadwal.sidang.tugas_akhir_id, dosen_id: data.penguji1_id, peran: PeranDosen.penguji1 },
            { tugas_akhir_id: jadwal.sidang.tugas_akhir_id, dosen_id: data.penguji2_id, peran: PeranDosen.penguji2 },
            { tugas_akhir_id: jadwal.sidang.tugas_akhir_id, dosen_id: data.penguji3_id, peran: PeranDosen.penguji3 },
          ],
        });
      }

      return await tx.jadwalSidang.findUnique({
        where: { id: jadwalId },
        include: {
          sidang: {
            include: {
              tugasAkhir: {
                include: {
                  mahasiswa: { include: { user: true } },
                  peranDosenTa: { include: { dosen: { include: { user: true } } } },
                },
              },
            },
          },
          ruangan: true,
        },
      });
    });
  }
}
