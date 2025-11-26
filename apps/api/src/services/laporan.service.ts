import { PrismaClient } from '@repo/db';
import type { StatistikDto } from '../dto/laporan.dto';
import { PeranDosen } from '@repo/db';

export class LaporanService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getStatistik(): Promise<StatistikDto> {
    const mahasiswaPerProdi = await this.prisma.mahasiswa.groupBy({
      by: ['prodi'],
      _count: { prodi: true },
    });

    // mahasiswaPerAngkatan dihapus karena field angkatan sudah tidak dipakai

    const sidangStatistik = await this.prisma.sidang.groupBy({
      by: ['jenis_sidang', 'status_hasil'],
      _count: { _all: true },
    });

    const bimbinganPerDosen = await this.prisma.bimbinganTA.groupBy({
      by: ['dosen_id'],
      _count: { _all: true },
    });

    const dokumenStatistik = await this.prisma.dokumenTa.groupBy({
      by: ['tipe_dokumen', 'status_validasi'],
      _count: { _all: true },
    });

    // Manual aggregation for pengujiStat to avoid circular reference error
    const pengujiData = await this.prisma.peranDosenTa.findMany({
      where: {
        peran: {
          in: [
            PeranDosen.penguji1,
            PeranDosen.penguji2,
            PeranDosen.penguji3,
            PeranDosen.penguji4,
          ],
        },
      },
      select: { dosen_id: true },
    });

    const pengujiStatCounts = pengujiData.reduce<Record<number, number>>(
      (acc, curr) => {
        const dosenId = Number(curr.dosen_id);
        const currentCount = Number(acc[dosenId] ?? 0);
        acc[dosenId] = currentCount + 1;
        return acc;
      },
      {},
    );

    const pengujiStat = Object.entries(pengujiStatCounts).map(
      ([dosen_id, count]) => ({
        dosen_id: parseInt(dosen_id, 10),
        _count: { _all: count },
      }),
    );

    return {
      mahasiswaPerProdi,
      mahasiswaPerAngkatan: [], // Empty array karena angkatan sudah tidak dipakai
      sidangStatistik,
      bimbinganPerDosen,
      dokumenStatistik,
      pengujiStat,
    };
  }
}
