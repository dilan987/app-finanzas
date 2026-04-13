import { Router } from 'express';
import * as accountsController from './accounts.controller';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAccountSchema,
  updateAccountSchema,
  getAccountsQuerySchema,
  reorderAccountsSchema,
} from './accounts.schema';
import { AuthenticatedRequest } from '../../types';

const router = Router();

router.get(
  '/',
  validate({ query: getAccountsQuerySchema }),
  (req, res, next) => accountsController.getAll(req as AuthenticatedRequest, res, next),
);

router.get(
  '/summary',
  (req, res, next) => accountsController.getSummary(req as AuthenticatedRequest, res, next),
);

router.get(
  '/:id',
  (req, res, next) => accountsController.getById(req as AuthenticatedRequest, res, next),
);

router.post(
  '/',
  validate({ body: createAccountSchema }),
  (req, res, next) => accountsController.create(req as AuthenticatedRequest, res, next),
);

router.put(
  '/reorder',
  validate({ body: reorderAccountsSchema }),
  (req, res, next) => accountsController.reorder(req as AuthenticatedRequest, res, next),
);

router.put(
  '/:id',
  validate({ body: updateAccountSchema }),
  (req, res, next) => accountsController.update(req as AuthenticatedRequest, res, next),
);

router.delete(
  '/:id',
  (req, res, next) => accountsController.remove(req as AuthenticatedRequest, res, next),
);

router.post(
  '/:id/reconcile',
  (req, res, next) => accountsController.reconcile(req as AuthenticatedRequest, res, next),
);

export default router;
