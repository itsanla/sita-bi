import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@repo/db';
import { Role } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const tugasAkhirGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  if (id == null || id === '') {
    res.status(400).json({ message: 'Tugas Akhir ID is required' });
    return;
  }
  const tugasAkhirId = parseInt(id, 10);
  const userId = req.user?.id;
  const userRoles = req.user?.role;

  if (userId === undefined || userRoles === undefined) {
    res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    return;
  }

  if (isNaN(tugasAkhirId)) {
    res.status(400).json({ message: 'Invalid Tugas Akhir ID.' });
    return;
  }

  try {
    const tugasAkhir = await prisma.tugasAkhir.findUnique({
      where: { id: tugasAkhirId },
      include: { mahasiswa: { include: { user: true } } },
    });

    if (tugasAkhir === null) {
      res.status(404).json({ message: 'Tugas Akhir not found.' });
      return;
    }

    // Check if the user has the necessary role to approve/reject
    const allowedRoles = [
      Role.admin,
      Role.jurusan,
      Role.prodi_d3,
      Role.prodi_d4,
    ];
    if (!allowedRoles.includes(userRoles)) {
      res
        .status(403)
        .json({ message: 'Forbidden: Insufficient role permissions.' });
      return;
    }

    // Additional logic from NestJS guard (if any) can be added here.
    // For now, it seems to primarily check roles and existence.

    next();
  } catch (_error) {
    // console.error('TugasAkhirGuard Error:', _error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
