import type { Request, Response, NextFunction } from 'express';
import { Role } from './auth.middleware';

export { Role };

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    // Implement role hierarchy inheritance
    const userRole = req.user.role;
    let hasPermission = false;

    // Admin override - only if admin is explicitly in allowedRoles
    if (userRole === Role.admin && allowedRoles.includes(Role.admin)) {
      hasPermission = true;
    }
    // Jurusan has access to everything Dosen and Prodi can do (if included in allowedRoles)
    else if (userRole === Role.jurusan) {
      // Jurusan level access - can do anything prodi/dosen tasks if specified
      // Requirement: Inherit all Prodi + Dosen access
      if (
        allowedRoles.includes(Role.jurusan) ||
        allowedRoles.includes(Role.prodi_d3) ||
        allowedRoles.includes(Role.prodi_d4) ||
        allowedRoles.includes(Role.dosen)
      ) {
        hasPermission = true;
      }
    }
    // Prodi inherits Dosen access
    else if (userRole === Role.prodi_d3 || userRole === Role.prodi_d4) {
      if (
        allowedRoles.includes(userRole) ||
        allowedRoles.includes(Role.dosen)
      ) {
        hasPermission = true;
      }
    }
    // Dosen only access Dosen things
    else if (allowedRoles.includes(userRole)) {
      hasPermission = true;
    }

    if (!hasPermission) {
      res
        .status(401)
        .json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }

    next();
  };
};
