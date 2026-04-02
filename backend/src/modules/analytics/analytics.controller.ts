import { Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AuthenticatedRequest } from '../../types';

interface SummaryQuery {
  month: number;
  year: number;
}

interface TrendQuery {
  months?: number;
}

interface RecommendationsQuery {
  unreadOnly?: string;
}

export async function getSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as SummaryQuery;
    const summary = await analyticsService.getFinancialSummary(req.userId, month, year);
    sendSuccess(res, summary, 'Resumen financiero obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBreakdown(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { month, year } = req.query as unknown as SummaryQuery;
    const breakdown = await analyticsService.getCategoryBreakdown(req.userId, month, year);
    sendSuccess(res, breakdown, 'Desglose por categoría obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function getTrend(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { months } = req.query as unknown as TrendQuery;
    const trend = await analyticsService.getMonthlyTrend(req.userId, months);
    sendSuccess(res, trend, 'Tendencia mensual obtenida exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function generateRecommendations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const count = await analyticsService.generateRecommendations(req.userId);
    sendSuccess(res, { generated: count }, `Se generaron ${count} recomendaciones`);
  } catch (error) {
    next(error);
  }
}

export async function getRecommendations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { unreadOnly } = req.query as unknown as RecommendationsQuery;
    const onlyUnread = unreadOnly === 'true';
    const recommendations = await analyticsService.getRecommendations(req.userId, onlyUnread);
    sendSuccess(res, recommendations, 'Recomendaciones obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function markRecommendationRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const recommendation = await analyticsService.markRecommendationRead(
      id,
      req.userId,
    );
    sendSuccess(res, recommendation, 'Recomendación marcada como leída');
  } catch (error) {
    next(error);
  }
}
