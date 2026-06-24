import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

interface TokenPayload {
  userId: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
  jti: string;
}

export function signAccessToken(userId: string, role: string): string {
  const payload: TokenPayload = { userId, role };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, jti: crypto.randomUUID() };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
