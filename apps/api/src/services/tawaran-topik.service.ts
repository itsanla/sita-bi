import { PrismaClient } from '@repo/db';
import type { CreateTawaranTopikDto } from '../dto/tawaran-topik.dto';

export class TawaranTopikService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(dto: CreateTawaranTopikDto, userId: number): Promise<unknown> {
    return this.prisma.tawaranTopik.create({
      data: {
        ...dto,
        user_id: userId,
      },
    });
  }

  async findByDosen(
    userId: number,
    page = 1,
    limit = 50,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause = { user_id: userId };
    const total = await this.prisma.tawaranTopik.count({ where: whereClause });
    const data = await this.prisma.tawaranTopik.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAvailable(
    page = 1,
    limit = 50,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause = {
      kuota: { gt: 0 },
      deleted_at: null,
    };
    const total = await this.prisma.tawaranTopik.count({ where: whereClause });
    const data = await this.prisma.tawaranTopik.findMany({
      where: whereClause,
      include: {
        dosenPencetus: {
          select: { name: true, email: true },
        },
        historyTopik: {
          where: { status: 'disetujui' },
          include: {
            mahasiswa: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async applyForTopic(topicId: number, mahasiswaId: number): Promise<unknown> {
    const topic = await this.prisma.tawaranTopik.findFirst({
      where: { id: topicId, kuota: { gt: 0 }, deleted_at: null },
    });

    if (topic === null) {
      throw new Error('Topic not found or no available quota.');
    }

    const activeTugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        NOT: {
          status: {
            in: [
              'DIBATALKAN',
              'LULUS_DENGAN_REVISI',
              'LULUS_TANPA_REVISI',
              'SELESAI',
              'DITOLAK',
            ],
          },
        },
      },
    });

    if (activeTugasAkhir !== null) {
      throw new Error('You already have an active final project.');
    }

    const existingApplication =
      await this.prisma.historyTopikMahasiswa.findFirst({
        where: { mahasiswa_id: mahasiswaId, status: 'diajukan' },
      });

    if (existingApplication !== null) {
      throw new Error('You already have a pending topic application.');
    }

    return this.prisma.historyTopikMahasiswa.create({
      data: {
        mahasiswa_id: mahasiswaId,
        tawaran_topik_id: topicId,
        status: 'diajukan',
      },
    });
  }

  async getApplicationsForDosen(
    userId: number,
    page = 1,
    limit = 50,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const lecturerTopics = await this.prisma.tawaranTopik.findMany({
      where: { user_id: userId },
      select: { id: true },
    });

    if (lecturerTopics.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const topicIds = lecturerTopics.map((t) => t.id);

    const whereClause = {
      tawaran_topik_id: { in: topicIds },
      status: 'diajukan',
    };
    const total = await this.prisma.historyTopikMahasiswa.count({
      where: whereClause,
    });
    const data = await this.prisma.historyTopikMahasiswa.findMany({
      where: whereClause,
      include: {
        mahasiswa: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        tawaranTopik: {
          select: { judul_topik: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllTopicsWithApplications(
    page = 1,
    limit = 50,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause = { deleted_at: null };
    const total = await this.prisma.tawaranTopik.count({ where: whereClause });
    const data = await this.prisma.tawaranTopik.findMany({
      where: whereClause,
      include: {
        dosenPencetus: {
          select: { name: true, email: true },
        },
        historyTopik: {
          include: {
            mahasiswa: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveApplication(
    applicationId: number,
    dosenId: number,
  ): Promise<unknown> {
    return this.prisma.$transaction(async (prisma) => {
      const application = await prisma.historyTopikMahasiswa.findUnique({
        where: { id: applicationId },
        include: { tawaranTopik: true, mahasiswa: true },
      });

      if (application?.tawaranTopik.user_id !== dosenId) {
        throw new Error('Application not found or you do not own this topic.');
      }

      if (application.status !== 'diajukan') {
        throw new Error('This application has already been processed.');
      }

      // 1. Update application status
      const updatedApplication = await prisma.historyTopikMahasiswa.update({
        where: { id: applicationId },
        data: { status: 'disetujui' },
      });

      // 2. Decrement topic quota
      await prisma.tawaranTopik.update({
        where: { id: application.tawaran_topik_id },
        data: { kuota: { decrement: 1 } },
      });

      // 3. Create a new TugasAkhir for the student
      await prisma.tugasAkhir.create({
        data: {
          mahasiswa_id: application.mahasiswa_id,
          tawaran_topik_id: application.tawaran_topik_id,
          judul: application.tawaranTopik.judul_topik,
          status: 'DISETUJUI', // Or another initial status
          tanggal_pengajuan: new Date(),
        },
      });

      // 4. Reject other pending applications for this student
      await prisma.historyTopikMahasiswa.updateMany({
        where: {
          mahasiswa_id: application.mahasiswa_id,
          status: 'diajukan',
        },
        data: { status: 'ditolak' },
      });

      return updatedApplication;
    });
  }

  async rejectApplication(
    applicationId: number,
    dosenId: number,
  ): Promise<unknown> {
    const application = await this.prisma.historyTopikMahasiswa.findUnique({
      where: { id: applicationId },
      include: { tawaranTopik: true },
    });

    if (application?.tawaranTopik.user_id !== dosenId) {
      throw new Error('Application not found or you do not own this topic.');
    }

    if (application.status !== 'diajukan') {
      throw new Error('This application has already been processed.');
    }

    return this.prisma.historyTopikMahasiswa.update({
      where: { id: applicationId },
      data: { status: 'ditolak' },
    });
  }
}
