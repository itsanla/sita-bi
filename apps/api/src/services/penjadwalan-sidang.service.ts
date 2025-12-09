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
      return updated;
    }

    return pengaturan;
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
