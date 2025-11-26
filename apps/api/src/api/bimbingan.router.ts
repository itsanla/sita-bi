import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { BimbinganService } from '../services/bimbingan.service';
import { insecureAuthMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
import { createCatatanSchema, setJadwalSchema } from '../dto/bimbingan.dto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router: Router = Router();
const bimbinganService = new BimbinganService();

// Configure Multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads/bimbingan');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(insecureAuthMiddleware));

router.get(
  '/sebagai-dosen',
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
    const bimbingan = await bimbinganService.getBimbinganForDosen(
      dosenId,
      page,
      limit,
    );
    res.status(200).json({ status: 'sukses', data: bimbingan });
  }),
);

router.get(
  '/sebagai-mahasiswa',
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil mahasiswa.',
      });
      return;
    }
    const bimbingan =
      await bimbinganService.getBimbinganForMahasiswa(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: bimbingan });
  }),
);

router.post(
  '/catatan',
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  validate(createCatatanSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const { bimbingan_ta_id, catatan } = req.body;
    const newCatatan = await bimbinganService.createCatatan(
      bimbingan_ta_id,
      userId,
      catatan,
    );
    res.status(201).json({ status: 'sukses', data: newCatatan });
  }),
);

router.post(
  '/sesi/:id/upload',
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  upload.array('files'), // Allow multiple files
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res.status(400).json({ status: 'gagal', message: 'ID Sesi diperlukan' });
      return;
    }
    const userId = req.user?.id;
    if (userId === undefined) {
      res.status(401).json({ status: 'gagal', message: 'User ID not found' });
      return;
    }

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ status: 'gagal', message: 'No files uploaded' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    // Process each file
    const results = [];
    for (const file of files) {
      // You would typically move the file or get its path here
      // And save it to the database
      // For now, assuming bimbinganService has a method or we add one
      // We'll just call a service method
      const result = await bimbinganService.addLampiran(
        parseInt(id, 10),
        file.path, // Or relative path
        file.originalname,
        file.mimetype,
      );
      results.push(result);
    }

    res.status(201).json({ status: 'sukses', data: results });
  }),
);

router.post(
  '/sesi/:id/konfirmasi',
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res.status(400).json({ status: 'gagal', message: 'ID Sesi diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({ status: 'gagal', message: 'Not a dosen' });
      return;
    }

    const result = await bimbinganService.konfirmasiBimbingan(parseInt(id, 10));
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/:tugasAkhirId/jadwal',
  authorizeRoles([Role.dosen]),
  validate(setJadwalSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (tugasAkhirId == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const { tanggal_bimbingan, jam_bimbingan } = req.body;
    const jadwal = await bimbinganService.setJadwal(
      parseInt(tugasAkhirId, 10),
      dosenId,
      tanggal_bimbingan,
      jam_bimbingan,
    );
    res.status(201).json({ status: 'sukses', data: jadwal });
  }),
);

router.post(
  '/sesi/:id/cancel',
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res.status(400).json({ status: 'gagal', message: 'ID Sesi diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const result = await bimbinganService.cancelBimbingan(
      parseInt(id, 10),
      dosenId,
    );
    if (result === null) {
      res.status(404).json({
        status: 'gagal',
        message: 'Sesi bimbingan tidak ditemukan atau tidak diizinkan.',
      });
      return;
    }
    res.status(200).json({
      status: 'sukses',
      message: 'Sesi bimbingan dibatalkan.',
      data: result,
    });
  }),
);

router.post(
  '/sesi/:id/selesaikan',
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res.status(400).json({ status: 'gagal', message: 'ID Sesi diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const result = await bimbinganService.selesaikanSesi(
      parseInt(id, 10),
      dosenId,
    );
    if (result === null) {
      res.status(404).json({
        status: 'gagal',
        message: 'Sesi bimbingan tidak ditemukan atau tidak diizinkan.',
      });
      return;
    }
    res.status(200).json({
      status: 'sukses',
      message: 'Sesi bimbingan telah diselesaikan.',
      data: result,
    });
  }),
);

// New endpoints for Smart Scheduling
router.get(
  '/conflicts',
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
    const { tanggal, jam } = req.query;
    if (
      typeof tanggal !== 'string' ||
      tanggal.length === 0 ||
      typeof jam !== 'string' ||
      jam.length === 0
    ) {
      res.status(400).json({
        status: 'gagal',
        message: 'Parameter tanggal dan jam diperlukan',
      });
      return;
    }

    const hasConflict = await bimbinganService.detectScheduleConflicts(
      dosenId,
      new Date(tanggal),
      jam,
    );
    res.status(200).json({ status: 'sukses', data: { hasConflict } });
  }),
);

router.get(
  '/available-slots',
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
    const { tanggal } = req.query;
    if (typeof tanggal !== 'string' || tanggal.length === 0) {
      res.status(400).json({
        status: 'gagal',
        message: 'Parameter tanggal diperlukan',
      });
      return;
    }

    const slots = await bimbinganService.suggestAvailableSlots(
      dosenId,
      tanggal,
    );
    res.status(200).json({ status: 'sukses', data: slots });
  }),
);

export default router;
