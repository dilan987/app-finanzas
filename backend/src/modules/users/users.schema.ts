import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .trim()
      .optional(),
    mainCurrency: z
      .string()
      .min(1, 'Currency code is required')
      .max(10, 'Currency code is too long')
      .optional(),
    timezone: z
      .string()
      .min(1, 'Timezone is required')
      .optional(),
    biweeklyCustomEnabled: z.boolean().optional(),
    biweeklyStartDay1: z.number().int().min(1).max(31).nullable().optional(),
    biweeklyStartDay2: z.number().int().min(1).max(31).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.biweeklyCustomEnabled === true) {
      if (data.biweeklyStartDay1 == null || data.biweeklyStartDay2 == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['biweeklyStartDay1'],
          message: 'Both biweeklyStartDay1 and biweeklyStartDay2 are required when custom is enabled',
        });
      } else if (data.biweeklyStartDay1 === data.biweeklyStartDay2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['biweeklyStartDay2'],
          message: 'biweeklyStartDay1 and biweeklyStartDay2 must be different',
        });
      }
    }
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
