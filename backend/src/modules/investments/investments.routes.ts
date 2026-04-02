import { Router } from 'express';
import * as investmentsController from './investments.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createInvestmentSchema,
  updateInvestmentSchema,
  getInvestmentsQuerySchema,
} from './investments.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/investments:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get all investments
 *     description: Returns a paginated list of the authenticated user's investments with optional filters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [STOCKS, CDT, CRYPTO, FUND, FOREX, OTHER]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of investments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Investment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
router.get(
  '/',
  validate({ query: getInvestmentsQuerySchema }),
  (req, res, next) => investmentsController.getAll(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/investments/summary:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get investment portfolio summary
 *     description: Returns aggregated totals for all active investments including total invested, current value, return, and distribution by type.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Investment portfolio summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalInvested:
 *                       type: number
 *                       example: 10000000
 *                     totalCurrentValue:
 *                       type: number
 *                       example: 11500000
 *                     totalReturn:
 *                       type: number
 *                       example: 1500000
 *                     totalReturnPercentage:
 *                       type: number
 *                       example: 15
 *                     activeInvestments:
 *                       type: integer
 *                       example: 4
 *                     distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           totalInvested:
 *                             type: number
 *                           currentValue:
 *                             type: number
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
router.get(
  '/summary',
  (req, res, next) => investmentsController.getSummary(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/investments/{id}:
 *   get:
 *     tags:
 *       - Investments
 *     summary: Get an investment by ID
 *     description: Returns a single investment. Must be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Investment ID
 *     responses:
 *       200:
 *         description: Investment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Investment'
 *                 message:
 *                   type: string
 *       404:
 *         description: Investment not found
 */
router.get(
  '/:id',
  (req, res, next) => investmentsController.getById(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/investments:
 *   post:
 *     tags:
 *       - Investments
 *     summary: Create an investment
 *     description: Creates a new investment for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - amountInvested
 *               - currentValue
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bancolombia CDT
 *               type:
 *                 type: string
 *                 enum: [STOCKS, CDT, CRYPTO, FUND, FOREX, OTHER]
 *                 example: CDT
 *               amountInvested:
 *                 type: number
 *                 example: 5000000
 *               currentValue:
 *                 type: number
 *                 example: 5250000
 *               currency:
 *                 type: string
 *                 default: COP
 *                 example: COP
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-01-15T00:00:00.000Z'
 *               expectedReturn:
 *                 type: number
 *                 example: 12.5
 *               notes:
 *                 type: string
 *                 example: 90-day term
 *     responses:
 *       201:
 *         description: Investment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Investment'
 *                 message:
 *                   type: string
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  validate({ body: createInvestmentSchema }),
  (req, res, next) => investmentsController.create(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/investments/{id}:
 *   put:
 *     tags:
 *       - Investments
 *     summary: Update an investment
 *     description: Updates an investment owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Investment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STOCKS, CDT, CRYPTO, FUND, FOREX, OTHER]
 *               amountInvested:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               currency:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expectedReturn:
 *                 type: number
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Investment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Investment'
 *                 message:
 *                   type: string
 *       404:
 *         description: Investment not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  validate({ body: updateInvestmentSchema }),
  (req, res, next) => investmentsController.update(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/investments/{id}:
 *   delete:
 *     tags:
 *       - Investments
 *     summary: Delete an investment
 *     description: Deletes an investment owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Investment ID
 *     responses:
 *       204:
 *         description: Investment deleted
 *       404:
 *         description: Investment not found
 */
router.delete(
  '/:id',
  (req, res, next) => investmentsController.remove(req as AuthenticatedRequest, res, next),
);

export default router;
