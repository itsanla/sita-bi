import type { PrismaClient } from '@repo/db';
import { StatusBimbingan } from '@repo/db';

export class DashboardRepository {
  constructor(private prisma: PrismaClient) {}

  async getMahasiswaWithTugasAkhir(userId: number): Promise<{
    id: number;
    tugasAkhir: {
      id: number;
      bimbinganTa: unknown[];
      pendaftaranSidang: unknown[];
    } | null;
  } | null> {
    return this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: {
        tugasAkhir: {
          include: {
            bimbinganTa: true,
            pendaftaranSidang: {
              include: {
                sidang: {
                  include: {
                    jadwalSidang: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getAllTugasAkhir(): Promise<{ status: string }[]> {
    return this.prisma.tugasAkhir.findMany({
      select: {
        status: true,
      },
    });
  }

  async getTugasAkhirByMahasiswaId(mahasiswaId: number): Promise<{
    id: number;
    approver: unknown;
    rejecter: unknown;
  } | null> {
    return this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswaId },
      include: {
        approver: true,
        rejecter: true,
      },
    });
  }

  async getBimbinganByMahasiswaId(
    mahasiswaId: number,
    limit: number,
  ): Promise<unknown[]> {
    return this.prisma.bimbinganTA.findMany({
      where: {
        tugasAkhir: {
          mahasiswa_id: mahasiswaId,
        },
        status_bimbingan: StatusBimbingan.selesai,
      },
      include: {
        dosen: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });
  }

  async getBimbinganScheduleByMahasiswaId(
    mahasiswaId: number,
    today: Date,
    limit: number,
  ): Promise<unknown[]> {
    return this.prisma.bimbinganTA.findMany({
      where: {
        tugasAkhir: {
          mahasiswa_id: mahasiswaId,
        },
        status_bimbingan: {
          in: [StatusBimbingan.dijadwalkan, StatusBimbingan.diajukan],
        },
        tanggal_bimbingan: {
          gte: today,
        },
      },
      include: {
        dosen: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        tanggal_bimbingan: 'asc',
      },
      take: limit,
    });
  }

  async getSidangScheduleByMahasiswaId(
    mahasiswaId: number,
    today: Date,
    limit: number,
  ): Promise<unknown[]> {
    return this.prisma.jadwalSidang.findMany({
      where: {
        sidang: {
          tugasAkhir: {
            mahasiswa_id: mahasiswaId,
          },
        },
        tanggal: {
          gte: today,
        },
      },
      include: {
        sidang: {
          include: {
            tugasAkhir: true,
          },
        },
        ruangan: true,
      },
      orderBy: {
        tanggal: 'asc',
      },
      take: limit,
    });
  }

  async getSystemCounts(): Promise<[number, number, number]> {
    return Promise.all([
      this.prisma.dosen.count(),
      this.prisma.mahasiswa.count(),
      this.prisma.tugasAkhir.count(),
    ]);
  }
}
