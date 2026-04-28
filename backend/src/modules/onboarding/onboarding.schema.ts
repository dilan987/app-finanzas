import { z } from 'zod';

export const TOUR_STATUS_VALUES = ['NOT_STARTED', 'COMPLETED', 'SKIPPED'] as const;

export const patchTourSchema = z
  .object({
    status: z.enum(TOUR_STATUS_VALUES),
    version: z.string().min(1).max(16).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.status === 'COMPLETED' || data.status === 'SKIPPED') &&
      (data.version === undefined || data.version === null || data.version === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['version'],
        message: 'version is required when status is COMPLETED or SKIPPED',
      });
    }
  });

export type PatchTourInput = z.infer<typeof patchTourSchema>;
