import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/ownershipCheck';

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Access token required') as AppError;
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    
    // Attach user payload to the request object
    req.user = {
      _id: decoded.userId,
      role: decoded.role,
    };
    
    next();
  } catch (error: any) {
    const err = new Error('Invalid or expired token') as AppError;
    err.statusCode = 401;
    
    if (error.name === 'TokenExpiredError') {
      err.message = 'Access token has expired';
      err.code = 'TOKEN_EXPIRED';
    } else {
      err.message = 'Invalid access token';
      err.code = 'TOKEN_INVALID';
    }
    
    next(err);
  }
};

/**
 * Middleware factory to enforce minimum role access
 */
export function requireRole(allowedRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err = new Error('Authentication required') as AppError;
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const err = new Error('Access forbidden: Insufficient permissions') as AppError;
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }

    next();
  };
}
