import { PrismaClient } from '@repo/db';
import type { CreateTawaranTopikDto } from '../dto/tawaran-topik.dto';
import { calculateSimilarities } from '../utils/similarity';
import { PengaturanService } from './pengaturan.service';

export class TawaranTopikService {
  private prisma: PrismaClient;
  private pengaturanService: PengaturanService;

  constructor() {
    this.prisma = new PrismaClient();
    this.pengaturanService = new PengaturanService();
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
    periodeId?: number,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log('=== SERVICE findAvailable DEBUG ===');
    console.log('Input params - page:', page, 'limit:', limit, 'periodeId:', periodeId);
    
    const whereClause = {
      kuota: { gt: 0 },
      deleted_at: null,
      ...(periodeId && { periode_ta_id: periodeId }),
    };
    
    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    
    const total = await this.prisma.tawaranTopik.count({ where: whereClause });
    console.log('Total count:', total);
    
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
    
    console.log('Found data count:', data.length);
    console.log('Sample data:', data.slice(0, 2));
    console.log('=== END SERVICE DEBUG ===');
    
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

   async takeTopic(topicId: number, mahasiswaId: number, periodeId: number): Promise<unknown> {
    return this.prisma.$transaction(async (prisma) => {
      const topic = await prisma.tawaranTopik.findFirst({
        where: { 
          id: topicId, 
          kuota: { gt: 0 }, 
          deleted_at: null,
          periode_ta_id: periodeId
        },
      });

      if (topic === null) {
        throw new Error('Topik tidak ditemukan, kuota sudah habis, atau bukan dari periode yang dipilih');
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
          periode_ta_id: periodeId,
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
    periodeId: number,
  ): Promise<{ id: number; judul: string; similarity: number }[]> {
    // Cek apakah pengecekan similaritas dinonaktifkan
    const nonaktifkanCek = await this.pengaturanService.getPengaturanByKey('nonaktifkan_cek_similaritas');
    if (nonaktifkanCek === 'true') {
      return [];
    }

    // Cek pengaturan apakah menggunakan semua periode atau hanya periode tertentu
    const cekSemuaPeriode = await this.pengaturanService.getPengaturanByKey('cek_similaritas_semua_periode');
    const useAllPeriods = cekSemuaPeriode === 'true';

    let allTitles: { id: number; judul: string }[] = [];
    
    if (useAllPeriods) {
      // Toggle ON: Cek semua judul TA dari periode lain (2014-2024, tanpa tawaran topik) + judul TA periode aktif + tawaran topik periode aktif
      
      // 1. Ambil semua judul TA dari periode selain periode aktif (2014-2024)
      const historicalTitles = await this.prisma.tugasAkhir.findMany({
        where: {
          NOT: { periode_ta_id: periodeId },
        },
        select: { id: true, judul: true },
        distinct: ['judul'],
      });
      
      // 2. Ambil judul TA dari periode aktif (2025)
      const currentPeriodTitles = await this.prisma.tugasAkhir.findMany({
        where: { periode_ta_id: periodeId },
        select: { id: true, judul: true },
        distinct: ['judul'],
      });
      
      // 3. Ambil tawaran topik dari periode aktif (2025)
      const currentPeriodTopics = await this.prisma.tawaranTopik.findMany({
        where: { 
          periode_ta_id: periodeId,
          deleted_at: null 
        },
        select: { id: true, judul_topik: true },
      });
      
      // Gabungkan semua judul
      allTitles = [
        ...historicalTitles,
        ...currentPeriodTitles,
        ...currentPeriodTopics.map(topic => ({ id: topic.id, judul: topic.judul_topik }))
      ];
    } else {
      // Toggle OFF: Hanya cek judul TA periode aktif + tawaran topik periode aktif
      
      // 1. Ambil judul TA dari periode aktif (2025)
      const currentPeriodTitles = await this.prisma.tugasAkhir.findMany({
        where: { periode_ta_id: periodeId },
        select: { id: true, judul: true },
        distinct: ['judul'],
      });
      
      // 2. Ambil tawaran topik dari periode aktif (2025)
      const currentPeriodTopics = await this.prisma.tawaranTopik.findMany({
        where: { 
          periode_ta_id: periodeId,
          deleted_at: null 
        },
        select: { id: true, judul_topik: true },
      });
      
      // Gabungkan judul TA dan tawaran topik dari periode aktif
      allTitles = [
        ...currentPeriodTitles,
        ...currentPeriodTopics.map(topic => ({ id: topic.id, judul: topic.judul_topik }))
      ];
    }

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
