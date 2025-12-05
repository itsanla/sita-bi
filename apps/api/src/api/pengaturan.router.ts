import { Router } from 'express';
import { PengaturanService } from '../services/pengaturan.service';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles, Role } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updatePengaturanSchema } from '../dto/pengaturan.dto';
import { auditLog } from '../middlewares/audit.middleware';

const router = Router();
const pengaturanService = new PengaturanService();

router.get(
  '/',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  asyncHandler(async (req, res) => {
    const pengaturan = await pengaturanService.getPengaturan();
    res.json({
      success: true,
      data: pengaturan,
    });
  }),
);

router.patch(
  '/',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('UPDATE_PENGATURAN', 'pengaturan'),
  validate(updatePengaturanSchema),
  asyncHandler(async (req, res) => {
    const pengaturan = await pengaturanService.updatePengaturan(req.body);
    res.json({
      success: true,
      message: 'Pengaturan berhasil diperbarui',
      data: pengaturan,
    });
  }),
);

export default router;
