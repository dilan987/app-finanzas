import { Router } from 'express';
import * as goalsController from './goals.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createGoalSchema,
  updateGoalSchema,
  getGoalsQuerySchema,
  activeForMonthQuerySchema,
  linkTransactionSchema,
} from './goals.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

router.get(
  '/',
  validate({ query: getGoalsQuerySchema }),
  (req, res, next) => goalsController.getAll(req as AuthenticatedRequest, res, next),
);

router.get(
  '/active-for-month',
  validate({ query: activeForMonthQuerySchema }),
  (req, res, next) => goalsController.getActiveForMonth(req as AuthenticatedRequest, res, next),
);

router.get(
  '/:id/projection',
  (req, res, next) => goalsController.getProjection(req as AuthenticatedRequest, res, next),
);

router.get(
  '/:id',
  (req, res, next) => goalsController.getById(req as AuthenticatedRequest, res, next),
);

router.post(
  '/',
  validate({ body: createGoalSchema }),
  (req, res, next) => goalsController.create(req as AuthenticatedRequest, res, next),
);

router.put(
  '/:id',
  validate({ body: updateGoalSchema }),
  (req, res, next) => goalsController.update(req as AuthenticatedRequest, res, next),
);

router.patch(
  '/:id/cancel',
  (req, res, next) => goalsController.cancelGoal(req as AuthenticatedRequest, res, next),
);

router.post(
  '/:id/link',
  validate({ body: linkTransactionSchema }),
  (req, res, next) => goalsController.linkTransaction(req as AuthenticatedRequest, res, next),
);

router.delete(
  '/:id/unlink/:transactionId',
  (req, res, next) => goalsController.unlinkTransaction(req as AuthenticatedRequest, res, next),
);

export default router;
