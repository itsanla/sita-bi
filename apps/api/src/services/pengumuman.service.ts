import type { Pengumuman, KategoriPengumuman } from '@repo/db';
import { PrismaClient, AudiensPengumuman, PrioritasPengumuman } from '@repo/db';
import type {
  CreatePengumumanDto,
  UpdatePengumumanDto,
} from '../dto/pengumuman.dto';

export class PengumumanService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(
    dto: CreatePengumumanDto,
    authorId: number,
  ): Promise<Pengumuman> {
    // Explicitly type lampiran creation to avoid TS errors
    const lampiranData =
      dto.lampiran?.map((l) => ({
        file_path: l.file_path,
        file_name: l.file_name ?? null, // Convert undefined to null
        file_type: l.file_type ?? null, // Convert undefined to null
      })) ?? [];

    return this.prisma.pengumuman.create({
      data: {
        judul: dto.judul,
        isi: dto.isi,
        audiens: dto.audiens,
        dibuat_oleh: authorId,
        tanggal_dibuat: new Date(),
        is_published: dto.is_published ?? false,
        scheduled_at: dto.scheduled_at ?? null,
        prioritas: dto.prioritas ?? PrioritasPengumuman.MENENGAH,
        kategori: dto.kategori ?? null, // Fix undefined type issue here
        berakhir_pada: dto.berakhir_pada ?? null,
        lampiran: {
          create: lampiranData,
        },
      },
      include: {
        lampiran: true,
      },
    });
  }

  // Helper to build where clause for publishing logic (and now Expiration)
  private getPublishFilter(): object {
    const now = new Date();
    return {
      AND: [
        { is_published: true },
        {
          OR: [{ scheduled_at: null }, { scheduled_at: { lte: now } }],
        },
        // Expiration logic: Either null (forever) or not yet expired
        {
          OR: [{ berakhir_pada: null }, { berakhir_pada: { gt: now } }],
        },
      ],
    };
  }

  async findAll(
    page = 1,
    limit = 50,
  ): Promise<{
    data: Pengumuman[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const total = await this.prisma.pengumuman.count();
    const data = await this.prisma.pengumuman.findMany({
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        pembuat: {
          select: {
            name: true,
            roles: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: { pembaca: true },
        },
      },
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublic(
    page = 1,
    limit = 50,
    kategori?: KategoriPengumuman,
  ): Promise<{
    data: Pengumuman[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause: Record<string, unknown> = {
      AND: [
        {
          audiens: {
            in: [AudiensPengumuman.all_users, AudiensPengumuman.guest],
          },
        },
        this.getPublishFilter(),
      ],
    };

    if (kategori !== undefined) {
      (whereClause.AND as unknown[]).push({ kategori: kategori });
    }

    const total = await this.prisma.pengumuman.count({ where: whereClause });
    const data = await this.prisma.pengumuman.findMany({
      where: whereClause,
      orderBy: { scheduled_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lampiran: true,
        pembuat: { select: { name: true } },
      },
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForMahasiswa(
    page = 1,
    limit = 50,
    userId?: number,
    kategori?: KategoriPengumuman,
  ): Promise<{
    data: Pengumuman[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause: Record<string, unknown> = {
      AND: [
        {
          audiens: {
            in: [
              AudiensPengumuman.all_users,
              AudiensPengumuman.mahasiswa,
              AudiensPengumuman.registered_users,
            ],
          },
        },
        this.getPublishFilter(),
      ],
    };

    if (kategori !== undefined) {
      (whereClause.AND as unknown[]).push({ kategori: kategori });
    }

    const total = await this.prisma.pengumuman.count({ where: whereClause });
    const data = await this.prisma.pengumuman.findMany({
      where: whereClause,
      orderBy: [{ scheduled_at: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lampiran: true,
        pembuat: {
          select: {
            name: true,
            roles: {
              select: {
                name: true,
              },
            },
          },
        },
        pembaca: userId !== undefined ? { where: { user_id: userId } } : false,
      },
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForDosen(
    page = 1,
    limit = 50,
    userId?: number,
    kategori?: KategoriPengumuman,
  ): Promise<{
    data: Pengumuman[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const whereClause: Record<string, unknown> = {
      AND: [
        {
          audiens: {
            in: [
              AudiensPengumuman.all_users,
              AudiensPengumuman.registered_users,
              AudiensPengumuman.dosen,
            ],
          },
        },
        this.getPublishFilter(),
      ],
    };

    if (kategori !== undefined) {
      (whereClause.AND as unknown[]).push({ kategori: kategori });
    }

    const total = await this.prisma.pengumuman.count({ where: whereClause });
    const data = await this.prisma.pengumuman.findMany({
      where: whereClause,
      orderBy: { scheduled_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lampiran: true,
        pembuat: {
          select: {
            name: true,
            roles: {
              select: {
                name: true,
              },
            },
          },
        },
        pembaca: userId !== undefined ? { where: { user_id: userId } } : false,
      },
    });
    return {
      data: data,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Pengumuman | null> {
    return this.prisma.pengumuman.findUnique({
      where: { id },
      include: {
        lampiran: true,
        _count: { select: { pembaca: true } },
      },
    });
  }

  async markAsRead(pengumumanId: number, userId: number): Promise<void> {
    await this.prisma.pengumumanPembaca.upsert({
      where: {
        pengumuman_id_user_id: {
          pengumuman_id: pengumumanId,
          user_id: userId,
        },
      },
      update: {
        read_at: new Date(),
      },
      create: {
        pengumuman_id: pengumumanId,
        user_id: userId,
        read_at: new Date(),
      },
    });
  }

  async update(id: number, dto: UpdatePengumumanDto): Promise<Pengumuman> {
    const updateData: Record<string, unknown> = {};
    if (dto.judul !== undefined) updateData['judul'] = dto.judul;
    if (dto.isi !== undefined) updateData['isi'] = dto.isi;
    if (dto.audiens !== undefined) updateData['audiens'] = dto.audiens;
    if (dto.is_published !== undefined)
      updateData['is_published'] = dto.is_published;
    if (dto.scheduled_at !== undefined)
      updateData['scheduled_at'] = dto.scheduled_at;
    if (dto.prioritas !== undefined) updateData['prioritas'] = dto.prioritas;
    if (dto.kategori !== undefined) updateData['kategori'] = dto.kategori;
    if (dto.berakhir_pada !== undefined)
      updateData['berakhir_pada'] = dto.berakhir_pada;

    if (dto.lampiran) {
      // Logic to update attachments if needed
    }

    return this.prisma.pengumuman.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number): Promise<Pengumuman> {
    return this.prisma.pengumuman.delete({ where: { id } });
  }
}
