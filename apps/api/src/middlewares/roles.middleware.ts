import type { Request, Response, NextFunction } from 'express';
// import type { Role } from '@repo/types'; // Fix rootDir error

// Define Role locally
export enum Role {
  mahasiswa = 'mahasiswa',
  dosen = 'dosen',
  admin = 'admin',
  kajur = 'kajur',
  kaprodi_d3 = 'kaprodi_d3',
  kaprodi_d4 = 'kaprodi_d4',
}

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    // Implement role hierarchy inheritance
    const userRole = req.user.role as Role;
    let hasPermission = false;

    // Kajur has access to everything Dosen and Kaprodi can do (if included in allowedRoles)
    if (userRole === Role.kajur) {
      // Kajur basically can do anything admin/dosen/kaprodi tasks if specified?
      // For now, if allowedRoles contains 'kajur', 'kaprodi', or 'dosen', Kajur should pass?
      // Requirement: Inherit all Kaprodi + Dosen access
      if (
        allowedRoles.includes(Role.kajur) ||
        allowedRoles.includes(Role.kaprodi_d3) ||
        allowedRoles.includes(Role.kaprodi_d4) ||
        allowedRoles.includes(Role.dosen)
      ) {
        hasPermission = true;
      }
    }
    // Kaprodi inherits Dosen access
    else if (userRole === Role.kaprodi_d3 || userRole === Role.kaprodi_d4) {
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

    // Admin override
    if (userRole === Role.admin) {
      hasPermission = true;
    }

    if (!hasPermission) {
      res
        .status(403)
        .json({ message: 'Forbidden: Insufficient role permissions' });
      return;
    }

    next();
  };
};
