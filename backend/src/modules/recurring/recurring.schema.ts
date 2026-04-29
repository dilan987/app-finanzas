import { z } from 'zod';

export const createRecurringSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    message: 'Type must be INCOME or EXPENSE',
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
  categoryId: z.string().min(1, 'Category ID is required'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY', 'ONCE'], {
    message: 'Frequency must be DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY, or ONCE',
  }),
  nextExecutionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' }),
  paymentMethod: z.enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'], {
    message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
  }),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('COP'),
  accountId: z.string().min(1, 'Account ID is required').optional().nullable(),
  goalId: z.string().min(1, 'Goal ID is required').optional().nullable(),
});

export const updateRecurringSchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
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
  categoryId: z.string().min(1, 'Category ID is required').optional(),
  frequency: z
    .enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'], {
      message: 'Frequency must be DAILY, WEEKLY, BIWEEKLY, MONTHLY, or YEARLY',
    })
    .optional(),
  nextExecutionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  paymentMethod: z
    .enum(['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'TRANSFER'], {
      message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
    })
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  accountId: z.string().min(1, 'Account ID is required').nullable().optional(),
  goalId: z.string().min(1, 'Goal ID is required').nullable().optional(),
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean({ message: 'isActive is required' }),
});

export const getRecurringQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'], {
      message: 'isActive must be true or false',
    })
    .transform((val) => val === 'true')
    .optional(),
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
    })
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
export type GetRecurringQuery = z.infer<typeof getRecurringQuerySchema>;
