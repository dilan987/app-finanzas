import { Router } from 'express';
import * as recurringController from './recurring.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createRecurringSchema,
  updateRecurringSchema,
  toggleActiveSchema,
  getRecurringQuerySchema,
} from './recurring.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/recurring:
 *   get:
 *     tags:
 *       - Recurring Transactions
 *     summary: Get all recurring transactions
 *     description: Returns a paginated list of the authenticated user's recurring transactions with optional filters.
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
 *           enum: [INCOME, EXPENSE]
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
 *         description: Paginated list of recurring transactions
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
 *                     $ref: '#/components/schemas/RecurringTransaction'
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
  validate({ query: getRecurringQuerySchema }),
  (req, res, next) => recurringController.getAll(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring/{id}:
 *   get:
 *     tags:
 *       - Recurring Transactions
 *     summary: Get a recurring transaction by ID
 *     description: Returns a single recurring transaction with its category. Must be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recurring transaction ID
 *     responses:
 *       200:
 *         description: Recurring transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Recurring transaction not found
 */
router.get(
  '/:id',
  (req, res, next) => recurringController.getById(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring:
 *   post:
 *     tags:
 *       - Recurring Transactions
 *     summary: Create a recurring transaction
 *     description: Creates a new recurring transaction for the authenticated user.
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
 *               - categoryId
 *               - frequency
 *               - nextExecutionDate
 *               - paymentMethod
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: EXPENSE
 *               amount:
 *                 type: number
 *                 example: 80000
 *               description:
 *                 type: string
 *                 example: Netflix subscription
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY]
 *                 example: MONTHLY
 *               nextExecutionDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-04-01T00:00:00.000Z'
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *                 example: CREDIT_CARD
 *               currency:
 *                 type: string
 *                 default: COP
 *                 example: COP
 *     responses:
 *       201:
 *         description: Recurring transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Category not found
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  validate({ body: createRecurringSchema }),
  (req, res, next) => recurringController.create(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring/{id}:
 *   put:
 *     tags:
 *       - Recurring Transactions
 *     summary: Update a recurring transaction
 *     description: Updates a recurring transaction owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recurring transaction ID
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
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY]
 *               nextExecutionDate:
 *                 type: string
 *                 format: date-time
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, DEBIT_CARD, CREDIT_CARD, TRANSFER]
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recurring transaction updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Recurring transaction not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  validate({ body: updateRecurringSchema }),
  (req, res, next) => recurringController.update(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring/{id}/toggle:
 *   patch:
 *     tags:
 *       - Recurring Transactions
 *     summary: Toggle active status
 *     description: Pauses or resumes a recurring transaction.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recurring transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Recurring transaction toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *                 message:
 *                   type: string
 *       404:
 *         description: Recurring transaction not found
 *       422:
 *         description: Validation error
 */
router.patch(
  '/:id/toggle',
  validate({ body: toggleActiveSchema }),
  (req, res, next) => recurringController.toggleActive(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring/{id}:
 *   delete:
 *     tags:
 *       - Recurring Transactions
 *     summary: Delete a recurring transaction
 *     description: Deletes a recurring transaction owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recurring transaction ID
 *     responses:
 *       204:
 *         description: Recurring transaction deleted
 *       404:
 *         description: Recurring transaction not found
 */
router.delete(
  '/:id',
  (req, res, next) => recurringController.remove(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/recurring/process:
 *   post:
 *     tags:
 *       - Recurring Transactions
 *     summary: Process due recurring transactions
 *     description: Processes all active recurring transactions whose next execution date has passed. Creates corresponding transactions and updates next execution dates.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing results
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
 *                     processed:
 *                       type: integer
 *                       example: 5
 *                     errors:
 *                       type: integer
 *                       example: 0
 *                     total:
 *                       type: integer
 *                       example: 5
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
router.post(
  '/process',
  (req, res, next) => recurringController.processRecurring(req as AuthenticatedRequest, res, next),
);

export default router;
