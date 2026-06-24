import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/ownershipCheck';

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error for internal tracking (exclude sensitive data)
  console.error('❌ Error caught by global handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Check for Zod Validation Error
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    err.issues.forEach((e) => {
      const fieldPath = e.path.join('.');
      if (!fields[fieldPath]) {
        fields[fieldPath] = [];
      }
      fields[fieldPath].push(e.message);
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fields,
      },
    });
    return;
  }

  // Cast to AppError to check custom status code and error code
  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const errorCode = appErr.code || 'INTERNAL_ERROR';
  const message = appErr.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
}
