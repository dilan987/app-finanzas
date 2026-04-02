import { z } from 'zod';

export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const trendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const recommendationsQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
});

export const recommendationIdParamsSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type TrendQuery = z.infer<typeof trendQuerySchema>;
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
