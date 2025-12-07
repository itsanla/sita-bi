import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { insecureAuthMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { BadRequestError } from '../errors/AppError';
import { DokumenTAService } from '../services/dokumen-ta.service';
import { UploadService } from '../services/upload.service';
import { periodeGuard } from '../middlewares/periode.middleware';

const router: Router = Router();
const dokumenService = new DokumenTAService();
const uploadService = new UploadService();

router.use(asyncHandler(insecureAuthMiddleware));

router.post(
  '/:tugasAkhirId/upload',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (typeof tugasAkhirId !== 'string' || tugasAkhirId === '') {
      throw new BadRequestError('ID Tugas Akhir diperlukan');
    }

    const uploadResult = await uploadService.handleDirectUpload(
      req,
      'dokumen-ta',
    );

    const result = await dokumenService.uploadDokumen(
      parseInt(tugasAkhirId, 10),
      uploadResult.filePath,
    );

    res.status(201).json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/:dokumenId/validasi',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError('ID pengguna tidak ditemukan');
    }

    const { dokumenId } = req.params;
    if (typeof dokumenId !== 'string' || dokumenId === '') {
      throw new BadRequestError('ID Dokumen diperlukan');
    }

    const result = await dokumenService.validasiDokumen(
      parseInt(dokumenId, 10),
      userId,
    );

    res.status(200).json({
      status: 'sukses',
      message: 'Dokumen berhasil divalidasi',
      data: result,
    });
  }),
);

router.post(
  '/:dokumenId/batalkan-validasi',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError('ID pengguna tidak ditemukan');
    }

    const { dokumenId } = req.params;
    if (typeof dokumenId !== 'string' || dokumenId === '') {
      throw new BadRequestError('ID Dokumen diperlukan');
    }

    const result = await dokumenService.batalkanValidasiDokumen(
      parseInt(dokumenId, 10),
      userId,
    );

    res.status(200).json({
      status: 'sukses',
      message: 'Validasi dokumen berhasil dibatalkan',
      data: result,
    });
  }),
);

export default router;
