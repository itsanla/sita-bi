import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .optional(),
  photo: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
