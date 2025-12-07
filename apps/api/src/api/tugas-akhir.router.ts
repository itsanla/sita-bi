import { Router, type Request, type Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { TugasAkhirService } from '../services/tugas-akhir.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { createTugasAkhirSchema } from '../dto/tugas-akhir.dto';
import { getMaxSimilaritasPersen } from '../utils/business-rules';
import { periodeGuard } from '../middlewares/periode.middleware';
// NOTE: rejectTugasAkhirSchema dan tugasAkhirGuard di-comment karena method terkait belum diimplementasi
// import { rejectTugasAkhirSchema } from '../dto/tugas-akhir.dto';
// import { tugasAkhirGuard } from '../middlewares/tugas-akhir.middleware';

const router: Router = Router();
const tugasAkhirService = new TugasAkhirService();
const STATUS_SUKSES = 'sukses';
const MSG_USER_ID_NOT_FOUND = 'Akses ditolak: ID pengguna tidak ditemukan.';

// Apply JWT Auth and Roles Guard globally for this router
// router.use(authMiddleware);

router.post(
  '/check-similarity',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  validate(createTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const SIMILARITY_BLOCK_THRESHOLD = await getMaxSimilaritasPersen();
    const { judul } = req.body;
    const results = await tugasAkhirService.checkSimilarity(judul);

    const isBlocked = results.some(
      (result) => result.similarity >= SIMILARITY_BLOCK_THRESHOLD,
    );

    response.status(200).json({
      status: STATUS_SUKSES,
      data: {
        results,
        isBlocked,
        threshold: SIMILARITY_BLOCK_THRESHOLD,
      },
    });
  }),
);

router.post(
  '/',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  validate(createTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: MSG_USER_ID_NOT_FOUND,
      });
      return;
    }
    const newTugasAkhir = await tugasAkhirService.createFinal(req.body, userId);
    response.status(201).json({ status: STATUS_SUKSES, data: newTugasAkhir });
  }),
);

// TODO: Implement findAllForValidation method in TugasAkhirService
/*
router.get(
  '/validasi',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    if (req.user == null) {
      response.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const page =
      req.query['page'] != null ? parseInt(req.query['page'] as string) : undefined;
    const limit =
      req.query['limit'] != null ? parseInt(req.query['limit'] as string) : undefined;
    const tugasAkhirList = await tugasAkhirService.findAllForValidation(
      req.user,
      page,
      limit,
    );
    response.status(200).json({ status: 'sukses', data: tugasAkhirList });
  }),
);
*/

// TODO: Implement approve method in TugasAkhirService
/*
router.patch(
  '/:id/approve',
  asyncHandler(authMiddleware),
  asyncHandler(tugasAkhirGuard), // Custom guard for Tugas Akhir
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      response
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const approverId = req.user?.id;
    if (approverId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pemberi persetujuan tidak ditemukan.',
      });
      return;
    }
    const approvedTugasAkhir = await tugasAkhirService.approve(
      parseInt(id, 10),
      approverId,
    );
    response.status(200).json({ status: 'sukses', data: approvedTugasAkhir });
  }),
);
*/

// TODO: Implement reject method in TugasAkhirService
/*
router.patch(
  '/:id/reject',
  asyncHandler(authMiddleware),
  asyncHandler(tugasAkhirGuard), // Custom guard for Tugas Akhir
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  validate(rejectTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      response
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const rejecterId = req.user?.id;
    if (rejecterId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID penolak tidak ditemukan.',
      });
      return;
    }
    const { alasan_penolakan } = req.body;
    const rejectedTugasAkhir = await tugasAkhirService.reject(
      parseInt(id, 10),
      rejecterId,
      alasan_penolakan,
    );
    response.status(200).json({ status: 'sukses', data: rejectedTugasAkhir });
  }),
);
*/

