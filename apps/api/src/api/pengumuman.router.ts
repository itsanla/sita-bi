import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PengumumanService } from '../services/pengumuman.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import type { KategoriPengumuman } from '@repo/db';
import {
  createPengumumanSchema,
  updatePengumumanSchema,
} from '../dto/pengumuman.dto';

const router: Router = Router();
const pengumumanService = new PengumumanService();

// --- Admin Routes (Protected) ---
router.post(
  '/',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  validate(createPengumumanSchema),
  asyncHandler(async (req, res): Promise<void> => {
    if (req.user == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const newPengumuman = await pengumumanService.create(req.body, req.user.id);
    res.status(201).json({ status: 'sukses', data: newPengumuman });
  }),
);

router.get(
  '/all',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    // Remove the isAdmin bool param if it was unused or fix service signature
    const pengumumans = await pengumumanService.findAll(page, limit);
    res.status(200).json({ status: 'sukses', data: pengumumans });
  }),
);

router.patch(
  '/:id',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  validate(updatePengumumanSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengumuman diperlukan' });
      return;
    }
    const updatedPengumuman = await pengumumanService.update(
      parseInt(id, 10),
      req.body,
    );
    res.status(200).json({ status: 'sukses', data: updatedPengumuman });
  }),
);

router.delete(
  '/:id',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengumuman diperlukan' });
      return;
    }
    await pengumumanService.remove(parseInt(id, 10));
    res
      .status(200)
      .json({ status: 'sukses', message: 'Pengumuman berhasil dihapus.' });
  }),
);

// --- Public/User Routes ---
router.get(
  '/public',
  asyncHandler(async (req, res): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const kategori = req.query['kategori'] as KategoriPengumuman | undefined;

    const publicPengumumans = await pengumumanService.findPublic(
      page,
      limit,
      kategori,
    );
    res.status(200).json({ status: 'sukses', data: publicPengumumans });
  }),
);

router.get(
  '/mahasiswa',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    if (req.user == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
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
    const kategori = req.query['kategori'] as KategoriPengumuman | undefined;

    const mahasiswaPengumumans = await pengumumanService.findForMahasiswa(
      page,
      limit,
      req.user.id,
      kategori,
    );
    res.status(200).json({ status: 'sukses', data: mahasiswaPengumumans });
  }),
);

router.get(
  '/dosen',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    if (req.user == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
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
    const kategori = req.query['kategori'] as KategoriPengumuman | undefined;

    const dosenPengumumans = await pengumumanService.findForDosen(
      page,
      limit,
      req.user.id,
      kategori,
    );
    res.status(200).json({ status: 'sukses', data: dosenPengumumans });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pengumuman diperlukan' });
      return;
    }
    const pengumuman = await pengumumanService.findOne(parseInt(id, 10));
    if (pengumuman === null) {
      res
        .status(404)
        .json({ status: 'gagal', message: 'Pengumuman tidak ditemukan' });
      return;
    }
    res.status(200).json({ status: 'sukses', data: pengumuman });
  }),
);

// New: Mark as Read
router.post(
  '/:id/read',
  asyncHandler(authMiddleware),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (req.user == null || id == null) {
      res
        .status(401)
        .json({ status: 'gagal', message: 'Unauthorized or invalid ID' });
      return;
    }
    await pengumumanService.markAsRead(parseInt(id, 10), req.user.id);
    res.status(200).json({ status: 'sukses', message: 'Marked as read' });
  }),
);

export default router;
