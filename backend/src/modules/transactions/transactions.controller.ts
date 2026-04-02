import { Response, NextFunction } from 'express';
import * as transactionsService from './transactions.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
  GetMonthlyStatsQuery,
} from './transactions.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetTransactionsQuery;
    const { transactions, pagination } = await transactionsService.getAll(
      req.userId,
      filters,
    );
    sendPaginated(res, transactions, pagination, 'Transactions retrieved successfully');
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
    const transaction = await transactionsService.getById(req.params.id as string, req.userId);
    sendSuccess(res, transaction, 'Transaction retrieved successfully');
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
    const data = req.body as CreateTransactionInput;
    const transaction = await transactionsService.create(req.userId, data);
    sendSuccess(res, transaction, 'Transaction created successfully', 201);
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
    const data = req.body as UpdateTransactionInput;
    const transaction = await transactionsService.update(
      req.params.id as string,
      req.userId,
      data,
    );
    sendSuccess(res, transaction, 'Transaction updated successfully');
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
    await transactionsService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as GetMonthlyStatsQuery;
    const stats = await transactionsService.getMonthlyStats(req.userId, month, year);
    sendSuccess(res, stats, 'Monthly stats retrieved successfully');
  } catch (error) {
    next(error);
  }
}
