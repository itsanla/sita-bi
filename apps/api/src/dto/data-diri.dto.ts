import { z } from 'zod';

export const updateDataDiriSchema = z.object({
  // Data User (umum)
  name: z.string().optional(),
  phone_number: z.string().optional(),
  alamat: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
  tanggal_lahir: z.string().datetime().optional(),
  tempat_lahir: z.string().optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
  photo: z.string().optional(),

  // Data Mahasiswa
  ipk: z.number().min(0).max(4).optional(),

  // Data Dosen
  bidang_keahlian: z.string().optional(),
  jabatan: z.string().optional(),
});

export type UpdateDataDiriDto = z.infer<typeof updateDataDiriSchema>;
