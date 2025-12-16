import type { Pengumuman, KategoriPengumuman } from '@repo/db';
import { PrismaClient, AudiensPengumuman, PrioritasPengumuman } from '@repo/db';
import type {
  CreatePengumumanDto,
  UpdatePengumumanDto,
} from '../dto/pengumuman.dto';
import { whatsappService } from './waha-whatsapp.service';

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

    const pengumuman = await this.prisma.pengumuman.create({
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
        pembuat: {
          select: { name: true },
        },
      },
    });

    console.log(`📢 Pengumuman created: ${pengumuman.judul}`);
    console.log(`👥 Audiens: ${pengumuman.audiens}`);

    // Kirim notifikasi WhatsApp ke semua user (kecuali mahasiswa lulus)
    setImmediate(() => {
      this.sendPengumumanNotification(pengumuman).catch((err) =>
        console.error('❌ Failed to send pengumuman notification:', err),
      );
    });

    return pengumuman;
  }

  private async sendPengumumanNotification(
    pengumuman: Pengumuman & { pembuat?: { name: string } },
  ): Promise<void> {
    try {
      // Ambil periode aktif
      const periodeAktif = await this.prisma.periodeTa.findFirst({
        where: { status: 'AKTIF' },
      });

      if (!periodeAktif) {
        console.log('⚠️  No active period, skipping notification');
        return;
      }

      console.log(`📅 Active period: ${periodeAktif.nama} (${periodeAktif.tahun})`);

      // Build where clause berdasarkan audiens
      const whereClause: any = {};

      if (pengumuman.audiens === AudiensPengumuman.mahasiswa) {
        whereClause.mahasiswa = { isNot: null };
      } else if (pengumuman.audiens === AudiensPengumuman.dosen) {
        whereClause.dosen = { isNot: null };
      } else if (pengumuman.audiens === AudiensPengumuman.registered_users) {
        whereClause.OR = [
          { mahasiswa: { isNot: null } },
          { dosen: { isNot: null } },
        ];
      } else if (pengumuman.audiens === AudiensPengumuman.all_users) {
        whereClause.OR = [
          { mahasiswa: { isNot: null } },
          { dosen: { isNot: null } },
        ];
      }

      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          mahasiswa: {
            include: {
              tugasAkhir: true,
            },
          },
          dosen: true,
        },
      });

      console.log(`👥 Found ${users.length} users`);

      // Filter: punya nomor telepon, mahasiswa belum lulus, dan aktif di periode
      const recipients = users.filter((user) => {
        if (!user.phone_number) return false;
        
        // Jika mahasiswa, cek status lulus dan periode aktif
        if (user.mahasiswa) {
          if (user.mahasiswa.status_kelulusan === 'LULUS') return false;
          if (!user.mahasiswa.tugasAkhir) return false;
          if (user.mahasiswa.tugasAkhir.periode_ta_id !== periodeAktif.id) return false;
        }
        
        return true;
      });

      console.log(`📱 ${recipients.length} recipients (with phone, active period, not graduated)`);
      console.log('📋 Recipients list:');
      recipients.forEach((user) => {
        const role = user.mahasiswa ? 'Mahasiswa' : user.dosen ? 'Dosen' : 'Admin';
        console.log(`   ✉️  ${user.name} (${role}) - ${user.phone_number}`);
      });

      if (recipients.length === 0) {
        console.log('⚠️  No recipients to send');
        return;
      }

      // Kirim notifikasi dengan delay lebih lama untuk menghindari spam detection
      const message = `📢 *Pengumuman Baru*\n\n*${pengumuman.judul}*\n\n${pengumuman.isi}\n\n_Diumumkan oleh: ${pengumuman.pembuat?.name ?? 'Admin'}_`;

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < recipients.length; i++) {
        const user = recipients[i];
        try {
          const sent = await whatsappService.sendMessage(user.phone_number, message);
          if (sent) {
            successCount++;
            console.log(`✅ [${i + 1}/${recipients.length}] Sent to ${user.name}`);
          } else {
            failedCount++;
            console.log(`⚠️ [${i + 1}/${recipients.length}] Skipped ${user.name} (WA not ready)`);
          }
          // Delay 5 detik antar pesan untuk menghindari spam detection
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (err) {
          failedCount++;
          console.error(`❌ [${i + 1}/${recipients.length}] Failed to send to ${user.name}:`, err);
        }
      }

      console.log(`✅ Pengumuman notification completed: ${successCount} sent, ${failedCount} failed`);


    } catch (error) {
      console.error('❌ Error sending pengumuman notification:', error);
    }
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
