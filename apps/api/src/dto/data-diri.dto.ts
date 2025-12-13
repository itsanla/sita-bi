import { z } from 'zod';

export const updateDataDiriSchema = z.object({
  // Data User (umum)
  name: z.string().optional(),
  phone_number: z.string().optional(),
  alamat: z.string().nullable().optional(),
  tanggal_lahir: z.string().optional(),
  tempat_lahir: z.string().nullable().optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).nullable().optional(),
  photo: z.string().optional(),

  // Data Mahasiswa
  ipk: z.number().min(0).max(4).optional(),

  // Data Dosen
  bidang_keahlian: z.string().nullable().optional(),
  jabatan: z.string().nullable().optional(),
});

export type UpdateDataDiriDto = z.infer<typeof updateDataDiriSchema>;

export const updatePasswordSchema = z
  .object({
    password_lama: z.string().min(1, 'Password lama harus diisi'),
    password_baru: z.string().min(8, 'Password baru minimal 8 karakter'),
    konfirmasi_password: z.string().min(1, 'Konfirmasi password harus diisi'),
  })
  .refine((data) => data.password_baru === data.konfirmasi_password, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasi_password'],
  });

export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;

export const requestEmailOtpSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
  email_baru: z.string().email('Format email tidak valid'),
});

export type RequestEmailOtpDto = z.infer<typeof requestEmailOtpSchema>;

export const verifyEmailOtpSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation
  email_baru: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'OTP harus 6 digit'),
});

export type VerifyEmailOtpDto = z.infer<typeof verifyEmailOtpSchema>;
