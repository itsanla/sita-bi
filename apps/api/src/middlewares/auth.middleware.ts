import type { Request, Response, NextFunction } from 'express';
// import type { Role } from '@repo/types'; // Avoid importing outside rootDir to fix build error
import prisma from '../config/database';

// Define Role locally to avoid rootDir error
export enum Role {
  mahasiswa = 'mahasiswa',
  dosen = 'dosen',
  admin = 'admin',
  jurusan = 'jurusan',
  prodi_d3 = 'prodi_d3',
  prodi_d4 = 'prodi_d4',
}

/**
 * Simple auth middleware using x-user-id header
 * User ID is stored in localStorage and sent via header
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'];

    if (userId == null || typeof userId !== 'string') {
      res.status(401).json({ message: 'Unauthorized: No user ID provided' });
      return;
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      res.status(401).json({ message: 'Unauthorized: Invalid user ID' });
      return;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      include: {
        dosen: true,
        mahasiswa: true,
        roles: true,
      },
    });

    if (user == null) {
      res.status(401).json({ message: 'Unauthorized: User not found' });
      return;
    }

    if (user.roles.length === 0) {
      res.status(401).json({ message: 'Unauthorized: User has no roles' });
      return;
    }

    const userRole = user.roles[0];
    if (userRole == null) {
      res.status(401).json({ message: 'Unauthorized: User role not found' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: userRole.name as Role,
      dosen:
        user.dosen != null
          ? {
              id: user.dosen.id,
              nip: user.dosen.nip,
              prodi: user.dosen.prodi,
            }
          : null,
      mahasiswa:
        user.mahasiswa != null
          ? {
              id: user.mahasiswa.id,
              nim: user.mahasiswa.nim,
            }
          : null,
    };

    next();
  } catch (error: unknown) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Keep the old middleware name for backward compatibility
export const insecureAuthMiddleware = authMiddleware;

// Export as authenticate for consistency with other parts of the codebase
export const authenticate = authMiddleware;

// Export as authenticateJWT to match other files usage
export const authenticateJWT = authMiddleware;
