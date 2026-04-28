import { Router } from 'express';
import * as onboardingController from './onboarding.controller';
import { validate } from '../../middlewares/validate.middleware';
import { patchTourSchema } from './onboarding.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /api/onboarding/tour:
 *   get:
 *     tags:
 *       - Onboarding
 *     summary: Get the current user's onboarding tour state
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour state retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [NOT_STARTED, COMPLETED, SKIPPED]
 *                     version:
 *                       type: string
 *                       nullable: true
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401: { description: Authentication required }
 *       404: { description: User not found }
 */
router.get(
  '/tour',
  (req, res, next) => onboardingController.getTour(req as AuthenticatedRequest, res, next),
);

/**
 * @openapi
 * /api/onboarding/tour:
 *   patch:
 *     tags:
 *       - Onboarding
 *     summary: Update the current user's onboarding tour state
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, COMPLETED, SKIPPED]
 *               version:
 *                 type: string
 *                 nullable: true
 *                 description: Required when status is COMPLETED or SKIPPED
 *     responses:
 *       200: { description: Tour state updated }
 *       401: { description: Authentication required }
 *       404: { description: User not found }
 *       422: { description: Validation error }
 */
router.patch(
  '/tour',
  validate({ body: patchTourSchema }),
  (req, res, next) => onboardingController.updateTour(req as AuthenticatedRequest, res, next),
);

export default router;
