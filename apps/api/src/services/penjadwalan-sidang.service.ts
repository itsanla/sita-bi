import prisma from '../config/database';
import { StatusPenjadwalanSidang } from '@prisma/client';

interface PengaturanPenjadwalan {
  status: StatusPenjadwalanSidang;
  tanggal_generate: Date | null;
  periode_ta_id?: number | null;
}

export class PenjadwalanSidangService {
  async getPengaturan(): Promise<PengaturanPenjadwalan> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    const pengaturan = await prisma.penjadwalanSidang.findFirst({
      where: { periode_ta_id: periodeAktif?.id },
      orderBy: { created_at: 'desc' },
    });

    if (!pengaturan) {
      return {
        status: StatusPenjadwalanSidang.BELUM_DIJADWALKAN,
        tanggal_generate: null,
        periode_ta_id: periodeAktif?.id,
      };
    }

    // Auto update status jika sudah lewat waktu generate
    if (
      pengaturan.status === StatusPenjadwalanSidang.DIJADWALKAN &&
      pengaturan.tanggal_generate &&
      new Date(pengaturan.tanggal_generate) <= new Date()
    ) {
      const updated = await prisma.penjadwalanSidang.update({
        where: { id: pengaturan.id },
        data: { status: StatusPenjadwalanSidang.SELESAI },
      });

      // Trigger generate otomatis
      console.warn(
        '[PENJADWALAN] ⏰ Waktu generate tercapai, trigger generate otomatis...',
      );
      this.triggerAutoGenerate().catch((err: unknown) => {
        console.error('[PENJADWALAN] ❌ Error auto generate:', err);
      });

      return updated;
    }

    return pengaturan;
  }

  private async triggerAutoGenerate(): Promise<void> {
    try {
      const { JadwalSidangService } = await import('./jadwal-sidang.service');
      const { RuanganSyncService } = await import('./ruangan-sync.service');

      const jadwalService = new JadwalSidangService();
      const ruanganSync = new RuanganSyncService();

      console.warn('[PENJADWALAN] 🔄 Syncing ruangan...');
      await ruanganSync.syncRuanganFromPengaturan();

      console.warn('[PENJADWALAN] 🚀 Generating jadwal...');
      const result = await jadwalService.generateJadwalOtomatis();

      console.warn(
        '[PENJADWALAN] ✅ Auto generate completed:',
        result.length,
        'mahasiswa',
      );
    } catch (error) {
      console.error('[PENJADWALAN] ❌ Auto generate failed:', error);
      throw error;
    }
  }

  async aturJadwal(
    tanggal_generate: string,
    user_id: number,
  ): Promise<{
    id: number;
    periode_ta_id: number | null;
    tanggal_generate: Date | null;
    status: StatusPenjadwalanSidang;
    dibuat_oleh: number | null;
    created_at: Date;
    updated_at: Date;
  }> {
    const targetDate = new Date(tanggal_generate);

    if (targetDate <= new Date()) {
      throw new Error('Tanggal generate harus di masa depan');
    }

    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    if (!periodeAktif) {
      throw new Error('Tidak ada periode aktif');
    }

    // Cek apakah sudah ada pengaturan untuk periode aktif
    const existing = await prisma.penjadwalanSidang.findFirst({
      where: {
        periode_ta_id: periodeAktif.id,
        status: {
          in: [
            StatusPenjadwalanSidang.DIJADWALKAN,
            StatusPenjadwalanSidang.SELESAI,
          ],
        },
      },
    });

    if (existing) {
      // Update existing
      return await prisma.penjadwalanSidang.update({
        where: { id: existing.id },
        data: {
          tanggal_generate: targetDate,
          status: StatusPenjadwalanSidang.DIJADWALKAN,
          dibuat_oleh: user_id,
        },
      });
    }

    // Create new
    return await prisma.penjadwalanSidang.create({
      data: {
        periode_ta_id: periodeAktif.id,
        tanggal_generate: targetDate,
        status: StatusPenjadwalanSidang.DIJADWALKAN,
        dibuat_oleh: user_id,
      },
    });
  }

  async batalkan(): Promise<{
    id: number;
    periode_ta_id: number | null;
    tanggal_generate: Date | null;
    status: StatusPenjadwalanSidang;
    dibuat_oleh: number | null;
    created_at: Date;
    updated_at: Date;
  }> {
    const periodeAktif = await prisma.periodeTa.findFirst({
      where: { status: 'AKTIF' },
    });

    const pengaturan = await prisma.penjadwalanSidang.findFirst({
      where: {
        periode_ta_id: periodeAktif?.id,
        status: StatusPenjadwalanSidang.DIJADWALKAN,
      },
    });

    if (!pengaturan) {
      throw new Error('Tidak ada jadwal yang aktif');
    }

    return await prisma.penjadwalanSidang.update({
      where: { id: pengaturan.id },
      data: {
        status: StatusPenjadwalanSidang.BELUM_DIJADWALKAN,
        tanggal_generate: null,
      },
    });
  }

  async getStatus(): Promise<{
    isGenerated: boolean;
    tanggalGenerate: Date | null;
    status: StatusPenjadwalanSidang;
  }> {
    const pengaturan = await this.getPengaturan();

    return {
      isGenerated: pengaturan.status === StatusPenjadwalanSidang.SELESAI,
      tanggalGenerate: pengaturan.tanggal_generate,
      status: pengaturan.status,
    };
  }
}
