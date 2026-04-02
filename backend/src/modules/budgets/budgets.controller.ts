import { Response, NextFunction } from 'express';
import * as budgetsService from './budgets.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  GetBudgetsQuery,
  GetMonthSummaryQuery,
} from './budgets.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetBudgetsQuery;
    const { budgets, pagination } = await budgetsService.getAll(req.userId, filters);
    sendPaginated(res, budgets, pagination, 'Budgets retrieved successfully');
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
    const budget = await budgetsService.getById(req.params.id as string, req.userId);
    sendSuccess(res, budget, 'Budget retrieved successfully');
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
    const data = req.body as CreateBudgetInput;
    const budget = await budgetsService.create(req.userId, data);
    sendSuccess(res, budget, 'Budget created successfully', 201);
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
    const data = req.body as UpdateBudgetInput;
    const budget = await budgetsService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, budget, 'Budget updated successfully');
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
    await budgetsService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function getMonthSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as GetMonthSummaryQuery;
    const summary = await budgetsService.getMonthSummary(req.userId, month, year);
    sendSuccess(res, summary, 'Budget summary retrieved successfully');
  } catch (error) {
    next(error);
  }
}
