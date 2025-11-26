import cron from 'node-cron';
import { PrismaClient, StatusTugasAkhir } from '@repo/db';
import { EmailService } from './email.service';
import type { WhatsappService } from './whatsapp.service';
import { whatsappService } from './whatsapp.service';

export class SchedulerService {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private waService: WhatsappService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.waService = whatsappService;
  }

  init(): void {
    cron.schedule('0 7 * * *', () => {
      this.runDailyReminders().catch((err: unknown) => {
        console.error('Error in daily reminders:', err);
      });
    });
  }

  async runDailyReminders(): Promise<void> {
    await this.reminderSidangH3();
    await this.reminderDeadlineRevisiH7();
    await this.reminderBatasDaftarSidangH1();
    await this.reminderBimbinganPending();
    await this.reminderMahasiswaHampirSyarat();
  }

  async reminderSidangH3(): Promise<void> {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const startOfDay = new Date(threeDaysFromNow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(threeDaysFromNow.setHours(23, 59, 59, 999));

    const jadwals = await this.prisma.jadwalSidang.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        ruangan: true,
        sidang: {
          include: {
            tugasAkhir: {
              include: { mahasiswa: { include: { user: true } } },
            },
          },
        },
      },
    });

    for (const j of jadwals) {
      const mhs = j.sidang.tugasAkhir.mahasiswa.user;
      const msg = `Reminder: Sidang TA anda 3 hari lagi.\nTanggal: ${j.tanggal.toDateString()}\nWaktu: ${j.waktu_mulai}\nRuangan: ${j.ruangan.nama_ruangan}`;

      await this.emailService.sendEmail(mhs.email, 'Reminder Sidang H-3', msg);
      const waStatus = this.waService.getStatus();
      if (waStatus.isReady === true) {
        try {
          await this.waService.sendMessage(mhs.phone_number, msg);
        } catch (e: unknown) {
          console.warn('Failed to send WA reminder:', e);
        }
      }
    }
  }

  async reminderDeadlineRevisiH7(): Promise<void> {
    // Assumption: We need a field 'deadline_revisi' or calculate from sidang date + allowed days
    // For now, let's assume standard is 30 days after Lulus Dengan Revisi?
    // Or if we check status LULUS_DENGAN_REVISI and updated_at was 23 days ago (30-7).

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 23);
    // If max time is 30 days, then 23 days passed means 7 days left.

    // This logic is approximate without specific deadline field.
    // Ideally adding `deadline_revisi` to TugasAkhir or Sidang is better.
    // I'll stick to generic logic or skip if too complex without schema change.
    // Let's assume 1 month deadline.

    const tAs = await this.prisma.tugasAkhir.findMany({
      where: {
        status: StatusTugasAkhir.LULUS_DENGAN_REVISI,
        updated_at: {
          lte: sevenDaysAgo, // updated more than 23 days ago
        },
      },
      include: { mahasiswa: { include: { user: true } } },
    });

    for (const ta of tAs) {
      // Check if actually nearing 30 days (simplified)
      const daysPassed = Math.floor(
        (Date.now() - ta.updated_at.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysPassed === 23) {
        const mhs = ta.mahasiswa.user;
        const msg = `Reminder: Deadline revisi anda tinggal 7 hari lagi. Segera upload dokumen revisi.`;
        await this.emailService.sendEmail(
          mhs.email,
          'Reminder Deadline Revisi',
          msg,
        );
      }
    }
  }

  async reminderBatasDaftarSidangH1(): Promise<void> {
    // This usually depends on Academic Calendar. Since we don't have Calendar table, skipping logic or placeholder.
  }

  async reminderBimbinganPending(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pending = await this.prisma.pengajuanBimbingan.findMany({
      where: {
        status: 'MENUNGGU_PERSETUJUAN_DOSEN',
        created_at: { lte: sevenDaysAgo },
      },
      include: { dosen: { include: { user: true } } },
    });

    const dosenMap = new Map<number, { email: string; count: number }>();
    for (const p of pending) {
      const did = p.dosen.id;
      if (!dosenMap.has(did)) {
        dosenMap.set(did, { email: p.dosen.user.email, count: 0 });
      }
      const dosenData = dosenMap.get(did);
      if (dosenData !== undefined) {
        dosenData.count++;
      }
    }

    for (const [, data] of dosenMap) {
      await this.emailService.sendEmail(
        data.email,
        'Reminder Pengajuan Bimbingan Pending',
        `Anda memiliki ${data.count} pengajuan bimbingan yang pending lebih dari 7 hari.`,
      );
    }
  }

  async reminderMahasiswaHampirSyarat(): Promise<void> {
    // Find students with 8 confirmed bimbingan
    // This requires grouping or counting.
    const students = await this.prisma.mahasiswa.findMany({
      where: {
        tugasAkhir: {
          status: { not: StatusTugasAkhir.SELESAI }, // Only active
        },
      },
      include: {
        tugasAkhir: {
          include: {
            bimbinganTa: {
              where: { is_konfirmasi: true },
            },
          },
        },
        user: true,
      },
    });

    for (const s of students) {
      if (s.tugasAkhir !== null && s.tugasAkhir.bimbinganTa.length === 8) {
        await this.emailService.sendEmail(
          s.user.email,
          'Semangat! Sedikit Lagi Sidang',
          'Anda sudah menyelesaikan 8 bimbingan terkonfirmasi. 1 sesi lagi anda bisa mendaftar sidang!',
        );
      }
    }
  }
}
