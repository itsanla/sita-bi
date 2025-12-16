import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 * JWT auth middleware
 * Verifies JWT token from Authorization header
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? 'your-secret-key',
    ) as {
      userId: number;
      email: string;
      role: string;
      roles?: { name: string }[];
      dosen?: { id: number; nip: string; prodi: string } | null;
      mahasiswa?: { id: number; nim: string } | null;
    };

    // Use data from JWT payload (no database query needed)
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role as Role,
      roles: decoded.roles || [{ name: decoded.role }],
      dosen: decoded.dosen ?? null,
      mahasiswa: decoded.mahasiswa ?? null,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Unauthorized: Token expired' });
      return;
    }
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
