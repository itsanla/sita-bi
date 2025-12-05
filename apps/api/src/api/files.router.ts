import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import asyncHandler from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { NotFoundError } from '../errors/AppError';

const router: Router = Router();

router.use(asyncHandler(authMiddleware));

// Serve dokumen TA files
router.get(
  '/dokumen-ta/:filename',
  asyncHandler(async (req, res): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'dokumen-ta',
      filename,
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('File tidak ditemukan');
    }

    res.sendFile(filePath);
  }),
);

// Serve lampiran bimbingan files
router.get(
  '/lampiran/:filename',
  asyncHandler(async (req, res): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'lampiran', filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError('File tidak ditemukan');
    }

    res.sendFile(filePath);
  }),
);

export default router;
