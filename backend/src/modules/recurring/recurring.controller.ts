import { Response, NextFunction } from 'express';
import * as recurringService from './recurring.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateRecurringInput,
  UpdateRecurringInput,
  ToggleActiveInput,
  GetRecurringQuery,
} from './recurring.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetRecurringQuery;
    const { recurringTransactions, pagination } = await recurringService.getAll(
      req.userId,
      filters,
    );
    sendPaginated(
      res,
      recurringTransactions,
      pagination,
      'Recurring transactions retrieved successfully',
    );
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
    const recurring = await recurringService.getById(req.params.id as string, req.userId);
    sendSuccess(res, recurring, 'Recurring transaction retrieved successfully');
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
    const data = req.body as CreateRecurringInput;
    const recurring = await recurringService.create(req.userId, data);
    sendSuccess(res, recurring, 'Recurring transaction created successfully', 201);
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
    const data = req.body as UpdateRecurringInput;
    const recurring = await recurringService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, recurring, 'Recurring transaction updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function toggleActive(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { isActive } = req.body as ToggleActiveInput;
    const recurring = await recurringService.toggleActive(
      req.params.id as string,
      req.userId,
      isActive,
    );
    sendSuccess(
      res,
      recurring,
      `Recurring transaction ${isActive ? 'activated' : 'paused'} successfully`,
    );
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
    await recurringService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function processRecurring(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await recurringService.processRecurring();
    sendSuccess(res, result, 'Recurring transactions processed successfully');
  } catch (error) {
    next(error);
  }
}
