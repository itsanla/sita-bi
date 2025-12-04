import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { DataDiriService } from '../services/data-diri.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  updateDataDiriSchema,
  updatePasswordSchema,
  requestEmailOtpSchema,
  verifyEmailOtpSchema,
} from '../dto/data-diri.dto';

/**
 * Router untuk mengelola data diri user (mahasiswa, dosen, admin)
 * Endpoints:
 * - GET /api/data-diri - Mendapatkan data diri user yang sedang login
 * - PATCH /api/data-diri - Update data diri user
 * - PATCH /api/data-diri/password - Update password user
 * - POST /api/data-diri/email/request-otp - Request OTP untuk ubah email
 * - POST /api/data-diri/email/verify-otp - Verify OTP dan ubah email
 */
const router: Router = Router();
const dataDiriService = new DataDiriService();

const UNAUTHORIZED_MESSAGE = 'Akses ditolak: ID pengguna tidak ditemukan.';

router.use(asyncHandler(authMiddleware));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: UNAUTHORIZED_MESSAGE,
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
        message: UNAUTHORIZED_MESSAGE,
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

router.patch(
  '/password',
  validate(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: UNAUTHORIZED_MESSAGE,
      });
      return;
    }
    await dataDiriService.updatePassword(userId, req.body);
    res
      .status(200)
      .json({ status: 'sukses', message: 'Password berhasil diubah' });
  }),
);

router.post(
  '/email/request-otp',
  validate(requestEmailOtpSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: UNAUTHORIZED_MESSAGE,
      });
      return;
    }
    await dataDiriService.requestEmailOtp(userId, req.body);
    res.status(200).json({
      status: 'sukses',
      message: 'Kode OTP telah dikirim ke WhatsApp Anda',
    });
  }),
);

router.post(
  '/email/verify-otp',
  validate(verifyEmailOtpSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: UNAUTHORIZED_MESSAGE,
      });
      return;
    }
    await dataDiriService.verifyEmailOtp(userId, req.body);
    res.status(200).json({
      status: 'sukses',
      message: 'Email berhasil diubah',
    });
  }),
);

export default router;
