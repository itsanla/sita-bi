import { Router, type Request, type Response } from 'express';
import asyncHandler from 'express-async-handler';
import { TugasAkhirService } from '../services/tugas-akhir.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
import { createTugasAkhirSchema } from '../dto/tugas-akhir.dto';
// NOTE: rejectTugasAkhirSchema dan tugasAkhirGuard di-comment karena method terkait belum diimplementasi
// import { rejectTugasAkhirSchema } from '../dto/tugas-akhir.dto';
// import { tugasAkhirGuard } from '../middlewares/tugas-akhir.middleware';

const router: Router = Router();
const tugasAkhirService = new TugasAkhirService();

// Apply JWT Auth and Roles Guard globally for this router
// router.use(authMiddleware);

router.post(
  '/check-similarity',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  validate(createTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const SIMILARITY_BLOCK_THRESHOLD = 80;
    const { judul } = req.body;
    const results = await tugasAkhirService.checkSimilarity(judul);

    const isBlocked = results.some(
      (result) => result.similarity >= SIMILARITY_BLOCK_THRESHOLD,
    );

    response.status(200).json({
      status: 'sukses',
      data: {
        results,
        isBlocked,
      },
    });
  }),
);

router.post(
  '/',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  validate(createTugasAkhirSchema),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const newTugasAkhir = await tugasAkhirService.createFinal(req.body, userId);
    response.status(201).json({ status: 'sukses', data: newTugasAkhir });
  }),
);

// TODO: Implement findAllForValidation method in TugasAkhirService
/*
router.get(
  '/validasi',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4]),
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
  authorizeRoles([Role.admin, Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4]),
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
  authorizeRoles([Role.admin, Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4]),
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
  authorizeRoles([Role.admin, Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4]),
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
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const tugasAkhir = await tugasAkhirService.findMyTugasAkhir(userId);
    response.status(200).json({ status: 'sukses', data: tugasAkhir });
  }),
);

router.delete(
  '/my-ta',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    await tugasAkhirService.deleteMyTa(userId);
    response
      .status(200)
      .json({ status: 'sukses', message: 'Tugas Akhir berhasil dihapus.' });
  }),
);

router.get(
  '/all-titles',
  asyncHandler(authMiddleware),
  asyncHandler(async (_req: Request, response: Response): Promise<void> => {
    const titles = await tugasAkhirService.findAllTitles();
    response.status(200).json({ status: 'sukses', data: titles });
  }),
);

// Get pending TA for dosen to approve/reject
router.get(
  '/pending',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req: Request, response: Response): Promise<void> => {
    const userId = req.user?.id;
    if (userId === undefined) {
      response.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: ID pengguna tidak ditemukan.',
      });
      return;
    }
    const pendingList = await tugasAkhirService.getPendingForDosen(userId);
    response.status(200).json({ status: 'sukses', data: pendingList });
  }),
);

// Approve tugas akhir
router.patch(
  '/:id/approve',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen]),
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

// Reject tugas akhir
router.patch(
  '/:id/reject',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.dosen]),
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
    response.status(200).json({ status: 'sukses', data: rejectedTugasAkhir });
  }),
);

export default router;
