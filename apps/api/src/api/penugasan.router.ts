import { Router, type Request, type Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import {
  assignPengujiSchema,
  PenugasanService,
} from '../services/penugasan.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { assignPembimbingSchema } from '../dto/penugasan.dto';
import {
  validateTeamComposition,
  validatePengujiAssignment,
  validateNoOverlap,
} from '../utils/rbac-helpers';
import { auditLog } from '../middlewares/audit.middleware';

const MSG_GAGAL = 'gagal';
const MSG_SUKSES = 'sukses';
const MSG_VALIDASI_GAGAL = 'Validasi gagal';

const router: Router = Router();
const penugasanService = new PenugasanService();

router.get(
  '/dosen-load',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loadData = await penugasanService.getDosenLoad();
    res.status(200).json({ status: MSG_SUKSES, data: loadData });
  }),
);

router.get(
  '/unassigned',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userRole = req.user?.role;
    const userProdi = req.user?.dosen?.prodi;
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const unassignedTugasAkhir =
      await penugasanService.findUnassignedTugasAkhir(
        page,
        limit,
        userRole,
        userProdi,
      );
    res.status(200).json({ status: MSG_SUKSES, data: unassignedTugasAkhir });
  }),
);

router.post(
  '/:tugasAkhirId/assign',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  auditLog('ASSIGN_PEMBIMBING', 'penugasan'),
  validate(assignPembimbingSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (tugasAkhirId == null) {
      res
        .status(400)
        .json({ status: MSG_GAGAL, message: 'ID Tugas Akhir diperlukan' });
      return;
    }

    if (req.user?.id == null) {
      res.status(401).json({ status: MSG_GAGAL, message: 'Unauthorized' });
      return;
    }
    const adminId = req.user.id;

    const validation = await validateTeamComposition(
      req.body.pembimbing1Id,
      req.body.pembimbing2Id,
    );

    if (!validation.isValid) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_VALIDASI_GAGAL,
        errors: validation.errors,
      });
      return;
    }

    const assignedPembimbing = await penugasanService.assignPembimbing(
      parseInt(tugasAkhirId, 10),
      req.body,
      adminId,
    );
    res.status(200).json({ status: MSG_SUKSES, data: assignedPembimbing });
  }),
);

router.post(
  '/:tugasAkhirId/assign-penguji',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  auditLog('ASSIGN_PENGUJI', 'penugasan'),
  validate(assignPengujiSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (tugasAkhirId == null) {
      res
        .status(400)
        .json({ status: MSG_GAGAL, message: 'ID Tugas Akhir diperlukan' });
      return;
    }

    if (req.user?.id == null) {
      res.status(401).json({ status: MSG_GAGAL, message: 'Unauthorized' });
      return;
    }
    const adminId = req.user.id;

    const validation = validatePengujiAssignment(
      req.body.penguji1Id,
      req.body.penguji2Id,
      req.body.penguji3Id,
    );

    if (!validation.valid) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_VALIDASI_GAGAL,
        errors: validation.errors,
      });
      return;
    }

    const assigned = await penugasanService.assignPenguji(
      parseInt(tugasAkhirId, 10),
      req.body,
      adminId,
    );

    const overlapCheck = await validateNoOverlap(parseInt(tugasAkhirId, 10));
    if (!overlapCheck.valid) {
      res.status(400).json({
        status: MSG_GAGAL,
        message: MSG_VALIDASI_GAGAL,
        errors: overlapCheck.errors,
      });
      return;
    }

    res.status(200).json({ status: MSG_SUKSES, data: assigned });
  }),
);

export default router;
