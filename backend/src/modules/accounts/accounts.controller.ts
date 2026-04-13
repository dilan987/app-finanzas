import { Response, NextFunction } from 'express';
import * as accountsService from './accounts.service';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateAccountInput,
  UpdateAccountInput,
  GetAccountsQuery,
  ReorderAccountsInput,
} from './accounts.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetAccountsQuery;
    const accounts = await accountsService.getAll(req.userId, filters);
    sendSuccess(res, accounts, 'Accounts retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const account = await accountsService.getById(req.params.id as string, req.userId);
    sendSuccess(res, account, 'Account retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as CreateAccountInput;
    const account = await accountsService.create(req.userId, data);
    sendSuccess(res, account, 'Account created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as UpdateAccountInput;
    const account = await accountsService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, account, 'Account updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await accountsService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function reorder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as ReorderAccountsInput;
    await accountsService.reorder(req.userId, data);
    sendSuccess(res, null, 'Accounts reordered successfully');
  } catch (error) {
    next(error);
  }
}

export async function getSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const summary = await accountsService.getSummary(req.userId);
    sendSuccess(res, summary, 'Account summary retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function reconcile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await accountsService.reconcileBalance(req.params.id as string, req.userId);
    sendSuccess(res, result, 'Account balance reconciled successfully');
  } catch (error) {
    next(error);
  }
}
