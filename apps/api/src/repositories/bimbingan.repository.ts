import type { PrismaClient } from '@repo/db';
import { type Prisma, StatusTugasAkhir } from '@repo/db';

export class BimbinganRepository {
  constructor(private prisma: PrismaClient) {}

  async findTugasAkhirForDosen(
    dosenId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: unknown[];
    total: number;
  }> {
    const whereClause: Prisma.TugasAkhirWhereInput = {
      peranDosenTa: {
        some: {
          dosen_id: dosenId,
          peran: { in: ['pembimbing1', 'pembimbing2'] },
        },
      },
      NOT: {
        status: {
          in: [
            StatusTugasAkhir.DIBATALKAN,
            StatusTugasAkhir.LULUS_DENGAN_REVISI,
            StatusTugasAkhir.LULUS_TANPA_REVISI,
            StatusTugasAkhir.SELESAI,
            StatusTugasAkhir.DITOLAK,
          ],
        },
      },
    };

    const [total, data] = await Promise.all([
      this.prisma.tugasAkhir.count({ where: whereClause }),
      this.prisma.tugasAkhir.findMany({
        where: whereClause,
        include: {
          mahasiswa: { include: { user: true } },
          peranDosenTa: { include: { dosen: { include: { user: true } } } },
          bimbinganTa: {
            include: {
              catatan: { include: { author: true } },
              lampiran: true,
            },
            orderBy: { sesi_ke: 'asc' },
          },
          dokumenTa: {
            where: { tipe_dokumen: 'bimbingan' },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { data, total };
  }

  async findTugasAkhirForMahasiswa(
    mahasiswaId: number,
  ): Promise<unknown | null> {
    return this.prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        NOT: {
          status: {
            in: [
              StatusTugasAkhir.DIBATALKAN,
              StatusTugasAkhir.LULUS_DENGAN_REVISI,
              StatusTugasAkhir.LULUS_TANPA_REVISI,
              StatusTugasAkhir.SELESAI,
              StatusTugasAkhir.DITOLAK,
            ],
          },
        },
      },
      include: {
        peranDosenTa: { include: { dosen: { include: { user: true } } } },
        bimbinganTa: {
          include: {
            catatan: { include: { author: true } },
            historyPerubahan: true,
            lampiran: true,
            dosen: { include: { user: true } },
          },
          orderBy: { sesi_ke: 'asc' },
        },
        pendaftaranSidang: { orderBy: { created_at: 'desc' } },
        dokumenTa: {
          where: { tipe_dokumen: 'bimbingan' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findBimbinganById(id: number): Promise<unknown | null> {
    return this.prisma.bimbinganTA.findUnique({
      where: { id },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
            peranDosenTa: true,
          },
        },
      },
    });
  }

  async findBimbinganByIdAndDosen(
    id: number,
    dosenId: number,
  ): Promise<unknown | null> {
    return this.prisma.bimbinganTA.findFirst({
      where: { id, dosen_id: dosenId },
      include: { tugasAkhir: true },
    });
  }

  async createCatatan(
    bimbinganTaId: number,
    authorId: number,
    catatan: string,
  ): Promise<unknown> {
    return this.prisma.catatanBimbingan.create({
      data: {
        bimbingan_ta_id: bimbinganTaId,
        author_id: authorId,
        catatan,
        author_type: 'user',
      },
    });
  }

  async findBimbinganConflicts(
    dosenId: number,
    tanggal: Date,
  ): Promise<unknown[]> {
    return this.prisma.bimbinganTA.findMany({
      where: {
        dosen_id: dosenId,
        tanggal_bimbingan: tanggal,
        status_bimbingan: 'dijadwalkan',
      },
    });
  }

  async findSidangConflicts(
    dosenId: number,
    tanggal: Date,
  ): Promise<unknown[]> {
    return this.prisma.jadwalSidang.findMany({
      where: {
        tanggal,
        sidang: {
          tugasAkhir: {
            peranDosenTa: {
              some: { dosen_id: dosenId },
            },
          },
        },
      },
    });
  }

  async findPeranDosenTa(
    tugasAkhirId: number,
    dosenId: number,
  ): Promise<unknown | null> {
    return this.prisma.peranDosenTa.findFirst({
      where: { tugas_akhir_id: tugasAkhirId, dosen_id: dosenId },
      include: {
        tugasAkhir: {
          include: { mahasiswa: true },
        },
      },
    });
  }

  async createBimbingan(data: {
    tugas_akhir_id: number;
    dosen_id: number;
    peran: string;
    tanggal_bimbingan: Date;
    jam_bimbingan: string;
    sesi_ke?: number;
  }): Promise<unknown> {
    const sesiKe = data.sesi_ke ?? (await this.countBimbinganByTugasAkhir(data.tugas_akhir_id)) + 1;
    return this.prisma.bimbinganTA.create({
      data: {
        ...data,
        sesi_ke: sesiKe,
        status_bimbingan: 'dijadwalkan',
      },
    });
  }

  async updateBimbinganStatus(id: number, status: string): Promise<unknown> {
    return this.prisma.bimbinganTA.update({
      where: { id },
      data: {
        status_bimbingan: status as 'dibatalkan' | 'dijadwalkan' | 'selesai',
      },
    });
  }

  async konfirmasiBimbingan(id: number): Promise<unknown> {
    return this.prisma.bimbinganTA.update({
      where: { id },
      data: {
        is_konfirmasi: true,
        konfirmasi_at: new Date(),
      },
    });
  }

  async createLampiran(data: {
    bimbingan_ta_id: number;
    file_path: string;
    file_name: string;
    file_type: string;
  }): Promise<unknown> {
    return this.prisma.bimbinganLampiran.create({ data });
  }

  async findLatestDokumenTa(tugasAkhirId: number): Promise<unknown | null> {
    return this.prisma.dokumenTa.findFirst({
      where: { tugas_akhir_id: tugasAkhirId },
      orderBy: { version: 'desc' },
    });
  }

  async updateDokumenTa(
    id: number,
    data: Prisma.DokumenTaUpdateInput,
  ): Promise<unknown> {
    return this.prisma.dokumenTa.update({
      where: { id },
      data,
    });
  }

  async findDosenByUserId(userId: number): Promise<unknown | null> {
    return this.prisma.dosen.findUnique({
      where: { user_id: userId },
    });
  }

  async createLog(data: {
    user_id: number;
    action: string;
    url?: string;
    method?: string;
  }): Promise<unknown> {
    return this.prisma.log.create({
      data: {
        user_id: data.user_id,
        action: data.action,
        url: data.url ?? null,
        method: data.method ?? null,
        ip_address: '127.0.0.1',
        user_agent: 'System',
      },
    });
  }

  async createEmptySesi(
    tugasAkhirId: number,
    dosenId: number,
    peran: string,
    sesiKe: number,
  ): Promise<unknown> {
    return this.prisma.bimbinganTA.create({
      data: {
        tugas_akhir_id: tugasAkhirId,
        dosen_id: dosenId,
        peran,
        sesi_ke: sesiKe,
        status_bimbingan: 'dijadwalkan',
      },
    });
  }

  async countBimbinganByTugasAkhir(tugasAkhirId: number): Promise<number> {
    return this.prisma.bimbinganTA.count({
      where: { tugas_akhir_id: tugasAkhirId },
    });
  }

  async countValidBimbingan(tugasAkhirId: number): Promise<number> {
    return this.prisma.bimbinganTA.count({
      where: {
        tugas_akhir_id: tugasAkhirId,
        status_bimbingan: 'selesai',
      },
    });
  }

  async deleteBimbinganSesi(id: number): Promise<unknown> {
    return this.prisma.bimbinganTA.delete({
      where: { id },
    });
  }

  async updateJadwalBimbingan(
    id: number,
    tanggal: Date,
    jamMulai: string,
    jamSelesai?: string,
  ): Promise<unknown> {
    return this.prisma.bimbinganTA.update({
      where: { id },
      data: {
        tanggal_bimbingan: tanggal,
        jam_bimbingan: jamMulai,
        jam_selesai: jamSelesai,
        status_bimbingan: 'dijadwalkan',
      },
    });
  }

  async findBimbinganWithAccess(
    id: number,
    userId: number,
  ): Promise<unknown | null> {
    return this.prisma.bimbinganTA.findFirst({
      where: {
        id,
        OR: [
          { dosen: { user_id: userId } },
          { tugasAkhir: { mahasiswa: { user_id: userId } } },
        ],
      },
      include: {
        tugasAkhir: {
          include: {
            mahasiswa: { include: { user: true } },
            peranDosenTa: { include: { dosen: true } },
          },
        },
        dosen: { include: { user: true } },
      },
    });
  }
}
