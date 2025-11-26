import type { Role } from '../middlewares/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
        dosen?: {
          id: number;
          nip: string;
          prodi?: 'D3' | 'D4' | null;
        } | null;
        mahasiswa?: {
          id: number;
          nim: string;
        } | null;
        phone_number?: string;
      };
    }
  }
}

export {};
