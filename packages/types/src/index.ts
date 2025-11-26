export enum Role {
  mahasiswa = 'mahasiswa',
  dosen = 'dosen',
  admin = 'admin',
  kajur = 'kajur',
  kaprodi_d3 = 'kaprodi_d3',
  kaprodi_d4 = 'kaprodi_d4',
}

export interface DosenProfile {
  id: number;
  nidn: string;
}

export interface MahasiswaProfile {
  id: number;
  nim: string;
}

// This is the structure of our custom user object
export interface CustomUser {
  id: number;
  email: string;
  role: Role;
  dosen?: DosenProfile | null;
  mahasiswa?: MahasiswaProfile | null;
}

// This block extends the global Express namespace
declare global {
  namespace Express {
    // Augment the User interface to include our custom properties
    // eslint-disable-next-line @typescript-eslint/no-empty-object-types
    interface User extends CustomUser {}
  }
}
