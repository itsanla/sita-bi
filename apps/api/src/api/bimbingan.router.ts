import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import asyncHandler from '../utils/asyncHandler';
import { BimbinganService } from '../services/bimbingan.service';
import { insecureAuthMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validateDosenTugasAkhirAccess } from '../middlewares/rbac.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import {
  createCatatanSchema,
  setJadwalSchema,
  createSesiSchema,
  setJadwalSesiSchema,
} from '../dto/bimbingan.dto';
import { BadRequestError } from '../errors/AppError';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { periodeGuard } from '../middlewares/periode.middleware';

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
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Tipe file tidak diizinkan. Hanya PDF, DOC, DOCX, dan gambar yang diperbolehkan.',
      ),
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
});

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(insecureAuthMiddleware));

const ERROR_MSG_NO_DOSEN = 'Pengguna tidak memiliki profil dosen';
const ERROR_MSG_NO_MAHASISWA = 'Pengguna tidak memiliki profil mahasiswa';
const ERROR_MSG_NO_USER_ID = 'ID pengguna tidak ditemukan';
const ERROR_MSG_NO_SESI_ID = 'ID Sesi diperlukan';
const ERROR_MSG_NO_TA_ID = 'ID Tugas Akhir diperlukan';
const ERROR_MSG_NO_FILES = 'Tidak ada file yang diupload';

router.get(
  '/sebagai-dosen',
  periodeGuard(),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
    }

    const hasPageQuery = req.query['page'] !== undefined;
    const page = hasPageQuery
      ? Math.max(1, parseInt(req.query['page'] as string, 10))
      : 1;

    const hasLimitQuery = req.query['limit'] !== undefined;
    const limit = hasLimitQuery
      ? Math.min(100, Math.max(1, parseInt(req.query['limit'] as string, 10)))
      : 20;

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
  periodeGuard(),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (typeof mahasiswaId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_MAHASISWA);
    }

    const bimbingan =
      await bimbinganService.getBimbinganForMahasiswa(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: bimbingan });
  }),
);

router.post(
  '/catatan',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  validate(createCatatanSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
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
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  (req: Request, res: Response, next: NextFunction): void => {
    upload.array('files', 5)(req, res, (err: unknown): void => {
      const isMulterError = err instanceof multer.MulterError;

      if (isMulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            status: 'gagal',
            message: 'Ukuran file terlalu besar. Maksimal 10MB per file.',
          });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            status: 'gagal',
            message: 'Terlalu banyak file. Maksimal 5 file.',
          });
          return;
        }
        res
          .status(400)
          .json({ status: 'gagal', message: `Upload error: ${err.message}` });
        return;
      }
      const hasErrorMessage =
        err !== null &&
        err !== undefined &&
        typeof err === 'object' &&
        'message' in err;

      if (hasErrorMessage) {
        const errorMessage =
          typeof err.message === 'string' ? err.message : 'Unknown error';
        res.status(400).json({ status: 'gagal', message: errorMessage });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const hasValidFiles = Array.isArray(req.files) && req.files.length > 0;

    if (!hasValidFiles) {
      throw new BadRequestError(ERROR_MSG_NO_FILES);
    }

    const files = req.files;
    const results = await bimbinganService.addMultipleLampiran(
      parseInt(id, 10),
      files.map((f) => ({
        path: f.path,
        name: f.originalname,
        type: f.mimetype,
      })),
    );

    res.status(201).json({ status: 'sukses', data: results });
  }),
);

// Endpoint baru: Buat sesi kosong
router.post(
  '/sesi',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  validate(createSesiSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
    }

    const { tugas_akhir_id, pembimbing_peran } = req.body;
    const newSesi = await bimbinganService.createEmptySesi(
      tugas_akhir_id,
      userId,
      pembimbing_peran,
    );
    res.status(201).json({ status: 'sukses', data: newSesi });
  }),
);

