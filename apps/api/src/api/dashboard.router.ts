import { Router, type Request, type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
import { DashboardService } from '../services/dashboard.service';
import {
  getMahasiswaActivitiesQuerySchema,
  getMahasiswaScheduleQuerySchema,
} from '../dto/dashboard.dto';

const router: Router = Router();
const dashboardService = new DashboardService();

/**
 * GET /api/dashboard/mahasiswa/stats
 * Get dashboard statistics for logged-in mahasiswa
 */
router.get(
  '/mahasiswa/stats',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }

    const stats = await dashboardService.getMahasiswaStats(userId);
    response.status(200).json({ status: 'sukses', data: stats });
  }),
);

/**
 * GET /api/dashboard/mahasiswa/activities
 * Get recent activities for logged-in mahasiswa
 */
router.get(
  '/mahasiswa/activities',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  validate(getMahasiswaActivitiesQuerySchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }

    const limit = req.query['limit']
      ? parseInt(req.query['limit'] as string, 10)
      : 10;
    const activities = await dashboardService.getMahasiswaActivities(
      userId,
      limit,
    );
    response.status(200).json({ status: 'sukses', data: activities });
  }),
);

/**
 * GET /api/dashboard/mahasiswa/schedule
 * Get upcoming schedule for logged-in mahasiswa
 */
router.get(
  '/mahasiswa/schedule',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  validate(getMahasiswaScheduleQuerySchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }

    const limit = req.query['limit']
      ? parseInt(req.query['limit'] as string, 10)
      : 5;
    const schedule = await dashboardService.getMahasiswaSchedule(userId, limit);
    response.status(200).json({ status: 'sukses', data: schedule });
  }),
);

/**
 * GET /api/dashboard/mahasiswa/progress
 * Get progress data for logged-in mahasiswa
 */
router.get(
  '/mahasiswa/progress',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }

    const progress = await dashboardService.getMahasiswaProgress(userId);
    response.status(200).json({ status: 'sukses', data: progress });
  }),
);

/**
 * GET /api/dashboard/mahasiswa/system-stats
 * Get system-wide statistics (total dosen, mahasiswa, judul TA)
 */
router.get(
  '/mahasiswa/system-stats',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (_req: Request, response: Response): Promise<void> => {
    const stats = await dashboardService.getSystemStats();
    response.status(200).json({ status: 'sukses', data: stats });
  }),
);

export default router;
