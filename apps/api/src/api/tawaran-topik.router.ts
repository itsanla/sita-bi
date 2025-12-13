import { Router, type Request, type Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { TawaranTopikService } from '../services/tawaran-topik.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import {
  createTawaranTopikSchema,
  checkSimilarityTawaranTopikSchema,
} from '../dto/tawaran-topik.dto';
import { periodeGuard } from '../middlewares/periode.middleware';
import { getMaxSimilaritasPersen } from '../utils/business-rules';

const router: Router = Router();
const tawaranTopikService = new TawaranTopikService();

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));

router.post(
  '/check-similarity',
  periodeGuard(),
  authorizeRoles([Role.dosen]),
  validate(checkSimilarityTawaranTopikSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const SIMILARITY_BLOCK_THRESHOLD = await getMaxSimilaritasPersen();
    const { judul_topik } = req.body;
    const periodeId = req.periode?.id;
    
    if (periodeId === undefined) {
      res.status(403).json({
        status: 'gagal',
        message: 'Periode TA tidak ditemukan',
      });
      return;
    }
    
    const results = await tawaranTopikService.checkSimilarity(judul_topik, periodeId);

    const isBlocked = results.some(
      (result) => result.similarity >= SIMILARITY_BLOCK_THRESHOLD,
    );

    res.status(200).json({
      status: 'sukses',
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
        message: 'Periode TA tidak ditemukan',
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
    console.log('=== TAWARAN TOPIK /available DEBUG ===');
    console.log('Query params:', req.query);
    console.log('User:', req.user?.id, req.user?.roles?.[0]?.name);
    console.log('Periode from guard:', req.periode?.id);
    
    const page =
      req.query['page'] != null
        ? parseInt(req.query['page'] as string)
        : undefined;
    const limit =
      req.query['limit'] != null
        ? parseInt(req.query['limit'] as string)
        : undefined;
    const periodeId = req.query.periode_id ? parseInt(req.query.periode_id as string) : undefined;
    
    console.log('Parsed params - page:', page, 'limit:', limit, 'periodeId:', periodeId);
    
    const availableTopics = await tawaranTopikService.findAvailable(
      page,
      limit,
      periodeId,
    );
    
    console.log('Available topics result:', availableTopics);
    console.log('=== END DEBUG ===');
    
    res.status(200).json({ status: 'sukses', data: availableTopics });
  }),
);

router.post(
  '/:id/take',
  periodeGuard(),
  authorizeRoles([Role.mahasiswa]),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (id == null) {
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
        message: 'Periode TA tidak ditemukan',
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
    console.log('=== DEBUG ENDPOINT ===');
    const allTopics = await tawaranTopikService.getAllTopics(1, 100);
    console.log('All topics in database:', allTopics);
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
