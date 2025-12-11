import { PrismaClient } from '@repo/db';
import type { CreateTawaranTopikDto } from '../dto/tawaran-topik.dto';
import { calculateSimilarities } from '../utils/similarity';

export class TawaranTopikService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(
    dto: CreateTawaranTopikDto,
    userId: number,
    periodeId: number,
  ): Promise<unknown> {
    return this.prisma.tawaranTopik.create({
      data: {
        ...dto,
        kuota: 1,
        user_id: userId,
        periode_ta_id: periodeId,
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

  async takeTopic(topicId: number, mahasiswaId: number): Promise<unknown> {
    return this.prisma.$transaction(async (prisma) => {
      const topic = await prisma.tawaranTopik.findFirst({
        where: { id: topicId, kuota: { gt: 0 }, deleted_at: null },
      });

      if (topic === null) {
        throw new Error('Topik tidak ditemukan atau kuota sudah habis');
      }

      const activeTugasAkhir = await prisma.tugasAkhir.findFirst({
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
        throw new Error('Anda sudah memiliki tugas akhir aktif');
      }

      await prisma.tawaranTopik.update({
        where: { id: topicId },
        data: { kuota: { decrement: 1 } },
      });

      const tugasAkhir = await prisma.tugasAkhir.create({
        data: {
          mahasiswa_id: mahasiswaId,
          tawaran_topik_id: topicId,
          judul: topic.judul_topik,
          status: 'DISETUJUI',
          tanggal_pengajuan: new Date(),
        },
      });

      await prisma.historyTopikMahasiswa.create({
        data: {
          mahasiswa_id: mahasiswaId,
          tawaran_topik_id: topicId,
          status: 'disetujui',
        },
      });

      return tugasAkhir;
    });
  }

  async getAllTopics(
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
        tugasAkhir: {
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

  async checkSimilarity(
    judul: string,
  ): Promise<{ id: number; judul: string; similarity: number }[]> {
    const allTitles = await this.prisma.tugasAkhir.findMany({
      select: { id: true, judul: true },
      distinct: ['judul'],
    });

    const similarities = await calculateSimilarities(judul, allTitles);

    const uniqueResults = new Map<
      string,
      { id: number; judul: string; similarity: number }
    >();

    for (const item of similarities) {
      if (item.similarity > 0) {
        const existing = uniqueResults.get(item.judul);
        if (!existing || item.similarity > existing.similarity) {
          uniqueResults.set(item.judul, item);
        }
      }
    }

    return Array.from(uniqueResults.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }
}
