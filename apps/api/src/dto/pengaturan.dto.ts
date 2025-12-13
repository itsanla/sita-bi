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
  max_mahasiswa_uji_per_dosen: z
    .number()
    .int('Jumlah mahasiswa uji harus bilangan bulat')
    .min(1, 'Minimal 1 mahasiswa')
    .optional(),
  durasi_sidang_menit: z
    .number()
    .int('Durasi harus bilangan bulat')
    .min(30, 'Minimal 30 menit')
    .optional(),
  jeda_sidang_menit: z
    .number()
    .int('Jeda harus bilangan bulat')
    .min(0, 'Minimal 0 menit')
    .optional(),
  jam_mulai_sidang: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm')
    .optional(),
  jam_selesai_sidang: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm')
    .optional(),
  waktu_istirahat: z
    .array(
      z.object({
        waktu: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm'),
        durasi_menit: z.number().int().min(15, 'Minimal 15 menit'),
      }),
    )
    .optional(),
  jadwal_hari_khusus: z
    .array(
      z.object({
        hari: z.string(),
        jam_mulai: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm'),
        jam_selesai: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm'),
        durasi_sidang_menit: z.number().int().min(30, 'Minimal 30 menit').optional(),
        jeda_sidang_menit: z.number().int().min(0, 'Minimal 0 menit').optional(),
        waktu_istirahat: z
          .array(
            z.object({
              waktu: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format jam harus HH:mm'),
              durasi_menit: z.number().int().min(15, 'Minimal 15 menit'),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  hari_libur_tetap: z
    .array(z.string())
    .optional(),
  tanggal_libur_khusus: z
    .array(
      z.object({
        tanggal: z.string(),
        keterangan: z.string(),
      }),
    )
    .optional(),
  syarat_pendaftaran_sidang: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
      }),
    )
    .min(1, 'Minimal harus ada 1 syarat')
    .optional(),
  validasi_pendaftaran_sidang_aktif: z.boolean().optional(),
  validasi_pembimbing_1: z.boolean().optional(),
  validasi_pembimbing_2: z.boolean().optional(),
  validasi_prodi: z.boolean().optional(),
  validasi_jurusan: z.boolean().optional(),
  rumus_penilaian: z
    .string()
    .min(1, 'Rumus penilaian tidak boleh kosong')
    .optional(),
  nilai_minimal_lolos: z
    .number()
    .min(0, 'Nilai minimal tidak boleh kurang dari 0')
    .max(100, 'Nilai minimal tidak boleh lebih dari 100')
    .optional(),
  tampilkan_rincian_nilai_ke_sekretaris: z.boolean().optional(),
  cek_similaritas_semua_periode: z.boolean().optional(),
  nonaktifkan_cek_similaritas: z.boolean().optional(),
});

export type UpdatePengaturanDto = z.infer<typeof updatePengaturanSchema>;
