import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
    message: 'Type must be INCOME, EXPENSE, or TRANSFER',
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
    message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
  }),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('COP'),
  categoryId: z.string().min(1, 'Category ID is required').optional().nullable(),
  accountId: z.string().min(1, 'Account ID is required').optional().nullable(),
  transferAccountId: z.string().min(1, 'Transfer account ID is required').optional().nullable(),
  goalId: z.string().min(1, 'Goal ID is required').optional().nullable(),
}).refine(
  (data) => {
    // TRANSFER requires both accountId and transferAccountId
    if (data.type === 'TRANSFER') {
      return !!data.accountId && !!data.transferAccountId;
    }
    return true;
  },
  { message: 'Transfer transactions require both accountId and transferAccountId', path: ['transferAccountId'] },
).refine(
  (data) => {
    // TRANSFER accounts must be different
    if (data.type === 'TRANSFER' && data.accountId && data.transferAccountId) {
      return data.accountId !== data.transferAccountId;
    }
    return true;
  },
  { message: 'Source and destination accounts must be different', path: ['transferAccountId'] },
).refine(
  (data) => {
    // INCOME and EXPENSE require categoryId
    if (data.type !== 'TRANSFER') {
      return !!data.categoryId;
    }
    return true;
  },
  { message: 'Category is required for income and expense transactions', path: ['categoryId'] },
);

export const updateTransactionSchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
      message: 'Type must be INCOME, EXPENSE, or TRANSFER',
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
      message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
    })
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  categoryId: z.string().min(1, 'Category ID is required').nullable().optional(),
  accountId: z.string().min(1, 'Account ID is required').nullable().optional(),
  transferAccountId: z.string().min(1).nullable().optional(),
  goalId: z.string().min(1).nullable().optional(),
});

export const getTransactionsQuerySchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE', 'TRANSFER'], {
      message: 'Type must be INCOME, EXPENSE, or TRANSFER',
    })
    .optional(),
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  accountId: z.string().min(1, 'Account ID is required').optional(),
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
      message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
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
      message: 'Sort by must be date, amount, or createdAt',
    })
    .default('date'),
  sortOrder: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc',
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
