import prisma from '../config/database';
import { StatusPenjadwalanSidang } from '@prisma/client';

export class PenjadwalanSidangService {
  async getPengaturan() {
    const pengaturan = await prisma.penjadwalanSidang.findFirst({
      orderBy: { created_at: 'desc' },
    });

    if (!pengaturan) {
      return {
        status: StatusPenjadwalanSidang.BELUM_DIJADWALKAN,
        tanggal_generate: null,
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
      console.log('[PENJADWALAN] ⏰ Waktu generate tercapai, trigger generate otomatis...');
      this.triggerAutoGenerate().catch(err => {
        console.error('[PENJADWALAN] ❌ Error auto generate:', err);
      });
      
      return updated;
    }

    return pengaturan;
  }

  private async triggerAutoGenerate() {
    try {
      const { JadwalSidangService } = await import('./jadwal-sidang.service');
      const { RuanganSyncService } = await import('./ruangan-sync.service');
      
      const jadwalService = new JadwalSidangService();
      const ruanganSync = new RuanganSyncService();
      
      console.log('[PENJADWALAN] 🔄 Syncing ruangan...');
      await ruanganSync.syncRuanganFromPengaturan();
      
      console.log('[PENJADWALAN] 🚀 Generating jadwal...');
      const result = await jadwalService.generateJadwalOtomatis();
      
      console.log('[PENJADWALAN] ✅ Auto generate completed:', result.length, 'mahasiswa');
    } catch (error) {
      console.error('[PENJADWALAN] ❌ Auto generate failed:', error);
      throw error;
    }
  }

  async aturJadwal(tanggal_generate: string, user_id: number) {
    const targetDate = new Date(tanggal_generate);

    if (targetDate <= new Date()) {
      throw new Error('Tanggal generate harus di masa depan');
    }

    // Cek apakah sudah ada pengaturan
    const existing = await prisma.penjadwalanSidang.findFirst({
      where: {
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
        tanggal_generate: targetDate,
        status: StatusPenjadwalanSidang.DIJADWALKAN,
        dibuat_oleh: user_id,
      },
    });
  }

  async batalkan() {
    const pengaturan = await prisma.penjadwalanSidang.findFirst({
      where: { status: StatusPenjadwalanSidang.DIJADWALKAN },
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

  async getStatus() {
    const pengaturan = await this.getPengaturan();

    return {
      isGenerated: pengaturan.status === StatusPenjadwalanSidang.SELESAI,
      tanggalGenerate: pengaturan.tanggal_generate,
      status: pengaturan.status,
    };
  }
}
