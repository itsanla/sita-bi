import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { ProfileService } from '../services/profile.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateProfileSchema } from '../dto/profile.dto';

const router: Router = Router();
const profileService = new ProfileService();

// Apply JWT Auth globally for this router
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
    const profile = await profileService.getProfile(userId);
    res.status(200).json({ status: 'sukses', data: profile });
  }),
);

router.patch(
  '/',
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const updatedProfile = await profileService.updateProfile(userId, req.body);
    res.status(200).json({ status: 'sukses', data: updatedProfile });
  }),
);

export default router;