// Endpoint baru: Set jadwal pada sesi yang sudah ada
router.put(
  '/sesi/:id/jadwal',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  validate(setJadwalSesiSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const { tanggal_bimbingan, jam_bimbingan, jam_selesai } = req.body;
    const updated = await bimbinganService.setJadwalSesi(
      parseInt(id, 10),
      userId,
      tanggal_bimbingan,
      jam_bimbingan,
      jam_selesai,
    );
    res.status(200).json({ status: 'sukses', data: updated });
  }),
);

// Endpoint baru: Konfirmasi bimbingan selesai (hanya dosen)
router.post(
  '/sesi/:id/konfirmasi',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const result = await bimbinganService.konfirmasiSelesai(
      parseInt(id, 10),
      userId,
    );
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

router.post(
  '/:tugasAkhirId/jadwal',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.prodi_d3, Role.prodi_d4, Role.jurusan]),
  validateDosenTugasAkhirAccess,
  validate(setJadwalSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (typeof tugasAkhirId !== 'string' || tugasAkhirId === '') {
      throw new BadRequestError(ERROR_MSG_NO_TA_ID);
    }

    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
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
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
    }

    const result = await bimbinganService.cancelBimbingan(
      parseInt(id, 10),
      dosenId,
    );
    res.status(200).json({
      status: 'sukses',
      message: 'Sesi bimbingan dibatalkan',
      data: result,
    });
  }),
);

router.post(
  '/sesi/:id/selesaikan',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
    }

    const result = await bimbinganService.selesaikanSesi(
      parseInt(id, 10),
      dosenId,
    );
    res.status(200).json({
      status: 'sukses',
      message: 'Sesi bimbingan telah diselesaikan',
      data: result,
    });
  }),
);

// New endpoints for Smart Scheduling
router.get(
  '/conflicts',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
    }

    const { tanggal, jam } = req.query;
    const hasValidParams =
      typeof tanggal === 'string' &&
      tanggal !== '' &&
      typeof jam === 'string' &&
      jam !== '';

    if (!hasValidParams) {
      throw new BadRequestError('Parameter tanggal dan jam diperlukan');
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
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (typeof dosenId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_DOSEN);
    }

    const { tanggal } = req.query;
    const isValidTanggal = typeof tanggal === 'string' && tanggal !== '';

    if (!isValidTanggal) {
      throw new BadRequestError('Parameter tanggal diperlukan');
    }

    const slots = await bimbinganService.suggestAvailableSlots(
      dosenId,
      tanggal,
    );
    res.status(200).json({ status: 'sukses', data: slots });
  }),
);

router.delete(
  '/sesi/:id',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    await bimbinganService.deleteSesi(parseInt(id, 10), userId);
    res.status(200).json({
      status: 'sukses',
      message: 'Sesi bimbingan berhasil dihapus',
    });
  }),
);

router.get(
  '/eligibility/:tugasAkhirId',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (typeof tugasAkhirId !== 'string' || tugasAkhirId === '') {
      throw new BadRequestError(ERROR_MSG_NO_TA_ID);
    }

    const eligibility = await bimbinganService.checkSidangEligibility(
      parseInt(tugasAkhirId, 10),
    );
    res.status(200).json({ status: 'sukses', data: eligibility });
  }),
);

router.post(
  '/sesi/:id/batalkan-validasi',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (typeof userId !== 'number') {
      throw new BadRequestError(ERROR_MSG_NO_USER_ID);
    }

    const { id } = req.params;
    if (typeof id !== 'string' || id === '') {
      throw new BadRequestError(ERROR_MSG_NO_SESI_ID);
    }

    const result = await bimbinganService.batalkanValidasi(
      parseInt(id, 10),
      userId,
    );
    res.status(200).json({
      status: 'sukses',
      message: 'Validasi bimbingan berhasil dibatalkan',
      data: result,
    });
  }),
);

export default router;
