import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
  }),
  amount: z
    .number()
    .positive('Amount must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' }),
  paymentMethod: z.enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'], {
    errorMap: () => ({
      message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
    }),
  }),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('COP'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

export const updateTransactionSchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
    })
    .optional(),
  amount: z
    .number()
    .positive('Amount must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .nullable()
    .optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  paymentMethod: z
    .enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'], {
      errorMap: () => ({
        message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
      }),
    })
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
});

export const getTransactionsQuerySchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
    })
    .optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  paymentMethod: z
    .enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'], {
      errorMap: () => ({
        message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
      }),
    })
    .optional(),
  minAmount: z.coerce
    .number()
    .positive('Minimum amount must be positive')
    .optional(),
  maxAmount: z.coerce
    .number()
    .positive('Maximum amount must be positive')
    .optional(),
  search: z.string().max(200, 'Search query too long').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(['date', 'amount', 'createdAt'], {
      errorMap: () => ({ message: 'Sort by must be date, amount, or createdAt' }),
    })
    .default('date'),
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Sort order must be asc or desc' }),
    })
    .default('desc'),
});

export const getMonthlyStatsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;
export type GetMonthlyStatsQuery = z.infer<typeof getMonthlyStatsQuerySchema>;
