import cron from 'node-cron';
import { PeriodeService } from '../services/periode.service';
import prisma from '../config/database';

const periodeService = new PeriodeService();

export function startPeriodeCronJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const periodesToOpen = await prisma.periodeTa.findMany({
        where: {
          status: 'PERSIAPAN',
          tanggal_buka: { lte: now },
        },
      });

      for (const periode of periodesToOpen) {
        try {
          await periodeService.bukaSekarang(periode.id);
          console.warn(
            `[CRON] Periode ${periode.tahun} berhasil dibuka otomatis`,
          );
        } catch (error) {
          console.error(
            `[CRON] Gagal membuka periode ${periode.tahun}:`,
            error,
          );
        }
      }
    } catch (error) {
      console.error('[CRON] Error checking scheduled periods:', error);
    }
  });

  console.warn('[CRON] Periode auto-open job started');
}
