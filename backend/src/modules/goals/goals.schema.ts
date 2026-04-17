import { z } from 'zod';

// ── Base fields shared by both DEBT and SAVINGS ──────────────────
const goalBaseFields = {
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .nullable()
    .optional(),
  targetAmount: z
    .number()
    .positive('Target amount must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value'),
};

// ── DEBT creation variant ────────────────────────────────────────
const createDebtGoalSchema = z.object({
  ...goalBaseFields,
  type: z.literal('DEBT'),
  plannedInstallments: z
    .number()
    .int('Installments must be a whole number')
    .min(1, 'Must have at least 1 installment')
    .max(120, 'Maximum 120 installments'),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(2000).max(2100),
});

// ── SAVINGS creation variant ─────────────────────────────────────
const createSavingsGoalSchema = z.object({
  ...goalBaseFields,
  type: z.literal('SAVINGS'),
  contributionFrequency: z
    .enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY'], {
      message: 'Contribution frequency must be WEEKLY, BIWEEKLY, or MONTHLY',
    })
    .optional(),
  plannedContribution: z
    .number()
    .positive('Planned contribution must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value')
    .optional(),
});

// ── Discriminated union for create ───────────────────────────────
export const createGoalSchema = z.discriminatedUnion('type', [
  createDebtGoalSchema,
  createSavingsGoalSchema,
]);

// ── Update schema ────────────────────────────────────────────────
export const updateGoalSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .nullable()
    .optional(),
  // DEBT-only update field
  plannedInstallments: z
    .number()
    .int('Installments must be a whole number')
    .min(1, 'Must have at least 1 installment')
    .max(120, 'Maximum 120 installments')
    .optional(),
  // SAVINGS-only update fields
  contributionFrequency: z
    .enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY'], {
      message: 'Contribution frequency must be WEEKLY, BIWEEKLY, or MONTHLY',
    })
    .nullable()
    .optional(),
  plannedContribution: z
    .number()
    .positive('Planned contribution must be a positive number')
    .max(9999999999.99, 'Amount exceeds maximum allowed value')
    .nullable()
    .optional(),
});

export const getGoalsQuerySchema = z.object({
  status: z
    .enum(['ACTIVE', 'COMPLETED', 'CANCELLED'], {
      message: 'Status must be ACTIVE, COMPLETED, or CANCELLED',
    })
    .optional(),
  type: z
    .enum(['DEBT', 'SAVINGS'], {
      message: 'Type must be DEBT or SAVINGS',
    })
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const activeForMonthQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const linkTransactionSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GetGoalsQuery = z.infer<typeof getGoalsQuerySchema>;
export type ActiveForMonthQuery = z.infer<typeof activeForMonthQuerySchema>;
export type LinkTransactionInput = z.infer<typeof linkTransactionSchema>;