// TODO: Implement cekKemiripan method in TugasAkhirService
/*
router.post(
  '/:id/cek-kemiripan',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      response
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const kemiripanResult = await tugasAkhirService.cekKemiripan(
      parseInt(id, 10),
    );
    response.status(200).json({ status: 'sukses', data: kemiripanResult });
  }),
);
*/

router.get(
  '/my-ta',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: MSG_USER_ID_NOT_FOUND,
      });
      return;
    }
    const tugasAkhir = await tugasAkhirService.findMyTugasAkhir(userId);
    response.status(200).json({ status: STATUS_SUKSES, data: tugasAkhir });
  }),
);

router.delete(
  '/my-ta',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: MSG_USER_ID_NOT_FOUND,
      });
      return;
    }
    await tugasAkhirService.deleteMyTa(userId);
    response.status(200).json({
      status: STATUS_SUKSES,
      message: 'Tugas Akhir berhasil dihapus.',
    });
  }),
);

router.get(
  '/all-titles',
  asyncHandler(authMiddleware),
  asyncHandler(async (_req: Request, response: Response): Promise<void> => {
    const titles = await tugasAkhirService.findAllTitles();
    response.status(200).json({ status: STATUS_SUKSES, data: titles });
  }),
);

// Get pending TA for dosen to approve/reject
router.get(
  '/pending',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: MSG_USER_ID_NOT_FOUND,
      });
      return;
    }
    const pendingList = await tugasAkhirService.getPendingForDosen(userId);
    response.status(200).json({ status: STATUS_SUKSES, data: pendingList });
  }),
);

// Approve tugas akhir
router.patch(
  '/:id/approve',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      response
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const approverId = req.user?.id;
    if (approverId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pemberi persetujuan tidak ditemukan.',
      });
      return;
    }
    const approvedTugasAkhir = await tugasAkhirService.approve(
      parseInt(id, 10),
      approverId,
    );
    response
      .status(200)
      .json({ status: STATUS_SUKSES, data: approvedTugasAkhir });
  }),
);

// Reject tugas akhir
router.patch(
  '/:id/reject',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      response
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }
    const rejecterId = req.user?.id;
    if (rejecterId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID penolak tidak ditemukan.',
      });
      return;
    }
    const { alasan_penolakan } = req.body as { alasan_penolakan?: unknown };
    if (
      typeof alasan_penolakan !== 'string' ||
      alasan_penolakan.trim().length === 0
    ) {
      response.status(400).json({
        status: 'gagal',
        message: 'Alasan penolakan diperlukan dan harus berupa string',
      });
      return;
    }
    const rejectedTugasAkhir = await tugasAkhirService.reject(
      parseInt(id, 10),
      rejecterId,
      alasan_penolakan,
    );
    response
      .status(200)
      .json({ status: STATUS_SUKSES, data: rejectedTugasAkhir });
  }),
);

router.patch(
  '/my-ta/update-judul',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  validate(createTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: MSG_USER_ID_NOT_FOUND,
      });
      return;
    }
    const { judul } = req.body;
    const updatedTugasAkhir = await tugasAkhirService.updateJudul(
      userId,
      judul,
    );
    response
      .status(200)
      .json({ status: STATUS_SUKSES, data: updatedTugasAkhir });
  }),
);

router.post(
  '/:id/validasi-judul',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Dosen tidak ditemukan',
      });
      return;
    }
    const result = await tugasAkhirService.validasiJudul(
      parseInt(id, 10),
      dosenId,
    );
    response.status(200).json({ status: STATUS_SUKSES, data: result });
  }),
);

router.post(
  '/:id/batalkan-validasi-judul',
  asyncHandler(authMiddleware),
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const { id } = req.params;
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Dosen tidak ditemukan',
      });
      return;
    }
    const result = await tugasAkhirService.batalkanValidasiJudul(
      parseInt(id, 10),
      dosenId,
    );
    response.status(200).json({ status: STATUS_SUKSES, data: result });
  }),
);

export default router;
