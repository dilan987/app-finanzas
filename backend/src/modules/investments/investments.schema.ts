import { z } from 'zod';

export const createInvestmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim(),
  type: z.enum(['STOCKS', 'CDT', 'CRYPTO', 'FUND', 'FOREX', 'OTHER'], {
    errorMap: () => ({
      message: 'Type must be STOCKS, CDT, CRYPTO, FUND, FOREX, or OTHER',
    }),
  }),
  amountInvested: z
    .number()
    .positive('Amount invested must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value'),
  currentValue: z
    .number()
    .nonnegative('Current value must be zero or positive')
    .max(9999999999.99, 'Current value exceeds maximum allowed value')
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('COP'),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' }),
  expectedReturn: z
    .number()
    .positive('Expected return must be a positive number')
    .max(999.99, 'Expected return exceeds maximum allowed value')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .trim()
    .nullable()
    .optional(),
});

export const updateInvestmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim()
    .optional(),
  type: z
    .enum(['STOCKS', 'CDT', 'CRYPTO', 'FUND', 'FOREX', 'OTHER'], {
      errorMap: () => ({
        message: 'Type must be STOCKS, CDT, CRYPTO, FUND, FOREX, or OTHER',
      }),
    })
    .optional(),
  amountInvested: z
    .number()
    .positive('Amount invested must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value')
    .optional(),
  currentValue: z
    .number()
    .positive('Current value must be a positive number')
    .max(9999999999.99, 'Current value exceeds maximum allowed value')
    .optional(),
  currency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Must be a valid date string' })
    .optional(),
  expectedReturn: z
    .number()
    .positive('Expected return must be a positive number')
    .max(999.99, 'Expected return exceeds maximum allowed value')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .trim()
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const getInvestmentsQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'], {
      errorMap: () => ({ message: 'isActive must be true or false' }),
    })
    .transform((val) => val === 'true')
    .optional(),
  type: z
    .enum(['STOCKS', 'CDT', 'CRYPTO', 'FUND', 'FOREX', 'OTHER'], {
      errorMap: () => ({
        message: 'Type must be STOCKS, CDT, CRYPTO, FUND, FOREX, or OTHER',
      }),
    })
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type GetInvestmentsQuery = z.infer<typeof getInvestmentsQuerySchema>;
