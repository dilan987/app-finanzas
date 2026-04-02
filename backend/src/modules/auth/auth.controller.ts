import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendNoContent } from '../../utils/apiResponse';
import { UnauthorizedError } from '../../utils/errors';

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };

    const result = await authService.register(email, password, name);

    setRefreshTokenCookie(res, result.tokens.refreshToken);

    sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'Registration successful',
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const result = await authService.login(email, password);

    setRefreshTokenCookie(res, result.tokens.refreshToken);

    sendSuccess(res, {
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (!token) {
      throw new UnauthorizedError('Refresh token not found');
    }

    const tokens = await authService.refreshToken(token);

    setRefreshTokenCookie(res, tokens.refreshToken);

    sendSuccess(res, { accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (token) {
      await authService.logout(token);
    }

    clearRefreshTokenCookie(res);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as { email: string };

    await authService.forgotPassword(email);

    sendSuccess(
      res,
      null,
      'If an account with that email exists, a password reset link has been sent',
    );
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    await authService.resetPassword(token, newPassword);

    clearRefreshTokenCookie(res);

    sendSuccess(res, null, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
}
