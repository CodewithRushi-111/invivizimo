import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';

import { env } from './config/env';
import { requestLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS — explicit origin list only, never '*' with credentials
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// 3. Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. HTTP request logging (redacts sensitive info)
if (env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// ── Health & Readiness Endpoints (outside rate limiters and auth) ───────
/**
 * GET /health
 * Simple liveness probe. Fast and cheap.
 */
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'UP' });
});

/**
 * GET /ready
 * Readiness probe. Checks database connectivity.
 */
app.get('/ready', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'READY' : 'NOT_READY';
  if (dbStatus === 'READY') {
    res.status(200).json({ success: true, status: dbStatus });
  } else {
    res.status(503).json({ success: false, status: dbStatus });
  }
});

// 5. Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use('/api', globalLimiter);

// 6. Strict auth-route rate limit
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 password/token requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only limit failed requests (optional, but protects against brute-force)
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again after a minute.',
    },
  },
});
app.use('/api/v1/auth', authLimiter);

// 7. Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// 8. Catch-all for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// 9. Central error handler (must be last)
app.use(errorHandler);

export default app;
