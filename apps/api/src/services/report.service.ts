import { PrismaClient } from '@repo/db';

interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  activeTAs: number;
}

interface LecturerRoleWorkload {
  role: string;
  count: number;
}

interface LecturerWorkload {
  dosen_id: number;
  name: string;
  nidn: string;
  roles: LecturerRoleWorkload[];
}

export class ReportService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalStudents, totalLecturers, activeTAs] = await Promise.all([
      this.prisma.mahasiswa.count(),
      this.prisma.dosen.count(),
      this.prisma.tugasAkhir.count({
        where: {
          status: {
            notIn: ['SELESAI', 'GAGAL', 'DIBATALKAN', 'DITOLAK'],
          },
        },
      }),
    ]);

    return {
      totalStudents,
      totalLecturers,
      activeTAs,
    };
  }

  async getLecturerWorkload(): Promise<LecturerWorkload[]> {
    // Count workloads based on peranDosenTa
    const workloads = await this.prisma.peranDosenTa.groupBy({
      by: ['dosen_id', 'peran'],
      _count: {
        tugas_akhir_id: true,
      },
    });

    const lecturers = await this.prisma.dosen.findMany({
      include: { user: true },
    });

    const result = lecturers.map((dosen) => {
      const theirWorkload = workloads.filter((w) => w.dosen_id === dosen.id);
      return {
        dosen_id: dosen.id,
        name: dosen.user.name,
        nidn: dosen.nidn,
        roles: theirWorkload.map((w) => ({
          role: w.peran,
          count: w._count.tugas_akhir_id,
        })),
      };
    });

    return result;
  }
}
