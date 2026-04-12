import { z } from 'zod';

const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  icon: z.string().min(1, 'Icon is required').default('tag'),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color (e.g. #FF5733)')
    .default('#6B7280'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Type must be INCOME or EXPENSE',
  }),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim()
    .optional(),
  icon: z.string().min(1, 'Icon is required').optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color (e.g. #FF5733)')
    .optional(),
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
    })
    .optional(),
});

export const getCategoriesQuerySchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
    })
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
