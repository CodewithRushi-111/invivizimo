import winston from 'winston';
import { env } from '../config/env';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console(),
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

/**
 * Express request logger middleware
 */
export function requestLogger(req: any, res: any, next: any): void {
  // Redact sensitive details in request bodies before logging
  const bodyCopy = req.body ? { ...req.body } : {};
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'currentPassword', 'newPassword'];
  sensitiveFields.forEach((field) => {
    if (field in bodyCopy) {
      bodyCopy[field] = '[REDACTED]';
    }
  });

  logger.http(`${req.method} ${req.originalUrl} - Body: ${JSON.stringify(bodyCopy)}`);
  next();
}

export default logger;
