import { z } from 'zod';

export const getMahasiswaStatsQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const getMahasiswaActivitiesQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(z.number().min(1).max(50)),
  }),
});

export const getMahasiswaScheduleQuerySchema = z.object({
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 5))
      .pipe(z.number().min(1).max(20)),
  }),
});

export const getMahasiswaProgressQuerySchema = z.object({
  query: z.object({}).optional(),
});

export const getSystemStatsQuerySchema = z.object({
  query: z.object({}).optional(),
});

export type GetMahasiswaStatsQuery = z.infer<
  typeof getMahasiswaStatsQuerySchema
>;
export type GetMahasiswaActivitiesQuery = z.infer<
  typeof getMahasiswaActivitiesQuerySchema
>;
export type GetMahasiswaScheduleQuery = z.infer<
  typeof getMahasiswaScheduleQuerySchema
>;
export type GetMahasiswaProgressQuery = z.infer<
  typeof getMahasiswaProgressQuerySchema
>;
export type GetSystemStatsQuery = z.infer<typeof getSystemStatsQuerySchema>;
