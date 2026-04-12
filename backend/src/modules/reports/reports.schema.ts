import { z } from 'zod';

export const pdfQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const csvQuerySchema = z.object({
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      message: 'Type must be INCOME or EXPENSE',
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
      message: 'Payment method must be CASH, DEBIT_CARD, CREDIT_CARD, or TRANSFER',
    })
    .optional(),
  minAmount: z.coerce.number().positive('Minimum amount must be positive').optional(),
  maxAmount: z.coerce.number().positive('Maximum amount must be positive').optional(),
  search: z.string().max(200, 'Search query too long').optional(),
});

export type PDFQuery = z.infer<typeof pdfQuerySchema>;
export type CSVQuery = z.infer<typeof csvQuerySchema>;
