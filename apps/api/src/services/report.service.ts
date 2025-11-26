import prisma from '../config/database';

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
  nip: string;
  roles: LecturerRoleWorkload[];
}

export class ReportService {
  private prisma = prisma;

  async getDashboardStats(): Promise<DashboardStats> {
    try {
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
    } catch (error) {
      console.error('[ReportService] Error fetching dashboard stats:', error);
      throw new Error('Gagal mengambil statistik dashboard');
    }
  }

  async getLecturerWorkload(): Promise<LecturerWorkload[]> {
    try {
      const [workloads, lecturers] = await Promise.all([
        this.prisma.peranDosenTa.groupBy({
          by: ['dosen_id', 'peran'],
          _count: {
            tugas_akhir_id: true,
          },
        }),
        this.prisma.dosen.findMany({
          include: { user: true },
        }),
      ]);

      return lecturers.map((dosen) => ({
        dosen_id: dosen.id,
        name: dosen.user.name,
        nip: dosen.nip,
        roles: workloads
          .filter((w) => w.dosen_id === dosen.id)
          .map((w) => ({
            role: w.peran,
            count: w._count.tugas_akhir_id,
          })),
      }));
    } catch (error) {
      console.error('[ReportService] Error fetching lecturer workload:', error);
      throw new Error('Gagal mengambil data beban kerja dosen');
    }
  }
}
