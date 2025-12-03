import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { DataDiriService } from '../services/data-diri.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateDataDiriSchema } from '../dto/data-diri.dto';

/**
 * Router untuk mengelola data diri user (mahasiswa, dosen, admin)
 * Endpoints:
 * - GET /api/data-diri - Mendapatkan data diri user yang sedang login
 * - PATCH /api/data-diri - Update data diri user
 */
const router: Router = Router();
const dataDiriService = new DataDiriService();

router.use(asyncHandler(authMiddleware));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const dataDiri = await dataDiriService.getDataDiri(userId);
    res.status(200).json({ status: 'sukses', data: dataDiri });
  }),
);

router.patch(
  '/',
  validate(updateDataDiriSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const updatedDataDiri = await dataDiriService.updateDataDiri(
      userId,
      req.body,
    );
    res.status(200).json({ status: 'sukses', data: updatedDataDiri });
  }),
);

export default router;
