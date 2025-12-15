import { z } from 'zod';

export const assignPembimbingSchema = z
  .object({
    pembimbing1Id: z.number().int('Pembimbing 1 ID must be an integer'),
    pembimbing2Id: z
      .number()
      .int('Pembimbing 2 ID must be an integer')
      .optional(),
  })
  .refine(
    (data) => {
      return !(
        data.pembimbing2Id != null && data.pembimbing1Id === data.pembimbing2Id
      );
    },
    {
      message: 'Pembimbing 2 tidak boleh sama dengan Pembimbing 1.',
      path: ['pembimbing2Id'],
    },
  );

export type AssignPembimbingDto = z.infer<typeof assignPembimbingSchema>;
