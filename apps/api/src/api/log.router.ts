import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { LogService } from '../services/log.service';
import {
  authMiddleware,
  insecureAuthMiddleware,
} from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { Role } from '../middlewares/auth.middleware';

const router: Router = Router();
const logService = new LogService();

// Apply JWT Auth and Roles Guard globally for this router
// router.use(authMiddleware);

router.get(
  '/',
  authMiddleware,
  authorizeRoles([Role.admin]),
  asyncHandler(async (req, res): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;

    // Ensure filters are strings and respect exactOptionalPropertyTypes
    const filters: { 
      module?: string; 
      user_id?: string; 
      entity_id?: string;
      date?: string;
    } = {};

    if (typeof req.query['module'] === 'string') {
      filters.module = req.query['module'];
    }
    if (typeof req.query['user_id'] === 'string') {
      filters.user_id = req.query['user_id'];
    }
    if (typeof req.query['entity_id'] === 'string') {
      filters.entity_id = req.query['entity_id'];
    }
    if (typeof req.query['date'] === 'string') {
      filters.date = req.query['date']; // Format: YYYY-MM-DD
    }

    const logs = await logService.findAll(page, limit, filters);
    res.status(200).json({ status: 'sukses', data: logs });
  }),
);

// Endpoint to get logs for the current logged-in user (Mahasiswa/Dosen viewing their own history)
router.get(
  '/me',
  asyncHandler(insecureAuthMiddleware),
  asyncHandler(async (req, res): Promise<void> => {
    const userId = req.user?.id;
    if (userId == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
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
    // Reuse findAll with user_id filter
    const filters = {
      user_id: userId.toString(),
    };
    const logs = await logService.findAll(page, limit, filters);
    res.status(200).json({ status: 'sukses', data: logs });
  }),
);

export default router;
