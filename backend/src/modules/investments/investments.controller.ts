import { Response, NextFunction } from 'express';
import * as investmentsService from './investments.service';
import { sendSuccess, sendPaginated, sendNoContent } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';
import {
  CreateInvestmentInput,
  UpdateInvestmentInput,
  GetInvestmentsQuery,
} from './investments.schema';

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as GetInvestmentsQuery;
    const { investments, pagination } = await investmentsService.getAll(
      req.userId,
      filters,
    );
    sendPaginated(res, investments, pagination, 'Investments retrieved successfully');
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
    const investment = await investmentsService.getById(req.params.id as string, req.userId);
    sendSuccess(res, investment, 'Investment retrieved successfully');
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
    const data = req.body as CreateInvestmentInput;
    const investment = await investmentsService.create(req.userId, data);
    sendSuccess(res, investment, 'Investment created successfully', 201);
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
    const data = req.body as UpdateInvestmentInput;
    const investment = await investmentsService.update(req.params.id as string, req.userId, data);
    sendSuccess(res, investment, 'Investment updated successfully');
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
    await investmentsService.remove(req.params.id as string, req.userId);
    sendNoContent(res);
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
    const summary = await investmentsService.getSummary(req.userId);
    sendSuccess(res, summary, 'Investment summary retrieved successfully');
  } catch (error) {
    next(error);
  }
}
