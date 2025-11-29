import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { SidangService } from '../services/sidang.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';

const router: Router = Router();
const sidangService = new SidangService();

router.use(asyncHandler(authMiddleware));

router.get(
  '/unscheduled',
  authorizeRoles([Role.admin]),
  asyncHandler(async (_req, res) => {
    const result = await sidangService.findUnscheduled();
    res.status(200).json({ status: 'sukses', data: result });
  }),
);

export default router;
