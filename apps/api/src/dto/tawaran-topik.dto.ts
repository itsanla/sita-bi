import { z } from 'zod';

export const createTawaranTopikSchema = z.object({
  judul_topik: z.string().min(1, 'Judul topik tidak boleh kosong'),
  deskripsi: z.string().min(1, 'Deskripsi tidak boleh kosong'),
});

export const checkSimilarityTawaranTopikSchema = z.object({
  judul_topik: z.string().min(1, 'Judul topik tidak boleh kosong'),
});

export type CreateTawaranTopikDto = z.infer<typeof createTawaranTopikSchema>;
