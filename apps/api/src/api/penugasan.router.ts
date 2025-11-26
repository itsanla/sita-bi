import { Router, type Request, type Response } from 'express';
import asyncHandler from 'express-async-handler';
import {
  assignPengujiSchema,
  PenugasanService,
} from '../services/penugasan.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '@repo/types';
import { assignPembimbingSchema } from '../dto/penugasan.dto';

const router: Router = Router();
const penugasanService = new PenugasanService();

// Apply JWT Auth and Roles Guard globally for this router
// router.use(authMiddleware);

router.get(
  '/dosen-load',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.kajur]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loadData = await penugasanService.getDosenLoad();
    res.status(200).json({ status: 'sukses', data: loadData });
  }),
);

router.get(
  '/unassigned',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.kajur]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const unassignedTugasAkhir =
      await penugasanService.findUnassignedTugasAkhir(page, limit);
    res.status(200).json({ status: 'sukses', data: unassignedTugasAkhir });
  }),
);

router.post(
  '/:tugasAkhirId/assign',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.kajur]),
  validate(assignPembimbingSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (tugasAkhirId == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }

    // Admin ID from token
    if (req.user?.id == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const adminId = req.user.id;

    const assignedPembimbing = await penugasanService.assignPembimbing(
      parseInt(tugasAkhirId, 10),
      req.body,
      adminId,
    );
    res.status(200).json({ status: 'sukses', data: assignedPembimbing });
  }),
);

router.post(
  '/:tugasAkhirId/assign-penguji',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin, Role.kajur]),
  validate(assignPengujiSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { tugasAkhirId } = req.params;
    if (tugasAkhirId == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Tugas Akhir diperlukan' });
      return;
    }

    if (req.user?.id == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const adminId = req.user.id;

    const assigned = await penugasanService.assignPenguji(
      parseInt(tugasAkhirId, 10),
      req.body,
      adminId,
    );
    res.status(200).json({ status: 'sukses', data: assigned });
  }),
);

export default router;
