import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { UsersService } from '../services/users.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
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

router.post(
  '/dosen',
  authorizeRoles([Role.admin]),
  validate(createDosenSchema),
  asyncHandler(async (req, res) => {
    const newDosen = await usersService.createDosen(req.body);
    res.status(201).json({ status: 'sukses', data: newDosen });
  }),
);

router.post(
  '/mahasiswa',
  authorizeRoles([Role.admin]),
  validate(createMahasiswaSchema),
  asyncHandler(async (req, res) => {
    const newMahasiswa = await usersService.createMahasiswa(req.body);
    res.status(201).json({ status: 'sukses', data: newMahasiswa });
  }),
);

router.get(
  '/dosen',
  // authorizeRoles([Role.admin]),
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
  // authorizeRoles([Role.dosen]),
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
  authorizeRoles([Role.admin]),
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

router.patch(
  '/dosen/:id',
  authorizeRoles([Role.admin]),
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
  authorizeRoles([Role.admin]),
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
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengguna diperlukan' });
      return;
    }
    await usersService.deleteUser(parseInt(id, 10));
    res
      .status(200)
      .json({ status: 'sukses', message: 'Pengguna berhasil dihapus.' });
  }),
);

// New endpoint for unlocking user
router.post(
  '/:id/unlock',
  authorizeRoles([Role.admin]),
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
