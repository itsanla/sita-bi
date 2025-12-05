import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { AuthService } from '../services/auth.service';
import { validate } from '../middlewares/validation.middleware';
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../dto/auth.dto';
import { authMiddleware } from '../middlewares/auth.middleware';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
});

const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'Terlalu banyak permintaan. Coba lagi dalam 1 jam.',
});

const router: Router = Router();
const authService = new AuthService();

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const sanitizedMeta: { ip?: string; userAgent?: string } = {};

    if (req.ip != null && req.ip !== '') {
      sanitizedMeta.ip = req.ip;
    }

    const userAgent = req.headers['user-agent'];
    if (typeof userAgent === 'string' && userAgent !== '') {
      sanitizedMeta.userAgent = userAgent;
    }

    const result = await authService.login(req.body, sanitizedMeta);
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    await authService.register(req.body);
    res.status(201).json({
      status: 'sukses',
      message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
    });
  }),
);

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body);
    res.status(200).json({
      status: 'sukses',
      message: 'Email berhasil diverifikasi. Silakan login.',
    });
  }),
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body);
    res.status(200).json({
      status: 'sukses',
      message: 'Jika email terdaftar, link reset password telah dikirim.',
    });
  }),
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    res.status(200).json({
      status: 'sukses',
      message: 'Password berhasil diubah. Silakan login.',
    });
  }),
);

// Get current user profile
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (req.user?.id == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ status: 'sukses', data: user });
  }),
);

// Logout endpoint
router.post('/logout', authMiddleware, (_req, res) => {
  res.status(200).json({
    status: 'sukses',
    message: 'Logout berhasil',
  });
});

export default router;
