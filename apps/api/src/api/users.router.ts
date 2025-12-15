import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { UsersService } from '../services/users.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { auditLog } from '../middlewares/audit.middleware';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';

const adminLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Terlalu banyak permintaan admin. Coba lagi dalam 1 menit.',
});
import {
  createDosenSchema,
  updateDosenSchema,
  updateMahasiswaSchema,
  createMahasiswaSchema,
} from '../dto/users.dto';

const router: Router = Router();
const usersService = new UsersService();

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));
router.use(adminLimiter);

// Bulk delete endpoint - MUST be FIRST before any /:id routes
router.post(
  '/bulk-delete',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('BULK_DELETE_USERS', 'users'),
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ status: 'gagal', message: 'IDs diperlukan' });
      return;
    }
    const result = await usersService.bulkDeleteUsers(ids);
    const message =
      result.failed.length > 0
        ? `${result.count} pengguna berhasil dihapus, ${result.failed.length} gagal (terkait dengan data lain).`
        : `${result.count} pengguna berhasil dihapus.`;
    res.status(200).json({
      status: 'sukses',
      message,
      data: result,
    });
  }),
);

router.post(
  '/dosen',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('CREATE_DOSEN', 'users'),
  validate(createDosenSchema),
  asyncHandler(async (req, res) => {
    const newDosen = await usersService.createDosen(req.body);
    res.status(201).json({ status: 'sukses', data: newDosen });
  }),
);

router.post(
  '/mahasiswa',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('CREATE_MAHASISWA', 'users'),
  validate(createMahasiswaSchema),
  asyncHandler(async (req, res) => {
    const newMahasiswa = await usersService.createMahasiswa(req.body);
    res.status(201).json({ status: 'sukses', data: newMahasiswa });
  }),
);

router.get(
  '/dosen',
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const dosenList = await usersService.findAllDosen(page, limit);
    res.status(200).json({ status: 'sukses', data: dosenList });
  }),
);

router.get(
  '/mahasiswa-tanpa-pembimbing',
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const mahasiswaList = await usersService.findAllMahasiswaTanpaPembimbing(
      page,
      limit,
    );
    res.status(200).json({ status: 'sukses', data: mahasiswaList });
  }),
);

router.get(
  '/mahasiswa',
  authorizeRoles([Role.admin, Role.jurusan]),
  asyncHandler(async (req, res) => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const mahasiswaList = await usersService.findAllMahasiswa(page, limit);
    res.status(200).json({ status: 'sukses', data: mahasiswaList });
  }),
);

router.get(
  '/mahasiswa/prodi',
  authorizeRoles([Role.prodi_d3, Role.prodi_d4, Role.jurusan]),
  asyncHandler(async (req, res) => {
    const mahasiswaList = await usersService.findAllMahasiswaWithTA();
    res.status(200).json({ status: 'sukses', data: mahasiswaList });
  }),
);

router.patch(
  '/dosen/:id',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('UPDATE_DOSEN', 'users'),
  validate(updateDosenSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id == null) {
      res.status(400).json({ status: 'gagal', message: 'ID Dosen diperlukan' });
      return;
    }
    const updatedDosen = await usersService.updateDosen(
      parseInt(id, 10),
      req.body,
    );
    res.status(200).json({ status: 'sukses', data: updatedDosen });
  }),
);

router.patch(
  '/mahasiswa/:id',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('UPDATE_MAHASISWA', 'users'),
  validate(updateMahasiswaSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Mahasiswa diperlukan' });
      return;
    }
    const updatedMahasiswa = await usersService.updateMahasiswa(
      parseInt(id, 10),
      req.body,
    );
    res.status(200).json({ status: 'sukses', data: updatedMahasiswa });
  }),
);

router.delete(
  '/:id',
  authorizeRoles([Role.admin, Role.jurusan]),
  auditLog('DELETE_USER', 'users'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengguna diperlukan' });
      return;
    }
    const currentUserId = req.user?.id;
    await usersService.deleteUser(parseInt(id, 10), currentUserId);
    res
      .status(200)
      .json({ status: 'sukses', message: 'Pengguna berhasil dihapus.' });
  }),
);

// New endpoint for unlocking user
router.post(
  '/:id/unlock',
  authorizeRoles([Role.admin, Role.jurusan]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengguna diperlukan' });
      return;
    }

    await usersService.updateUser(parseInt(id, 10), {
      failed_login_attempts: 0,
      lockout_until: null,
    });

    res
      .status(200)
      .json({ status: 'sukses', message: 'Akun pengguna berhasil dibuka.' });
  }),
);

export default router;
