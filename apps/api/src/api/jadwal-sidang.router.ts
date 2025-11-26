import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { JadwalSidangService } from '../services/jadwal-sidang.service';
import {
  insecureAuthMiddleware,
  authMiddleware,
} from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
import { createJadwalSchema } from '../dto/jadwal-sidang.dto';

const router: Router = Router();
const jadwalSidangService = new JadwalSidangService();

router.get(
  '/',
  asyncHandler(insecureAuthMiddleware),
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const registrations = await jadwalSidangService.getApprovedRegistrations(
      page,
      limit,
    );
    res.status(200).json({ status: 'sukses', data: registrations });
  }),
);

router.post(
  '/',
  asyncHandler(authMiddleware), // Must be authenticated to get userId
  authorizeRoles([Role.admin]),
  validate(createJadwalSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    const newJadwal = await jadwalSidangService.createJadwal(req.body, userId);
    res.status(201).json({ status: 'sukses', data: newJadwal });
  }),
);

router.post(
  '/check-conflict',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin]),
  validate(createJadwalSchema),
  asyncHandler(async (req, res): Promise<void> => {
    // We can't easily access the logic inside createJadwal without refactoring or duplicating.
    // However, JadwalSidangService has checkScheduleConflict but it needs ALL dosen IDs.
    // So we need to fetch the sidang here or add a helper in service.
    // It is better to add a helper in service that accepts the DTO and returns conflict info.

    // I will modify the service to expose a method that takes the DTO and does the check.
    // For now, I will assume I'll add `checkConflictForJadwal` to the service.

    // Actually, I can just use prisma client here? No, better keep logic in service.
    // Let's go to the service and add `checkConflict` that accepts `CreateJadwalDto`.

    const result = await jadwalSidangService.checkConflict(req.body);
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

router.get(
  '/for-penguji',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const sidang = await jadwalSidangService.getSidangForPenguji(
      dosenId,
      page,
      limit,
    );
    res.status(200).json({ status: 'sukses', data: sidang });
  }),
);

router.get(
  '/for-mahasiswa',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil mahasiswa.',
      });
      return;
    }
    const sidang = await jadwalSidangService.getSidangForMahasiswa(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: sidang });
  }),
);

export default router;
