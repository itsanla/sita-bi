import type { Request, Response, NextFunction } from 'express';
import { PeriodeService } from '../services/periode.service';

let periodeServiceInstance: PeriodeService | null = null;

const getPeriodeService = (): PeriodeService => {
  if (!periodeServiceInstance) {
    periodeServiceInstance = new PeriodeService();
  }
  return periodeServiceInstance;
};

export const autoEnrollMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const periodeService = getPeriodeService();
    const userId = req.user?.id;
    if (userId != null) {
      await periodeService.autoEnrollUserToPeriode(userId);
    }
  } catch (error) {
    console.error('Auto-enroll error:', error);
  }
  next();
};
