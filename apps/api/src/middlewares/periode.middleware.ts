import type { Request, Response, NextFunction } from 'express';
import { PeriodeService } from '../services/periode.service';
import { Role } from '../middlewares/auth.middleware';

const periodeService = new PeriodeService();

export const periodeGuard = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userRole = req.user?.role;
      const periodeIdHeader = req.headers['x-periode-id'];
      const periodeId =
        periodeIdHeader !== undefined
          ? parseInt(periodeIdHeader as string, 10)
          : undefined;

      if (periodeId !== undefined && !Number.isNaN(periodeId)) {
        const periode = await periodeService.getPeriodeById(periodeId);
        if (periode !== null) {
          req.periode = periode;
          next();
          return;
        }
      }

      const activePeriode = await periodeService.getActivePeriode();

      if (userRole === Role.jurusan || userRole === Role.admin) {
        if (activePeriode !== null) {
          req.periode = activePeriode;
        }
        next();
        return;
      }

      if (activePeriode === null) {
        res.status(403).json({
          status: 'gagal',
          message:
            'Tidak ada periode TA yang aktif saat ini. Hubungi Ketua Jurusan.',
          code: 'PERIODE_NOT_ACTIVE',
        });
        return;
      }

      if (activePeriode.status !== 'AKTIF') {
        res.status(403).json({
          status: 'gagal',
          message: `Periode TA ${activePeriode.tahun} tidak aktif. Status: ${activePeriode.status}`,
          code: 'PERIODE_NOT_ACTIVE',
        });
        return;
      }

      req.periode = activePeriode;
      next();
    } catch {
      res.status(500).json({
        status: 'gagal',
        message: 'Gagal memeriksa status periode',
      });
    }
  };
};
