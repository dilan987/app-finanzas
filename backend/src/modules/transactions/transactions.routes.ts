import { Router } from 'express';
import * as transactionsController from './transactions.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  getMonthlyStatsQuerySchema,
} from './transactions.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get all transactions
 *     description: Returns a paginated list of the authenticated user's transactions with optional filters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in transaction description
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, createdAt]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of transactions
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
 *                     $ref: '#/components/schemas/Transaction'
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
  validate({ query: getTransactionsQuerySchema }),
  (req, res, next) => transactionsController.getAll(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/transactions/stats/monthly:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get monthly transaction statistics
 *     description: Returns aggregated income, expense, and balance totals for a given month.
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
 *         description: Monthly statistics
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
 *                     totalIncome:
 *                       type: number
 *                       example: 5000000
 *                     totalExpense:
 *                       type: number
 *                       example: 3200000
 *                     balance:
 *                       type: number
 *                       example: 1800000
 *                     transactionCount:
 *                       type: integer
 *                       example: 42
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       422:
 *         description: Validation error
 */
router.get(
  '/stats/monthly',
  validate({ query: getMonthlyStatsQuerySchema }),
  (req, res, next) => transactionsController.getMonthlyStats(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get a transaction by ID
 *     description: Returns a single transaction with its category. Must be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/:id',
  (req, res, next) => transactionsController.getById(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a transaction
 *     description: Creates a new transaction for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - date
 *               - paymentMethod
 *               - categoryId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *               amount:
 *                 type: number
 *                 example: 150000
 *               description:
 *                 type: string
 *                 example: Grocery shopping
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-03-29T12:00:00.000Z'
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *                 example: DEBIT_CARD
 *               currency:
 *                 type: string
 *                 default: COP
 *                 example: COP
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Category not found
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  validate({ body: createTransactionSchema }),
  (req, res, next) => transactionsController.create(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/transactions/{id}:
 *   put:
 *     tags:
 *       - Transactions
 *     summary: Update a transaction
 *     description: Updates a transaction owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *               currency:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Transaction not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  validate({ body: updateTransactionSchema }),
  (req, res, next) => transactionsController.update(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/transactions/{id}:
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete a transaction
 *     description: Deletes a transaction owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       204:
 *         description: Transaction deleted
 *       404:
 *         description: Transaction not found
 */
router.delete(
  '/:id',
  (req, res, next) => transactionsController.remove(req as AuthenticatedRequest, res, next),
);

export default router;
