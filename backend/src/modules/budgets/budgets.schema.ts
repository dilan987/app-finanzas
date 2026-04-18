import { z } from 'zod';

export const createBudgetSchema = z.object({
  name: z.string().max(100).default('Presupuesto mensual'),
  type: z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
  categoryId: z.string().min(1).optional().nullable(),
  amount: z
    .number()
    .positive('Amount must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value'),
  month: z
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be between 2000 and 2100')
    .max(2100, 'Year must be between 2000 and 2100'),
});

export const updateBudgetSchema = z.object({
  name: z.string().max(100).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  amount: z
    .number()
    .positive('Amount must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value')
    .optional(),
});

export const getBudgetsQuerySchema = z.object({
  month: z.coerce
    .number()
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12')
    .optional(),
  year: z.coerce
    .number()
    .int('Year must be an integer')
    .min(2000, 'Year must be between 2000 and 2100')
    .max(2100, 'Year must be between 2000 and 2100')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getMonthSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;
export type GetMonthSummaryQuery = z.infer<typeof getMonthSummaryQuerySchema>;
