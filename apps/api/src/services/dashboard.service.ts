import { PrismaClient, StatusTugasAkhir, StatusBimbingan } from '@repo/db';
import { DashboardRepository } from '../repositories/dashboard.repository';

interface DashboardStats {
  tugasAkhir: {
    total: number;
    disetujui: number;
    pending: number;
    ditolak: number;
  };
  bimbingan: {
    total: number;
    bulanIni: number;
    rataRata: number;
  };
  sidang: {
    status: string;
    tanggal: string | null;
  };
  progress: {
    percentage: number;
    tahap: string;
  };
}

interface Activity {
  id: string;
  type:
    | 'approval'
    | 'bimbingan'
    | 'pengajuan'
    | 'perubahan_status'
    | 'rejection';
  title: string;
  description: string;
  createdAt: Date;
}

interface Schedule {
  id: string;
  title: string;
  type: 'bimbingan' | 'sidang';
  date: Date;
  time: string;
  location: string;
  with: string;
  status: 'completed' | 'today' | 'upcoming';
}

export class DashboardService {
  private prisma: PrismaClient;
  private repository: DashboardRepository;

  constructor() {
    this.prisma = new PrismaClient();
    this.repository = new DashboardRepository(this.prisma);
  }

  /**
   * Get progress data for mahasiswa
   */
  async getMahasiswaProgress(
    userId: number,
    periodeId?: number,
  ): Promise<{
    statusTA: string;
    bimbinganCount: number;
    minBimbingan: number;
    tanggalDisetujui?: string;
  }> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: {
        tugasAkhir: {
          where: periodeId !== undefined ? { periode_ta_id: periodeId } : {},
          include: { bimbinganTa: true },
        },
      },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    const tugasAkhir = mahasiswa.tugasAkhir;
    const statusTA = tugasAkhir?.status ?? 'BELUM_MENGAJUKAN';

    const bimbinganList = tugasAkhir?.bimbinganTa ?? [];
    const bimbinganCount = bimbinganList.filter(
      (b) => b.status_bimbingan === StatusBimbingan.selesai,
    ).length;

    const minBimbingan = 8;

    let tanggalDisetujui: string | undefined;
    if (
      tugasAkhir != null &&
      (tugasAkhir.status === StatusTugasAkhir.DISETUJUI ||
        tugasAkhir.status === StatusTugasAkhir.BIMBINGAN)
    ) {
      tanggalDisetujui = new Date(tugasAkhir.updated_at).toLocaleDateString(
        'id-ID',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      );
    }

