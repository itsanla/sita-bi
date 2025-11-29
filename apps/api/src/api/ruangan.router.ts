import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { RuanganService } from '../services/ruangan.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';

const router: Router = Router();
const ruanganService = new RuanganService();

router.get(
  '/',
  asyncHandler(authMiddleware),
  authorizeRoles([Role.admin]),
  asyncHandler(async (_req, res) => {
    const ruangan = await ruanganService.findAll();
    res.status(200).json({ status: 'sukses', data: ruangan });
  }),
);

export default router;
