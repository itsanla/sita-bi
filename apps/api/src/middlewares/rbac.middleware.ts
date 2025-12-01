import type { Request, Response, NextFunction } from 'express';
import { Role } from './auth.middleware';
import prisma from '../config/database';

// Scope validation untuk Kaprodi
export const validateProdiScope = (requiredProdi?: 'D3' | 'D4') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userRole = req.user.role;
    
    // Kajur bypass scope check
    if (userRole === Role.jurusan || userRole === Role.admin) {
      next();
      return;
    }

    // Kaprodi must have matching prodi
    if (userRole === Role.prodi_d3 || userRole === Role.prodi_d4) {
      const userProdi = req.user.dosen?.prodi;
      
      if (!userProdi) {
        res.status(403).json({ message: 'Forbidden: Prodi scope not defined' });
        return;
      }

      if (requiredProdi && userProdi !== requiredProdi) {
        res.status(403).json({ message: `Forbidden: Access limited to ${requiredProdi} only` });
        return;
      }

      next();
      return;
    }

    // Dosen tidak punya scope prodi untuk operasi ini
    res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  };
};

// Relationship validation untuk Dosen
export const validateDosenMahasiswaRelation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const userRole = req.user.role;

  // Kajur & Kaprodi bypass relationship check
  if (userRole === Role.jurusan || userRole === Role.prodi_d3 || userRole === Role.prodi_d4 || userRole === Role.admin) {
    next();
    return;
  }

  // Dosen must have relationship with mahasiswa
  if (userRole === Role.dosen) {
    const mahasiswaId = parseInt(req.params['mahasiswaId'] || req.body['mahasiswa_id'] || (req.query['mahasiswa_id'] as string) || '0');
    
    if (!mahasiswaId) {
      res.status(400).json({ message: 'Mahasiswa ID required' });
      return;
    }

    const dosenId = req.user.dosen?.id;
    if (!dosenId) {
      res.status(403).json({ message: 'Forbidden: Dosen profile not found' });
      return;
    }

    // Check if dosen is assigned to this mahasiswa's tugas akhir
    const tugasAkhir = await prisma.tugasAkhir.findFirst({
      where: {
        mahasiswa_id: mahasiswaId,
        peranDosenTa: {
          some: {
            dosen_id: dosenId,
          },
        },
      },
    });

    if (!tugasAkhir) {
      res.status(403).json({ message: 'Forbidden: You are not assigned to this student' });
      return;
    }

    next();
    return;
  }

  res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
};

// Validate dosen can access tugas akhir
export const validateDosenTugasAkhirAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const userRole = req.user.role;

  // Kajur & Kaprodi bypass
  if (userRole === Role.jurusan || userRole === Role.prodi_d3 || userRole === Role.prodi_d4 || userRole === Role.admin) {
    next();
    return;
  }

  if (userRole === Role.dosen) {
    const tugasAkhirId = parseInt(req.params['tugasAkhirId'] || req.params['id'] || (req.body['tugas_akhir_id'] as string) || '0');
    
    if (!tugasAkhirId) {
      res.status(400).json({ message: 'Tugas Akhir ID required' });
      return;
    }

    const dosenId = req.user.dosen?.id;
    if (!dosenId) {
      res.status(403).json({ message: 'Forbidden: Dosen profile not found' });
      return;
    }

    const assignment = await prisma.peranDosenTa.findFirst({
      where: {
        tugas_akhir_id: tugasAkhirId,
        dosen_id: dosenId,
      },
    });

    if (!assignment) {
      res.status(403).json({ message: 'Forbidden: You are not assigned to this thesis' });
      return;
    }

    next();
    return;
  }

  res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
};

// Check pembimbing capacity (max 4)
export const validatePembimbingCapacity = async (dosenId: number): Promise<{ isValid: boolean; current: number; message?: string }> => {
  const count = await prisma.peranDosenTa.count({
    where: {
      dosen_id: dosenId,
      peran: {
        in: ['pembimbing1', 'pembimbing2'],
      },
      tugasAkhir: {
        status: {
          in: ['BIMBINGAN', 'REVISI', 'DISETUJUI'],
        },
      },
    },
  });

  if (count >= 4) {
    return {
      isValid: false,
      current: count,
      message: `Dosen sudah mencapai kapasitas maksimal (${count}/4 mahasiswa)`,
    };
  }

  return { isValid: true, current: count };
};
