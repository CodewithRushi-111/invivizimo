import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { parseCookies } from '../../utils/cookie';
import { env } from '../../config/env';
import { AppError } from '../../utils/ownershipCheck';

// Helper to set refresh token cookie
function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Helper to clear refresh token cookie
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    
    // Format response without password/tokens
    const responseData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    setRefreshTokenCookie(res, refreshToken);

    const responseData = {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      accessToken,
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const oldRefreshToken = cookies.refreshToken;

    if (!oldRefreshToken) {
      const err = new Error('Refresh token not found') as AppError;
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    const { accessToken, refreshToken } = await authService.rotateToken(oldRefreshToken);

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    // If rotation fails, clear cookie so frontend knows to prompt login
    clearRefreshTokenCookie(res);
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const refreshToken = cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const user = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      data: {
        message: 'Email verified successfully',
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);

    // Secure response: always return success to prevent user validation scans
    res.status(200).json({
      success: true,
      data: { message: 'If the email matches an active account, a password reset link has been generated and sent.' }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      data: { message: 'Password has been reset successfully. All active sessions have been revoked.' }
    });
  } catch (error) {
    next(error);
  }
}
