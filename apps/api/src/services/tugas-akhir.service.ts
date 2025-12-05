import type { TugasAkhir } from '@repo/db'; // Import type explicitly
import { PrismaClient, StatusTugasAkhir } from '@repo/db';
import type { CreateTugasAkhirDto } from '../dto/tugas-akhir.dto';
import { calculateSimilarities } from '../utils/similarity';

// Custom Error for similarity check
export class SimilarityError extends Error {
  constructor(public similarities: unknown[]) {
    super('High similarity found with existing titles.');
    this.name = 'SimilarityError';
  }
}

export class TugasAkhirService {
  private prisma: PrismaClient;
  private readonly ERROR_DOSEN_NOT_FOUND = 'Profil dosen tidak ditemukan.';
  private readonly ERROR_TA_NOT_FOUND = 'Tugas Akhir tidak ditemukan.';

  constructor() {
    this.prisma = new PrismaClient();
  }

  private async logActivity(
    userId: number,
    action: string,
    url?: string,
    method?: string,
  ): Promise<void> {
    try {
      await this.prisma.log.create({
        data: {
          user_id: userId,
          action,
          url: url ?? null,
          method: method ?? null,
          ip_address: '127.0.0.1', // Placeholder
          user_agent: 'System', // Placeholder
        },
      });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }

  async checkSimilarity(
    judul: string,
  ): Promise<{ id: number; judul: string; similarity: number }[]> {
    const allTitles = await this.prisma.tugasAkhir.findMany({
      select: { id: true, judul: true },
    });

    const tawaranTopik = await this.prisma.tawaranTopik.findMany({
      where: { deleted_at: null },
      select: { id: true, judul_topik: true },
    });

    const combinedTitles = [
      ...allTitles,
      ...tawaranTopik.map((t) => ({ id: t.id, judul: t.judul_topik })),
    ];

    if (combinedTitles.length === 0) {
      return [];
    }

    const similarities = await calculateSimilarities(judul, combinedTitles);

    return similarities.filter((res) => res.similarity > 50).slice(0, 5);
  }

  async createFinal(
    dto: CreateTugasAkhirDto,
    userId: number,
  ): Promise<TugasAkhir> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    const existingTugasAkhir = await this.prisma.tugasAkhir.findFirst({
      where: { mahasiswa_id: mahasiswa.id },
    });

    if (existingTugasAkhir !== null) {
      throw new Error(
        'Anda sudah memiliki Tugas Akhir dan tidak dapat mengajukan lagi.',
      );
    }

    // Check for exact title match just in case
    const existingTitle = await this.prisma.tugasAkhir.findFirst({
      where: { judul: { equals: dto.judul } },
    });

    if (existingTitle !== null) {
      throw new Error(`Judul "${dto.judul}" sudah pernah diajukan.`);
    }

    const newTa = await this.prisma.tugasAkhir.create({
      data: {
        judul: dto.judul,
        mahasiswa_id: mahasiswa.id,
        status: StatusTugasAkhir.DIAJUKAN,
        tanggal_pengajuan: new Date(),
      },
    });

    await this.logActivity(
      userId,
      `Mengajukan judul Tugas Akhir: "${dto.judul}"`,
    );

    return newTa;
  }

