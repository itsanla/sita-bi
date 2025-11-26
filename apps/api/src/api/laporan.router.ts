import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { LaporanService } from '../services/laporan.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '@repo/types';

const router: Router = Router();
const laporanService = new LaporanService();

// Apply authentication globally
router.use(authMiddleware);

router.get(
  '/statistik',
  authorizeRoles([Role.admin]),
  asyncHandler(async (_req, res) => {
    const statistik = await laporanService.getStatistik();
    res.status(200).json({ status: 'success', data: statistik });
  }),
);

export default router;
