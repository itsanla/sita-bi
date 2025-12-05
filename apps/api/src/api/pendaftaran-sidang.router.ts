import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PendaftaranSidangService } from '../services/pendaftaran-sidang.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { rejectPendaftaranSchema } from '../dto/pendaftaran-sidang.dto';
import { uploadSidangFiles } from '../middlewares/upload.middleware';
import { periodeGuard } from '../middlewares/periode.middleware';

const MSG_GAGAL = 'gagal';
const MSG_SUKSES = 'sukses';
const MSG_AKSES_DITOLAK = 'Akses ditolak: Pengguna tidak memiliki profil';

const router: Router = Router();
const pendaftaranSidangService = new PendaftaranSidangService();

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));

router.post(
  '/',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  uploadSidangFiles,
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} mahasiswa.`,
      });
      return;
    }

    const pendaftaran = await pendaftaranSidangService.registerForSidang(
      mahasiswaId,
      req.files,
    );

    res.status(201).json({ status: MSG_SUKSES, data: pendaftaran });
  }),
);

router.get(
  '/pending-approvals',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} dosen.`,
      });
      return;
    }
    const pendingRegistrations =
      await pendaftaranSidangService.getPendingRegistrations(dosenId);
    res.status(200).json({ status: MSG_SUKSES, data: pendingRegistrations });
  }),
);

router.post(
  '/:id/approve',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pendaftaran diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} dosen.`,
      });
      return;
    }
    const approvedRegistration =
      await pendaftaranSidangService.approveRegistration(
        parseInt(id, 10),
        dosenId,
      );
    res.status(200).json({ status: MSG_SUKSES, data: approvedRegistration });
  }),
);

router.post(
  '/:id/reject',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  validate(rejectPendaftaranSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Pendaftaran diperlukan' });
      return;
    }
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} dosen.`,
      });
      return;
    }
    const { catatan } = req.body;
    const rejectedRegistration =
      await pendaftaranSidangService.rejectRegistration(
        parseInt(id, 10),
        dosenId,
        catatan,
      );
    res.status(200).json({ status: MSG_SUKSES, data: rejectedRegistration });
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
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} mahasiswa.`,
      });
      return;
    }
    const registration =
      await pendaftaranSidangService.findMyRegistration(mahasiswaId);
    res.status(200).json({ status: MSG_SUKSES, data: registration });
  }),
);

router.get(
  '/check-eligibility',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req, res): Promise<void> => {
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      res.status(401).json({
        status: MSG_GAGAL,
        message: `${MSG_AKSES_DITOLAK} mahasiswa.`,
      });
      return;
    }
    const eligibility =
      await pendaftaranSidangService.checkEligibility(mahasiswaId);
    res.status(200).json({ status: MSG_SUKSES, data: eligibility });
  }),
);

export default router;