  async findMyTugasAkhir(userId: number): Promise<TugasAkhir | null> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    const result = await this.prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswa.id,
        NOT: {
          status: {
            in: [
              StatusTugasAkhir.DIBATALKAN,
              StatusTugasAkhir.LULUS_DENGAN_REVISI,
              StatusTugasAkhir.LULUS_TANPA_REVISI,
              StatusTugasAkhir.SELESAI,
            ],
          },
        },
      },
      include: {
        mahasiswa: {
          include: {
            user: true,
          },
        },
        peranDosenTa: {
          orderBy: {
            peran: 'asc',
          },
          include: {
            dosen: {
              include: {
                user: true,
              },
            },
          },
        },
        pendaftaranSidang: true,
      },
      orderBy: {
        tanggal_pengajuan: 'desc',
      },
    });

    return result;
  }

  async deleteMyTa(userId: number): Promise<TugasAkhir> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: { tugasAkhir: true },
    });

    if (mahasiswa?.tugasAkhir === undefined) {
      throw new Error('Tugas Akhir not found for this student.');
    }

    const { tugasAkhir } = mahasiswa;

    const deleted = await this.prisma.tugasAkhir.delete({
      where: { id: tugasAkhir.id },
    });

    await this.logActivity(
      userId,
      `Menghapus pengajuan Tugas Akhir: "${tugasAkhir.judul}"`,
    );

    return deleted;
  }

  async findAllTitles(): Promise<{ judul: string }[]> {
    return this.prisma.tugasAkhir.findMany({
      select: {
        judul: true,
      },
      orderBy: {
        judul: 'asc',
      },
    });
  }

  async approve(tugasAkhirId: number, approverId: number): Promise<TugasAkhir> {
    const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
      include: {
        peranDosenTa: {
          include: {
            dosen: true,
          },
        },
      },
    });

    if (tugasAkhir === null) {
      throw new Error(this.ERROR_TA_NOT_FOUND);
    }

    if (tugasAkhir.status !== StatusTugasAkhir.DIAJUKAN) {
      throw new Error(
        `Tugas Akhir dengan status "${tugasAkhir.status}" tidak dapat disetujui.`,
      );
    }

    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: approverId },
    });

    if (dosen === null) {
      throw new Error(this.ERROR_DOSEN_NOT_FOUND);
    }

    const isPembimbing = tugasAkhir.peranDosenTa.some(
      (peran) =>
        peran.dosen_id === dosen.id &&
        (peran.peran === 'pembimbing1' || peran.peran === 'pembimbing2'),
    );

    if (!isPembimbing) {
      throw new Error(
        'Hanya pembimbing yang dapat menyetujui judul tugas akhir ini.',
      );
    }

    const approved = await this.prisma.tugasAkhir.update({
      where: { id: tugasAkhirId },
      data: {
        status: StatusTugasAkhir.DISETUJUI,
        disetujui_oleh: approverId,
      },
      include: {
        mahasiswa: {
          include: {
            user: true,
          },
        },
        approver: true,
      },
    });

    await this.logActivity(
      approverId,
      `Menyetujui Tugas Akhir mahasiswa ${approved.mahasiswa.nim}: "${approved.judul}"`,
    );

    return approved;
  }

  async reject(
    tugasAkhirId: number,
    rejecterId: number,
    alasanPenolakan: string,
  ): Promise<TugasAkhir> {
    const tugasAkhir = await this.prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
      include: {
        peranDosenTa: {
          include: {
            dosen: true,
          },
        },
      },
    });

    if (tugasAkhir === null) {
      throw new Error(this.ERROR_TA_NOT_FOUND);
    }

    if (tugasAkhir.status !== StatusTugasAkhir.DIAJUKAN) {
      throw new Error(
        `Tugas Akhir dengan status "${tugasAkhir.status}" tidak dapat ditolak.`,
      );
    }

    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: rejecterId },
    });

    if (dosen === null) {
      throw new Error(this.ERROR_DOSEN_NOT_FOUND);
    }

    const isPembimbing = tugasAkhir.peranDosenTa.some(
      (peran) =>
        peran.dosen_id === dosen.id &&
        (peran.peran === 'pembimbing1' || peran.peran === 'pembimbing2'),
    );

    if (!isPembimbing) {
      throw new Error(
        'Hanya pembimbing yang dapat menolak judul tugas akhir ini.',
      );
    }

    const rejected = await this.prisma.tugasAkhir.update({
      where: { id: tugasAkhirId },
      data: {
        status: StatusTugasAkhir.DITOLAK,
        ditolak_oleh: rejecterId,
        alasan_penolakan: alasanPenolakan,
      },
      include: {
        mahasiswa: {
          include: {
            user: true,
          },
        },
        rejecter: true,
      },
    });

    await this.logActivity(
      rejecterId,
      `Menolak Tugas Akhir mahasiswa ${rejected.mahasiswa.nim}: "${rejected.judul}"`,
    );

    return rejected;
  }

  async getPendingForDosen(dosenId: number): Promise<TugasAkhir[]> {
    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: dosenId },
    });

    if (dosen === null) {
      throw new Error(this.ERROR_DOSEN_NOT_FOUND);
    }

    return this.prisma.tugasAkhir.findMany({
      where: {
        status: StatusTugasAkhir.DIAJUKAN,
        peranDosenTa: {
          some: {
            dosen_id: dosen.id,
            peran: {
              in: ['pembimbing1', 'pembimbing2'],
            },
          },
        },
      },
      include: {
        mahasiswa: {
          include: {
            user: true,
          },
        },
        peranDosenTa: {
          include: {
            dosen: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggal_pengajuan: 'asc',
      },
    });
  }

  async updateJudul(userId: number, judulBaru: string): Promise<TugasAkhir> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: { tugasAkhir: true },
    });

    if (mahasiswa?.tugasAkhir === undefined) {
      throw new Error(this.ERROR_TA_NOT_FOUND);
    }

    const { tugasAkhir } = mahasiswa;

    const existingTitle = await this.prisma.tugasAkhir.findFirst({
      where: {
        judul: { equals: judulBaru },
        NOT: { id: tugasAkhir.id },
      },
    });

    if (existingTitle !== null) {
      throw new Error(`Judul "${judulBaru}" sudah pernah diajukan.`);
    }

    const updated = await this.prisma.tugasAkhir.update({
      where: { id: tugasAkhir.id },
      data: {
        judul: judulBaru,
        status: StatusTugasAkhir.DIAJUKAN,
        disetujui_oleh: null,
        ditolak_oleh: null,
        alasan_penolakan: null,
        tanggal_pengajuan: new Date(),
      },
    });

    await this.logActivity(
      userId,
      `Mengubah judul Tugas Akhir menjadi: "${judulBaru}"`,
    );

    return updated;
  }
}
