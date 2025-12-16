import { Router, type Request, type Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { TawaranTopikService } from '../services/tawaran-topik.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { createTawaranTopikSchema } from '../dto/tawaran-topik.dto';
import { periodeGuard } from '../middlewares/periode.middleware';

const router: Router = Router();
const tawaranTopikService = new TawaranTopikService();
const PERIODE_NOT_FOUND_MESSAGE = 'Periode TA tidak ditemukan';

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));



router.post(
  '/',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  validate(createTawaranTopikSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (req.user == null) {
      res.status(401).json({ status: 'gagal', message: 'Unauthorized' });
      return;
    }
    const periodeId = req.periode?.id;
    if (periodeId === undefined) {
      res.status(403).json({
        status: 'gagal',
        message: PERIODE_NOT_FOUND_MESSAGE,
      });
      return;
    }
    const newTawaranTopik = await tawaranTopikService.create(
      req.body,
      req.user.id,
      periodeId,
    );
    res.status(201).json({ status: 'sukses', data: newTawaranTopik });
  }),
);

router.get(
  '/',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (req.user == null) {
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
    const tawaranTopik = await tawaranTopikService.findByDosen(
      req.user.id,
      page,
      limit,
    );
    res.status(200).json({ status: 'sukses', data: tawaranTopik });
  }),
);

router.get(
  '/available',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const periodeId =
      req.query.periode_id != null
        ? parseInt(req.query.periode_id as string)
        : undefined;

    const availableTopics = await tawaranTopikService.findAvailable(
      page,
      limit,
      periodeId,
    );

    res.status(200).json({ status: 'sukses', data: availableTopics });
  }),
);

router.post(
  '/:id/take',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null || id === '') {
      res.status(400).json({ status: 'gagal', message: 'ID Topik diperlukan' });
      return;
    }
    const mahasiswaId = req.user?.mahasiswa?.id;
    if (mahasiswaId === undefined) {
      throw new Error('Mahasiswa tidak ditemukan');
    }
    const periodeId = req.periode?.id;
    if (periodeId === undefined) {
      res.status(403).json({
        status: 'gagal',
        message: PERIODE_NOT_FOUND_MESSAGE,
      });
      return;
    }
    const result = await tawaranTopikService.takeTopic(
      parseInt(id, 10),
      mahasiswaId,
      periodeId,
    );
    res.status(201).json({ status: 'sukses', data: result });
  }),
);

router.get(
  '/debug',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const allTopics = await tawaranTopikService.getAllTopics(1, 100);
    res.status(200).json({ status: 'sukses', data: allTopics });
  }),
);

router.get(
  '/all',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const allTopics = await tawaranTopikService.getAllTopics(page, limit);
    res.status(200).json({ status: 'sukses', data: allTopics });
  }),
);

export default router;
