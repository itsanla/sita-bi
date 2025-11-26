export declare enum Role {
    mahasiswa = "mahasiswa",
    dosen = "dosen",
    admin = "admin",
    kajur = "kajur",
    kaprodi_d3 = "kaprodi_d3",
    kaprodi_d4 = "kaprodi_d4"
}
export interface DosenProfile {
    id: number;
    nip: string;
}
export interface MahasiswaProfile {
    id: number;
    nim: string;
}
export interface CustomUser {
    id: number;
    email: string;
    role: Role;
    dosen?: DosenProfile | null;
    mahasiswa?: MahasiswaProfile | null;
}
declare global {
    namespace Express {
        interface User extends CustomUser {
        }
    }
}
//# sourceMappingURL=index.d.ts.map