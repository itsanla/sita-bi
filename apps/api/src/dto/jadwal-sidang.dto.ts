import { z } from 'zod';

export const createJadwalSchema = z.object({
  sidangId: z.number().int('sidangId must be an integer'),
  tanggal: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date string',
  }),
  waktu_mulai: z.string().min(1, 'Waktu mulai cannot be empty'),
  waktu_selesai: z.string().min(1, 'Waktu selesai cannot be empty'),
  ruangan_id: z.number().int('ruangan_id must be an integer'),
  pengujiIds: z
    .array(z.number().int())
    .min(2, 'At least two penguji are required'),
});

export type CreateJadwalDto = z.infer<typeof createJadwalSchema>;
