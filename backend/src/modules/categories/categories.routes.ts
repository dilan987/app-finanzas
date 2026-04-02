import { Router } from 'express';
import * as categoriesController from './categories.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
} from './categories.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get all categories
 *     description: Returns default categories and the authenticated user's custom categories. Optionally filter by type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *         description: Filter categories by transaction type
 *     responses:
 *       200:
 *         description: List of categories
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
 *                     $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
router.get(
  '/',
  validate({ query: getCategoriesQuerySchema }),
  (req, res, next) => categoriesController.getAll(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get a category by ID
 *     description: Returns a single category. Must be a default category or owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       404:
 *         description: Category not found
 */
router.get(
  '/:id',
  (req, res, next) => categoriesController.getById(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a custom category
 *     description: Creates a new custom category for the authenticated user.
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: Freelance
 *               icon:
 *                 type: string
 *                 example: briefcase
 *               color:
 *                 type: string
 *                 pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
 *                 example: '#10B981'
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *                 example: INCOME
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  validate({ body: createCategorySchema }),
  (req, res, next) => categoriesController.create(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update a custom category
 *     description: Updates a custom category owned by the authenticated user. Default categories cannot be modified.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *                 pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       403:
 *         description: Cannot modify default categories
 *       404:
 *         description: Category not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  validate({ body: updateCategorySchema }),
  (req, res, next) => categoriesController.update(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a custom category
 *     description: Deletes a custom category owned by the authenticated user. Cannot delete default categories or categories with existing transactions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted
 *       403:
 *         description: Cannot delete default categories
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category has associated transactions
 */
router.delete(
  '/:id',
  (req, res, next) => categoriesController.remove(req as AuthenticatedRequest, res, next),
);

export default router;
