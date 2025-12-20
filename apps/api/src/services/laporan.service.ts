import type { StatistikDto } from '../dto/laporan.dto';
import { PeranDosen } from '../prisma-client';
import prisma from '../config/database';

export class LaporanService {
  private prisma = prisma;

  async getStatistik(): Promise<StatistikDto> {
    try {
      const [
        mahasiswaPerProdi,
        sidangStatistik,
        bimbinganPerDosen,
        dokumenStatistik,
        pengujiData,
      ] = await Promise.all([
        this.prisma.mahasiswa.groupBy({
          by: ['prodi'],
          _count: { prodi: true },
        }),
        this.prisma.sidang.groupBy({
          by: ['jenis_sidang', 'status_hasil'],
          _count: { _all: true },
        }),
        this.prisma.bimbinganTA.groupBy({
          by: ['dosen_id'],
          _count: { _all: true },
        }),
        this.prisma.dokumenTa.groupBy({
          by: ['tipe_dokumen', 'status_validasi'],
          _count: { _all: true },
        }),
        this.prisma.peranDosenTa.findMany({
          where: {
            peran: {
              in: [
                PeranDosen.penguji1,
                PeranDosen.penguji2,
                PeranDosen.penguji3,
              ],
            },
          },
          select: { dosen_id: true },
        }),
      ]);

      const pengujiStatCounts = pengujiData.reduce<Record<number, number>>(
        (acc, curr) => {
          acc[curr.dosen_id] = (acc[curr.dosen_id] ?? 0) + 1;
          return acc;
        },
        {},
      );

      const pengujiStat = Object.entries(pengujiStatCounts).map(
        ([dosen_id, count]) => ({
          dosen_id: Number(dosen_id),
          _count: { _all: count },
        }),
      );

      return {
        mahasiswaPerProdi,
        mahasiswaPerAngkatan: [],
        sidangStatistik,
        bimbinganPerDosen,
        dokumenStatistik,
        pengujiStat,
      };
    } catch (error) {
      console.error('[LaporanService] Error fetching statistik:', error);
      throw new Error('Gagal mengambil data statistik');
    }
  }
}
