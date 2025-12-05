import { z } from 'zod';

export const updatePengaturanSchema = z.object({
  max_similaritas_persen: z
    .number()
    .min(0, 'Persentase tidak boleh kurang dari 0')
    .max(100, 'Persentase tidak boleh lebih dari 100')
    .optional(),
  min_bimbingan_valid: z
    .number()
    .int('Jumlah bimbingan harus bilangan bulat')
    .min(1, 'Minimal 1 sesi bimbingan')
    .optional(),
  ruangan_sidang: z
    .array(z.string().min(1, 'Nama ruangan tidak boleh kosong'))
    .min(1, 'Minimal harus ada 1 ruangan')
    .optional(),
  max_pembimbing_aktif: z
    .number()
    .int('Jumlah pembimbing harus bilangan bulat')
    .min(1, 'Minimal 1 mahasiswa')
    .optional(),
  durasi_sidang_menit: z
    .number()
    .int('Durasi harus bilangan bulat')
    .min(30, 'Minimal 30 menit')
    .optional(),
  batas_revisi_hari: z
    .number()
    .int('Batas revisi harus bilangan bulat')
    .min(1, 'Minimal 1 hari')
    .optional(),
});

export type UpdatePengaturanDto = z.infer<typeof updatePengaturanSchema>;
