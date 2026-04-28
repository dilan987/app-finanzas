import { Response, NextFunction } from 'express';
import { TourStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../types';
import * as onboardingService from './onboarding.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getTour(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const state = await onboardingService.getTourState(req.userId);
    sendSuccess(res, state, 'Tour state retrieved');
  } catch (error) {
    next(error);
  }
}

export async function updateTour(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status, version } = req.body as {
      status: TourStatus;
      version?: string | null;
    };

    const state = await onboardingService.updateTourState(req.userId, { status, version });
    sendSuccess(res, state, 'Tour state updated');
  } catch (error) {
    next(error);
  }
}
