import { z } from 'zod';

export const createCatatanSchema = z.object({
  bimbingan_ta_id: z.number().int('bimbingan_ta_id must be an integer'),
  catatan: z.string().min(1, 'Catatan cannot be empty'),
});

export type CreateCatatanDto = z.infer<typeof createCatatanSchema>;

export const setJadwalSchema = z.object({
  tanggal_bimbingan: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Invalid date string',
    }),
  jam_bimbingan: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
});

export type SetJadwalDto = z.infer<typeof setJadwalSchema>;

export const createSesiSchema = z.object({
  tugas_akhir_id: z.number().int('tugas_akhir_id must be an integer'),
});

export type CreateSesiDto = z.infer<typeof createSesiSchema>;

export const setJadwalSesiSchema = z.object({
  tanggal_bimbingan: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Invalid date string',
    }),
  jam_bimbingan: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  jam_selesai: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
    .optional(),
});

export type SetJadwalSesiDto = z.infer<typeof setJadwalSesiSchema>;
