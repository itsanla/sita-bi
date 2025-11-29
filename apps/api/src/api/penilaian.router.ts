import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { PenilaianService } from '../services/penilaian.service';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import { validate } from '../middlewares/validation.middleware';
import { Role } from '../middlewares/auth.middleware';
import { createPenilaianSchema } from '../dto/penilaian.dto';

const router: Router = Router();
const penilaianService = new PenilaianService();

// Apply JWT Auth and Roles Guard globally for this router
router.use(asyncHandler(authMiddleware));

router.post(
  '/',
  authorizeRoles([Role.dosen]),
  validate(createPenilaianSchema),
  asyncHandler(async (req, res): Promise<void> => {
    const dosenId = req.user?.dosen?.id;
    if (dosenId === undefined) {
      res.status(401).json({
        status: 'gagal',
        message: 'Akses ditolak: Pengguna tidak memiliki profil dosen.',
      });
      return;
    }
    const newNilai = await penilaianService.createNilai(req.body, dosenId);
    res.status(201).json({ status: 'sukses', data: newNilai });
  }),
);

router.get(
  '/sidang/:sidangId',
  // Accessible by all authenticated users (dosen, mahasiswa, admin)
  // No specific role check here, but still requires authentication
  asyncHandler(async (req, res): Promise<void> => {
    const { sidangId } = req.params;
    if (sidangId == null) {
      res
        .status(400)
        .json({ status: 'gagal', message: 'ID Sidang diperlukan' });
      return;
    }
    const nilai = await penilaianService.getNilaiForSidang(
      parseInt(sidangId, 10),
    );
    res.status(200).json({ status: 'sukses', data: nilai });
  }),
);

export default router;
