import { Router } from 'express';
import * as usersController from './users.controller';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from './users.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information (excludes password).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.get(
  '/profile',
  (req, res, next) => usersController.getProfile(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/users/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile fields (name, mainCurrency, timezone).
 *     security:
 *       - bearerAuth: []
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
 *                 example: Jane Doe
 *               mainCurrency:
 *                 type: string
 *                 example: USD
 *               timezone:
 *                 type: string
 *                 example: America/New_York
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/profile',
  validate({ body: updateProfileSchema }),
  (req, res, next) => usersController.updateProfile(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/users/change-password:
 *   put:
 *     tags:
 *       - Users
 *     summary: Change the current user's password
 *     description: Verifies the current password and updates to a new one.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldP@ssw0rd
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, number, and special character
 *                 example: NewP@ssw0rd
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/change-password',
  validate({ body: changePasswordSchema }),
  (req, res, next) => usersController.changePassword(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/users/account:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete the current user's account
 *     description: Permanently deletes the user account and all associated data (cascading delete).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.delete(
  '/account',
  (req, res, next) => usersController.deleteAccount(req as AuthenticatedRequest, res, next),
);

export default router;
