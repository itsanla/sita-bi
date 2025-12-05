import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { authMiddleware, Role } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/roles.middleware';
import prisma from '../config/database';

const router: Router = Router();

router.use(asyncHandler(authMiddleware));

// Get dosen capacity info
router.get(
  '/dosen-capacity',
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    const dosenList = await prisma.dosen.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const capacityData = await Promise.all(
      dosenList.map(async (dosen) => {
        const current = await prisma.peranDosenTa.count({
          where: {
            dosen_id: dosen.id,
            peran: { in: ['pembimbing1', 'pembimbing2'] },
            tugasAkhir: {
              status: { in: ['BIMBINGAN', 'REVISI', 'DISETUJUI'] },
            },
          },
        });

        const max = 4;
        const available = Math.max(0, max - current);
        const percentage = Math.round((current / max) * 100);

        return {
          dosenId: dosen.id,
          userId: dosen.user.id,
          name: dosen.user.name,
          email: dosen.user.email,
          nip: dosen.nip,
          prodi: dosen.prodi,
          capacity: { current, max, available, percentage },
        };
      }),
    );

    res.status(200).json({
      status: 'sukses',
      data: capacityData,
    });
  }),
);

// Get single dosen capacity
router.get(
  '/dosen-capacity/:dosenId',
  authorizeRoles([Role.admin, Role.jurusan, Role.prodi_d3, Role.prodi_d4]),
  asyncHandler(async (req, res) => {
    const dosenId = parseInt(req.params['dosenId'] ?? '0');

    const current = await prisma.peranDosenTa.count({
      where: {
        dosen_id: dosenId,
        peran: { in: ['pembimbing1', 'pembimbing2'] },
        tugasAkhir: {
          status: { in: ['BIMBINGAN', 'REVISI', 'DISETUJUI'] },
        },
      },
    });

    const max = 4;
    const available = Math.max(0, max - current);
    const percentage = Math.round((current / max) * 100);

    res.status(200).json({
      status: 'sukses',
      data: { current, max, available, percentage },
    });
  }),
);

export default router;
