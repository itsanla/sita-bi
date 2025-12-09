import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PendaftaranSidangService } from '../services/pendaftaran-sidang.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';
import { periodeGuard } from '../middlewares/periode.middleware';

const router: Router = Router();
const pendaftaranSidangService = new PendaftaranSidangService();

router.use(asyncHandler(authMiddleware));

router.post(
  '/upload/:tipeDokumen',
  periodeGuard(),
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

    const tipeDokumen = req.params.tipeDokumen;

    const { UploadService } = await import('../services/upload.service');
    const uploadService = new UploadService();
    const uploadResult = await uploadService.handleDirectUpload(
      req,
      'sidang-files',
    );

    const pendaftaran =
      await pendaftaranSidangService.getOrCreateRegistration(mahasiswaId);

    const file = await pendaftaranSidangService.uploadSingleFile(
      pendaftaran.id,
      mahasiswaId,
      uploadResult.filePath,
      uploadResult.fileName,
      tipeDokumen,
    );

    res.status(201).json({ status: 'sukses', data: file });
  }),
);

router.get(
  '/my-registration',
  periodeGuard(),
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
    const registration =
      await pendaftaranSidangService.findMyRegistration(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: registration });
  }),
);

router.post(
  '/submit',
  periodeGuard(),
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
    const registration =
      await pendaftaranSidangService.submitRegistration(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: registration });
  }),
);

router.post(
  '/cancel',
  periodeGuard(),
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
    const registration =
      await pendaftaranSidangService.cancelRegistration(mahasiswaId);
    res.status(200).json({ status: 'sukses', data: registration });
  }),
);

router.delete(
  '/file/:fileId',
  periodeGuard(),
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
    const fileId = parseInt(req.params.fileId);
    await pendaftaranSidangService.deleteFile(fileId, mahasiswaId);
    res
      .status(200)
      .json({ status: 'sukses', message: 'File berhasil dihapus' });
  }),
);

router.post(
  '/:id/validate',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: User tidak ditemukan.',
      });
      return;
    }
    const pendaftaranId = parseInt(req.params.id);
    const { action, catatan } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({
        status: 'gagal',
        message: 'Action harus approve atau reject',
      });
      return;
    }

    const result = await pendaftaranSidangService.validateRegistration(
      pendaftaranId,
      userId,
      action,
      catatan,
    );
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

router.get(
  '/list-for-validation',
  periodeGuard(),
  authorizeRoles([Role.dosen, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: User tidak ditemukan.',
      });
      return;
    }

    const list = await pendaftaranSidangService.getListForValidation(userId);
    res.status(200).json({ status: 'sukses', data: list });
  }),
);

export default router;
