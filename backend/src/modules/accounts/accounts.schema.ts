import { z } from 'zod';

const ACCOUNT_TYPES = [
  'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH', 'NEOBANK', 'INVESTMENT', 'LOAN', 'OTHER',
] as const;

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').trim(),
  type: z.enum(ACCOUNT_TYPES, { message: 'Invalid account type' }),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('COP'),
  initialBalance: z.number().max(9999999999.99, 'Amount exceeds maximum').default(0),
  institutionName: z.string().max(100).trim().nullable().optional(),
  color: z.string().max(20).default('#3B82F6'),
  icon: z.string().max(50).default('wallet'),
  includeInBudget: z.boolean().default(true),
  includeInTotal: z.boolean().default(true),
  notes: z.string().max(500).trim().nullable().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.string().length(3).optional(),
  institutionName: z.string().max(100).trim().nullable().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  includeInBudget: z.boolean().optional(),
  includeInTotal: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: z.string().max(500).trim().nullable().optional(),
});

export const getAccountsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  includeInBudget: z.coerce.boolean().optional(),
});

export const reorderAccountsSchema = z.object({
  accounts: z.array(z.object({
    id: z.string().min(1),
    sortOrder: z.number().int().min(0),
  })),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type GetAccountsQuery = z.infer<typeof getAccountsQuerySchema>;
export type ReorderAccountsInput = z.infer<typeof reorderAccountsSchema>;
