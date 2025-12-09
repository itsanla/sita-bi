import { Router } from 'express';
import { PenjadwalanSidangService } from '../services/penjadwalan-sidang.service';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { auditLog } from '../middlewares/audit.middleware';

const router = Router();
const service = new PenjadwalanSidangService();

router.get(
  '/pengaturan',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  asyncHandler(async (req, res) => {
    const pengaturan = await service.getPengaturan();
    res.json({
      status: 'sukses',
      data: pengaturan,
    });
  }),
);

router.post(
  '/pengaturan',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('ATUR_JADWAL_SIDANG', 'penjadwalan_sidang'),
  asyncHandler(async (req, res) => {
    const { tanggal_generate } = req.body as { tanggal_generate: string };
    const userId = req.user?.id;

    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Pengguna tidak ditemukan',
      });
      return;
    }

    if (!tanggal_generate || typeof tanggal_generate !== 'string') {
      res.status(400).json({
        status: 'gagal',
        message: 'Tanggal generate harus diisi',
      });
      return;
    }

    const pengaturan = await service.aturJadwal(tanggal_generate, userId);

    res.json({
      status: 'sukses',
      message: 'Jadwal generate sidang berhasil diatur',
      data: pengaturan,
    });
  }),
);

router.delete(
  '/pengaturan',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('BATALKAN_JADWAL_SIDANG', 'penjadwalan_sidang'),
  asyncHandler(async (req, res) => {
    await service.batalkan();

    res.json({
      status: 'sukses',
      message: 'Jadwal generate sidang dibatalkan',
    });
  }),
);

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = await service.getStatus();

    res.json({
      status: 'sukses',
      data: status,
    });
  }),
);

export default router;
