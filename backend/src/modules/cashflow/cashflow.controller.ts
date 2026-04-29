import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as cashflowService from './cashflow.service';
import { sendSuccess } from '../../utils/apiResponse';
import { BiweeklyQuery } from './cashflow.schema';

export async function getBiweekly(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as BiweeklyQuery;
    const result = await cashflowService.getBiweeklyCashflow(req.userId, month, year);
    sendSuccess(res, result, 'Cashflow calculated');
  } catch (error) {
    next(error);
  }
}
