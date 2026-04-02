import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import * as usersService from './users.service';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await usersService.getProfile(req.userId);

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = req.body as {
      name?: string;
      mainCurrency?: string;
      timezone?: string;
    };

    const user = await usersService.updateProfile(req.userId, data);

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    await usersService.changePassword(req.userId, currentPassword, newPassword);

    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await usersService.deleteAccount(req.userId);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}
