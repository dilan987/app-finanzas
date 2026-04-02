import { Router } from 'express';
import * as budgetsController from './budgets.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  getBudgetsQuerySchema,
  getMonthSummaryQuerySchema,
} from './budgets.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/budgets:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get all budgets
 *     description: Returns a paginated list of the authenticated user's budgets with optional month/year filters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Filter by year
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
 *         description: Paginated list of budgets
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
 *                     $ref: '#/components/schemas/Budget'
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
  validate({ query: getBudgetsQuerySchema }),
  (req, res, next) => budgetsController.getAll(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/budgets/summary:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get monthly budget summary
 *     description: Returns each budget for the given month with spent amount, remaining amount, and percentage used.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Year (2000-2100)
 *     responses:
 *       200:
 *         description: Budget summary with spending details
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
 *                     month:
 *                       type: integer
 *                       example: 3
 *                     year:
 *                       type: integer
 *                       example: 2026
 *                     totalBudget:
 *                       type: number
 *                       example: 2000000
 *                     totalSpent:
 *                       type: number
 *                       example: 1500000
 *                     totalRemaining:
 *                       type: number
 *                       example: 500000
 *                     overallPercentage:
 *                       type: number
 *                       example: 75
 *                     budgets:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       422:
 *         description: Validation error
 */
router.get(
  '/summary',
  validate({ query: getMonthSummaryQuerySchema }),
  (req, res, next) => budgetsController.getMonthSummary(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/budgets/{id}:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Get a budget by ID
 *     description: Returns a single budget with its category. Must be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *                 message:
 *                   type: string
 *       404:
 *         description: Budget not found
 */
router.get(
  '/:id',
  (req, res, next) => budgetsController.getById(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/budgets:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Create a budget
 *     description: Creates a new budget for the authenticated user. Only one budget per category per month/year.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - amount
 *               - month
 *               - year
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 500000
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 3
 *               year:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 2100
 *                 example: 2026
 *     responses:
 *       201:
 *         description: Budget created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *                 message:
 *                   type: string
 *       404:
 *         description: Category not found
 *       409:
 *         description: Budget already exists for this category/month/year
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  validate({ body: createBudgetSchema }),
  (req, res, next) => budgetsController.create(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/budgets/{id}:
 *   put:
 *     tags:
 *       - Budgets
 *     summary: Update a budget
 *     description: Updates the amount of a budget owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 600000
 *     responses:
 *       200:
 *         description: Budget updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *                 message:
 *                   type: string
 *       404:
 *         description: Budget not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  validate({ body: updateBudgetSchema }),
  (req, res, next) => budgetsController.update(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/budgets/{id}:
 *   delete:
 *     tags:
 *       - Budgets
 *     summary: Delete a budget
 *     description: Deletes a budget owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       204:
 *         description: Budget deleted
 *       404:
 *         description: Budget not found
 */
router.delete(
  '/:id',
  (req, res, next) => budgetsController.remove(req as AuthenticatedRequest, res, next),
);

export default router;
