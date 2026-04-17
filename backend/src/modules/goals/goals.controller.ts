import { Response, NextFunction } from 'express';
import * as goalsService from './goals.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateGoalInput,
  UpdateGoalInput,
  GetGoalsQuery,
  ActiveForMonthQuery,
  LinkTransactionInput,
} from './goals.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetGoalsQuery;
    const { goals, pagination } = await goalsService.getAll(req.userId, filters);
    sendPaginated(res, goals, pagination, 'Goals retrieved successfully');
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
    const goal = await goalsService.getById(req.params.id as string, req.userId);
    sendSuccess(res, goal, 'Goal retrieved successfully');
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
    const data = req.body as CreateGoalInput;
    const goal = await goalsService.create(req.userId, data);
    sendSuccess(res, goal, 'Goal created successfully', 201);
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
    const data = req.body as UpdateGoalInput;
    const goal = await goalsService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, goal, 'Goal updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function cancelGoal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const goal = await goalsService.cancel(req.params.id as string, req.userId);
    sendSuccess(res, goal, 'Goal cancelled successfully');
  } catch (error) {
    next(error);
  }
}

export async function getActiveForMonth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as unknown as ActiveForMonthQuery;
    const data = await goalsService.getActiveForMonth(req.userId, query.month, query.year);
    sendSuccess(res, data, 'Active goals for month retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function getProjection(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const projection = await goalsService.getProjection(req.params.id as string, req.userId);
    sendSuccess(res, projection, 'Goal projection retrieved successfully');
  } catch (error) {
    next(error);
  }
}

export async function linkTransaction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { transactionId } = req.body as LinkTransactionInput;
    const result = await goalsService.linkTransaction(
      req.params.id as string,
      transactionId,
      req.userId,
    );
    sendSuccess(res, result, 'Transaction linked to goal successfully');
  } catch (error) {
    next(error);
  }
}

export async function unlinkTransaction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await goalsService.unlinkTransaction(
      req.params.id as string,
      req.params.transactionId as string,
      req.userId,
    );
    sendSuccess(res, result, 'Transaction unlinked from goal successfully');
  } catch (error) {
    next(error);
  }
}
