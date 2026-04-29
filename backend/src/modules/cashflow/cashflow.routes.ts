import { Router } from 'express';
import * as cashflowController from './cashflow.controller';
import { validate } from '../../middlewares/validate.middleware';
import { biweeklyQuerySchema } from './cashflow.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/cashflow/biweekly:
 *   get:
 *     tags:
 *       - Cashflow
 *     summary: Get biweekly cashflow for the selected month
 *     description: Groups the user's real transactions of the requested month into two biweekly buckets, using calendar defaults (1–15 / 16–end) or the user's custom cycle config (e.g. 30/15).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 12 }
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer, minimum: 2000, maximum: 2100 }
 *     responses:
 *       200: { description: Biweekly cashflow }
 *       401: { description: Authentication required }
 *       422: { description: Validation error }
 */
router.get(
  '/biweekly',
  validate({ query: biweeklyQuerySchema }),
  (req, res, next) => cashflowController.getBiweekly(req as AuthenticatedRequest, res, next),
);

export default router;
