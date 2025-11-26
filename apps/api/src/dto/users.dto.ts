import { z } from 'zod';
import { Prodi } from '@repo/db';
import { Role } from '@repo/types';

const validRoles = [Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4, Role.dosen];

export const createDosenSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  nidn: z.string().min(1, 'NIDN cannot be empty'),
  phone_number: z.string().optional(),
  prodi: z.enum([Prodi.D3, Prodi.D4]).optional(),
  roles: z
    .array(z.enum([Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4, Role.dosen]))
    .optional()
    .refine(
      (roles) => {
        if (roles) {
          return roles.every((role) => validRoles.includes(role));
        }
        return true;
      },
      { message: `Invalid role(s). Valid roles are: ${validRoles.join(', ')}` },
    ),
});

export type CreateDosenDto = z.infer<typeof createDosenSchema>;

export const updateDosenSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  nidn: z.string().optional(),
  prodi: z.enum([Prodi.D3, Prodi.D4]).optional(),
  roles: z
    .array(z.enum([Role.kajur, Role.kaprodi_d3, Role.kaprodi_d4, Role.dosen]))
    .optional()
    .refine(
      (roles) => {
        if (roles) {
          return roles.every((role) => validRoles.includes(role));
        }
        return true;
      },
      { message: `Invalid role(s). Valid roles are: ${validRoles.join(', ')}` },
    ),
});

export type UpdateDosenDto = z.infer<typeof updateDosenSchema>;

export const createMahasiswaSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty'),
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  nim: z.string().min(1, 'NIM cannot be empty'),
  prodi: z.enum([Prodi.D3, Prodi.D4]),
  kelas: z.string().min(1, 'Kelas cannot be empty'),
  phone_number: z.string().optional(),
});

export type CreateMahasiswaDto = z.infer<typeof createMahasiswaSchema>;

export const updateMahasiswaSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  nim: z.string().optional(),
  prodi: z.enum([Prodi.D3, Prodi.D4]).optional(),
  kelas: z.string().optional(),
});

export type UpdateMahasiswaDto = z.infer<typeof updateMahasiswaSchema>;
