import { z } from 'zod';
import {
  AudiensPengumuman,
  PrioritasPengumuman,
  KategoriPengumuman,
} from '../prisma-client';

export const createPengumumanSchema = z.object({
  judul: z.string().min(1, 'Judul tidak boleh kosong'),
  isi: z.string().min(1, 'Isi tidak boleh kosong'),
  audiens: z.enum([
    AudiensPengumuman.guest,
    AudiensPengumuman.registered_users,
    AudiensPengumuman.all_users,
    AudiensPengumuman.dosen,
    AudiensPengumuman.mahasiswa,
  ]),
  prioritas: z
    .enum([
      PrioritasPengumuman.RENDAH,
      PrioritasPengumuman.MENENGAH,
      PrioritasPengumuman.TINGGI,
    ])
    .optional(),
  kategori: z
    .enum([
      KategoriPengumuman.AKADEMIK,
      KategoriPengumuman.ADMINISTRASI,
      KategoriPengumuman.KEMAHASISWAAN,
      KategoriPengumuman.LAINNYA,
    ])
    .optional(),
  is_published: z.boolean().optional(),
  scheduled_at: z
    .string()
    .optional()
    .nullable()
    .transform((str) =>
      str !== null && str !== undefined && str !== '' ? new Date(str) : null,
    ),
  berakhir_pada: z
    .string()
    .optional()
    .nullable()
    .transform((str) =>
      str !== null && str !== undefined && str !== '' ? new Date(str) : null,
    ),
  lampiran: z
    .array(
      z.object({
        file_path: z.string(),
        file_name: z.string().optional(),
        file_type: z.string().optional(),
      }),
    )
    .optional(),
});

export type CreatePengumumanDto = z.infer<typeof createPengumumanSchema>;

export const updatePengumumanSchema = createPengumumanSchema.partial();

export type UpdatePengumumanDto = z.infer<typeof updatePengumumanSchema>;
