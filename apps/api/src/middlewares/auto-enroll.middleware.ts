import { Request, Response, NextFunction } from 'express';
import { PeriodeService } from '../services/periode.service';

const periodeService = new PeriodeService();

export const autoEnrollMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await periodeService.autoEnrollUserToPeriode(userId);
    }
  } catch (error) {
    console.error('Auto-enroll error:', error);
    // Don't block the request if auto-enroll fails
  }
  next();
};