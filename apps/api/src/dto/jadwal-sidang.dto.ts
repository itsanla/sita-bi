import { z } from 'zod';

// Time format validation (HH:MM)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createJadwalSchema = z
  .object({
    sidangId: z.number().int('sidangId must be an integer').positive(),
    tanggal: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Invalid date string',
    }),
    waktu_mulai: z
      .string()
      .min(1, 'Waktu mulai cannot be empty')
      .regex(timeRegex, 'Waktu mulai must be in HH:MM format'),
    waktu_selesai: z
      .string()
      .min(1, 'Waktu selesai cannot be empty')
      .regex(timeRegex, 'Waktu selesai must be in HH:MM format'),
    ruangan_id: z.number().int('ruangan_id must be an integer').positive(),
    pengujiIds: z
      .array(z.number().int().positive())
      .min(2, 'At least two penguji are required')
      .max(4, 'Maximum four penguji allowed'),
  })
  .refine(
    (data) => {
      const [startHour, startMin] = data.waktu_mulai.split(':').map(Number);
      const [endHour, endMin] = data.waktu_selesai.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: 'Waktu selesai must be after waktu mulai',
      path: ['waktu_selesai'],
    },
  );

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().positive().max(100).default(50)),
});

export type CreateJadwalDto = z.infer<typeof createJadwalSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;