    return {
      statusTA,
      bimbinganCount,
      minBimbingan,
      ...(tanggalDisetujui != null &&
        tanggalDisetujui.length > 0 && { tanggalDisetujui }),
    };
  }

  /**
   * Get comprehensive dashboard statistics for mahasiswa
   */
  async getMahasiswaStats(
    userId: number,
    periodeId?: number,
  ): Promise<DashboardStats> {
    const ERROR_MESSAGE = 'Profil mahasiswa tidak ditemukan.';
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: {
        tugasAkhir: {
          where: periodeId !== undefined ? { periode_ta_id: periodeId } : {},
          include: {
            bimbinganTa: true,
            pendaftaranSidang: {
              include: {
                sidang: {
                  include: { jadwalSidang: true },
                },
              },
            },
          },
        },
      },
    });

    if (mahasiswa === null) {
      throw new Error(ERROR_MESSAGE);
    }

    const allTugasAkhir = await this.prisma.tugasAkhir.findMany({
      where: periodeId !== undefined ? { periode_ta_id: periodeId } : {},
      select: { status: true },
    });

    const tugasAkhirStats = {
      total: allTugasAkhir.length,
      disetujui: allTugasAkhir.filter(
        (ta) =>
          ta.status === StatusTugasAkhir.DISETUJUI ||
          ta.status === StatusTugasAkhir.BIMBINGAN,
      ).length,
      pending: allTugasAkhir.filter(
        (ta) => ta.status === StatusTugasAkhir.DIAJUKAN,
      ).length,
      ditolak: allTugasAkhir.filter(
        (ta) => ta.status === StatusTugasAkhir.DITOLAK,
      ).length,
    };

    const bimbinganList = mahasiswa.tugasAkhir?.bimbinganTa ?? [];
    const selesaiBimbingan = bimbinganList.filter(
      (b) => b.status_bimbingan === StatusBimbingan.selesai,
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const bulanIni = selesaiBimbingan.filter((b) => {
      const bimbDate = new Date(b.created_at);
      return (
        bimbDate.getMonth() === currentMonth &&
        bimbDate.getFullYear() === currentYear
      );
    }).length;

    const bimbinganStats = {
      total: selesaiBimbingan.length,
      bulanIni,
      rataRata:
        selesaiBimbingan.length > 0
          ? Math.round(selesaiBimbingan.length / 4)
          : 0, // Assuming 4 months average
    };

    const pendaftaranSidang = mahasiswa.tugasAkhir?.pendaftaranSidang[0];

    let sidangStatus = 'Belum Daftar';
    let sidangTanggal = null;

    if (pendaftaranSidang?.is_submitted === true) {
      sidangStatus = 'Terdaftar';

      const jadwalSidang = pendaftaranSidang.sidang?.jadwalSidang[0];
      if (jadwalSidang?.tanggal != null) {
        sidangTanggal = jadwalSidang.tanggal.toISOString();
      }
    }

    const sidangInfo = {
      status: sidangStatus,
      tanggal: sidangTanggal,
    };

    const progress = this.calculateProgress(mahasiswa.tugasAkhir?.status);

    return {
      tugasAkhir: tugasAkhirStats,
      bimbingan: bimbinganStats,
      sidang: sidangInfo,
      progress,
    };
  }

  /**
   * Get recent activities for mahasiswa
   */
  async getMahasiswaActivities(
    userId: number,
    limit = 10,
    periodeId?: number,
  ): Promise<Activity[]> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    const activities: Activity[] = [];

    const tugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswa.id,
        ...(periodeId !== undefined && { periode_ta_id: periodeId }),
      },
      include: {
        approver: true,
        rejecter: true,
      },
    });

    if (tugasAkhir !== null) {
      // Pengajuan
      if (tugasAkhir.tanggal_pengajuan !== null) {
        activities.push({
          id: `ta-${tugasAkhir.id}-pengajuan`,
          type: 'pengajuan',
          title: 'Judul Diajukan',
          description: `Judul "${tugasAkhir.judul}" telah diajukan`,
          createdAt: tugasAkhir.tanggal_pengajuan,
        });
      }

      if (
        tugasAkhir.status === StatusTugasAkhir.DISETUJUI &&
        tugasAkhir.approver !== null
      ) {
        activities.push({
          id: `ta-${tugasAkhir.id}-approval`,
          type: 'approval',
          title: 'Judul Disetujui',
          description: `Judul "${tugasAkhir.judul}" telah disetujui oleh ${tugasAkhir.approver.name}`,
          createdAt: tugasAkhir.updated_at,
        });
      }

      if (
        tugasAkhir.status === StatusTugasAkhir.DITOLAK &&
        tugasAkhir.rejecter !== null
      ) {
        activities.push({
          id: `ta-${tugasAkhir.id}-rejection`,
          type: 'rejection',
          title: 'Judul Ditolak',
          description:
            tugasAkhir.alasan_penolakan ?? 'Judul ditolak, revisi diperlukan',
          createdAt: tugasAkhir.updated_at,
        });
      }
    }

    const bimbingan = await this.prisma.bimbinganTA.findMany({
      where: {
        tugasAkhir: { mahasiswa_id: mahasiswa.id },
        status_bimbingan: StatusBimbingan.selesai,
        ...(periodeId !== undefined && { periode_ta_id: periodeId }),
      },
      include: {
        dosen: { include: { user: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    bimbingan.forEach((b) => {
      activities.push({
        id: `bimbingan-${b.id}`,
        type: 'bimbingan',
        title: 'Bimbingan Selesai',
        description: `Sesi bimbingan ${b.peran} dengan ${b.dosen.user.name}`,
        createdAt: b.created_at,
      });
    });

    const sortedActivities = [...activities].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return sortedActivities.slice(0, limit);
  }

  /**
   * Get upcoming schedule for mahasiswa
   */
  async getMahasiswaSchedule(
    userId: number,
    limit = 5,
    periodeId?: number,
  ): Promise<Schedule[]> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    const schedules: Schedule[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const bimbinganSchedule = await this.prisma.bimbinganTA.findMany({
      where: {
        tugasAkhir: { mahasiswa_id: mahasiswa.id },
        status_bimbingan: {
          in: [StatusBimbingan.dijadwalkan, StatusBimbingan.diajukan],
        },
        tanggal_bimbingan: { gte: today },
        ...(periodeId !== undefined && { periode_ta_id: periodeId }),
      },
      include: {
        dosen: { include: { user: true } },
      },
      orderBy: { tanggal_bimbingan: 'asc' },
      take: limit,
    });

    bimbinganSchedule.forEach((b) => {
      if (b.tanggal_bimbingan != null && b.jam_bimbingan != null) {
        const scheduleDate = new Date(b.tanggal_bimbingan);
        const isToday =
          scheduleDate.getFullYear() === today.getFullYear() &&
          scheduleDate.getMonth() === today.getMonth() &&
          scheduleDate.getDate() === today.getDate();

        schedules.push({
          id: `bimbingan-${b.id}`,
          title: `Bimbingan ${b.peran}`,
          type: 'bimbingan',
          date: scheduleDate,
          time: b.jam_bimbingan,
          location: 'Ruang Dosen', // Default, could be customized
          with: b.dosen.user.name,
          status: isToday ? 'today' : 'upcoming',
        });
      }
    });

    const sidangSchedule = await this.prisma.jadwalSidang.findMany({
      where: {
        sidang: {
          tugasAkhir: { mahasiswa_id: mahasiswa.id },
        },
        tanggal: { gte: today },
        ...(periodeId !== undefined && { periode_ta_id: periodeId }),
      },
      include: {
        sidang: {
          include: { tugasAkhir: true },
        },
        ruangan: true,
      },
      orderBy: { tanggal: 'asc' },
      take: limit,
    });

    sidangSchedule.forEach((s) => {
      const scheduleDate = new Date(s.tanggal);
      const isToday =
        scheduleDate.getFullYear() === today.getFullYear() &&
        scheduleDate.getMonth() === today.getMonth() &&
        scheduleDate.getDate() === today.getDate();

      schedules.push({
        id: `sidang-${s.id}`,
        title: `Sidang ${s.sidang.jenis_sidang}`,
        type: 'sidang',
        date: scheduleDate,
        time: `${s.waktu_mulai} - ${s.waktu_selesai}`,
        location: s.ruangan.nama_ruangan,
        with: 'Tim Penguji',
        status: isToday ? 'today' : 'upcoming',
      });
    });

    const sortedSchedules = [...schedules].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    return sortedSchedules.slice(0, limit);
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(periodeId?: number): Promise<{
    totalDosen: number;
    totalMahasiswa: number;
    totalJudulTA: number;
  }> {
    const totalDosen = await this.prisma.dosen.count();

    const totalJudulTA = await this.prisma.tugasAkhir.count({
      where: periodeId !== undefined ? { periode_ta_id: periodeId } : {},
    });

    const mahasiswaIds = await this.prisma.tugasAkhir.findMany({
      where: periodeId !== undefined ? { periode_ta_id: periodeId } : {},
      select: { mahasiswa_id: true },
      distinct: ['mahasiswa_id'],
    });

    const totalMahasiswa = mahasiswaIds.length;

    return {
      totalDosen,
      totalMahasiswa,
      totalJudulTA,
    };
  }

  /**
   * Calculate progress percentage based on status
   */
  private calculateProgress(status: StatusTugasAkhir | undefined): {
    percentage: number;
    tahap: string;
  } {
    if (status == null) {
      return { percentage: 0, tahap: 'Belum Mengajukan' };
    }

    const progressMap: Record<
      StatusTugasAkhir,
      { percentage: number; tahap: string }
    > = {
      [StatusTugasAkhir.DRAFT]: { percentage: 10, tahap: 'Draft' },
      [StatusTugasAkhir.DIAJUKAN]: { percentage: 25, tahap: 'Pengajuan' },
      [StatusTugasAkhir.DISETUJUI]: { percentage: 40, tahap: 'Disetujui' },
      [StatusTugasAkhir.BIMBINGAN]: { percentage: 60, tahap: 'Bimbingan' },
      [StatusTugasAkhir.REVISI]: { percentage: 55, tahap: 'Revisi' },
      [StatusTugasAkhir.MENUNGGU_PEMBATALAN]: {
        percentage: 30,
        tahap: 'Menunggu Pembatalan',
      },
      [StatusTugasAkhir.DIBATALKAN]: { percentage: 0, tahap: 'Dibatalkan' },
      [StatusTugasAkhir.LULUS_TANPA_REVISI]: {
        percentage: 100,
        tahap: 'Lulus',
      },
      [StatusTugasAkhir.LULUS_DENGAN_REVISI]: {
        percentage: 90,
        tahap: 'Lulus dengan Revisi',
      },
      [StatusTugasAkhir.SELESAI]: { percentage: 100, tahap: 'Selesai' },
      [StatusTugasAkhir.DITOLAK]: { percentage: 20, tahap: 'Ditolak' },
      [StatusTugasAkhir.GAGAL]: { percentage: 0, tahap: 'Gagal' },
    };

    return status in progressMap
      ? progressMap[status]
      : { percentage: 0, tahap: 'Unknown' };
  }
}
