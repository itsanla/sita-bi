import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { insecureAuthMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { UploadService } from '../services/upload.service';
import { BadRequestError } from '../errors/AppError';

const router: Router = Router();
const uploadService = new UploadService();

router.use(asyncHandler(insecureAuthMiddleware));

// Generate pre-signed upload URL
router.post(
  '/generate-url',
  authorizeRoles([Role.mahasiswa, Role.dosen, Role.admin]),
  asyncHandler(async (req, res): Promise<void> => {
    const { fileType, category } = req.body;

    if (typeof fileType !== 'string' || fileType === '') {
      throw new BadRequestError('File type diperlukan');
    }

    if (typeof category !== 'string' || category === '') {
      throw new BadRequestError('Category diperlukan');
    }

    const result = await uploadService.generateUploadUrl(fileType, category);

    res.status(200).json({
      status: 'sukses',
      data: result,
    });
  }),
);

// Direct upload endpoint (fallback)
router.post(
  '/direct',
  authorizeRoles([Role.mahasiswa, Role.dosen, Role.admin]),
  asyncHandler(async (req, res): Promise<void> => {
    const { category } = req.body;

    if (typeof category !== 'string' || category === '') {
      throw new BadRequestError('Category diperlukan');
    }

    const result = await uploadService.handleDirectUpload(req, category);

    res.status(201).json({
      status: 'sukses',
      data: result,
    });
  }),
);

export default router;
