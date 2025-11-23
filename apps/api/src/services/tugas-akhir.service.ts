import type { TugasAkhir } from '@repo/db';
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
  // private readonly SIMILARITY_THRESHOLD = 80; // Unused for now // 80%

  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkSimilarity(
    judul: string,
  ): Promise<{ id: number; judul: string; similarity: number }[]> {
    const allTitles = await this.prisma.tugasAkhir.findMany({
      select: { id: true, judul: true },
    });

    if (allTitles.length === 0) {
      return [];
    }

    const similarities = await calculateSimilarities(judul, allTitles);

    // Return top 5 results or any result above 50%
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

    return this.prisma.tugasAkhir.create({
      data: {
        judul: dto.judul,
        mahasiswa_id: mahasiswa.id,
        status: StatusTugasAkhir.DIAJUKAN,
        tanggal_pengajuan: new Date(),
      },
    });
  }

  async findMyTugasAkhir(userId: number): Promise<TugasAkhir | null> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
    });

    if (mahasiswa === null) {
      throw new Error('Profil mahasiswa tidak ditemukan.');
    }

    return this.prisma.tugasAkhir.findFirst({
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
  }

  async deleteMyTa(userId: number): Promise<TugasAkhir> {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { user_id: userId },
      include: { tugasAkhir: true },
    });

    if (mahasiswa?.tugasAkhir == null) {
      throw new Error('Tugas Akhir not found for this student.');
    }

    const { tugasAkhir } = mahasiswa;

    if (
      tugasAkhir.status !== StatusTugasAkhir.DIAJUKAN &&
      tugasAkhir.status !== StatusTugasAkhir.DITOLAK
    ) {
      throw new Error(
        `Cannot delete submission with status "${tugasAkhir.status}".`,
      );
    }

    return this.prisma.tugasAkhir.delete({
      where: { id: tugasAkhir.id },
    });
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

  /**
   * Approve tugas akhir by pembimbing
   * Only pembimbing can approve their student's TA
   */
  async approve(tugasAkhirId: number, approverId: number): Promise<TugasAkhir> {
    // Check if tugas akhir exists
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

    if (!tugasAkhir) {
      throw new Error('Tugas Akhir tidak ditemukan.');
    }

    // Check if already approved or not in DIAJUKAN status
    if (tugasAkhir.status !== StatusTugasAkhir.DIAJUKAN) {
      throw new Error(
        `Tugas Akhir dengan status "${tugasAkhir.status}" tidak dapat disetujui.`,
      );
    }

    // Get dosen from approver userId
    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: approverId },
    });

    if (!dosen) {
      throw new Error('Profil dosen tidak ditemukan.');
    }

    // Check if this dosen is pembimbing1 or pembimbing2
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

    // Approve the tugas akhir
    return this.prisma.tugasAkhir.update({
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
  }

  /**
   * Reject tugas akhir by pembimbing
   */
  async reject(
    tugasAkhirId: number,
    rejecterId: number,
    alasanPenolakan: string,
  ): Promise<TugasAkhir> {
    // Check if tugas akhir exists
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

    if (!tugasAkhir) {
      throw new Error('Tugas Akhir tidak ditemukan.');
    }

    // Check if in DIAJUKAN status
    if (tugasAkhir.status !== StatusTugasAkhir.DIAJUKAN) {
      throw new Error(
        `Tugas Akhir dengan status "${tugasAkhir.status}" tidak dapat ditolak.`,
      );
    }

    // Get dosen from rejecter userId
    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: rejecterId },
    });

    if (!dosen) {
      throw new Error('Profil dosen tidak ditemukan.');
    }

    // Check if this dosen is pembimbing
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

    // Reject the tugas akhir
    return this.prisma.tugasAkhir.update({
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
  }

  /**
   * Get all pending tugas akhir for dosen to approve/reject
   */
  async getPendingForDosen(dosenId: number): Promise<TugasAkhir[]> {
    const dosen = await this.prisma.dosen.findUnique({
      where: { user_id: dosenId },
    });

    if (!dosen) {
      throw new Error('Profil dosen tidak ditemukan.');
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
  // NOTE: The old `cekKemiripan` method is now removed.
}
