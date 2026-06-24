import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User, { IUser } from '../users/user.model';
import { AppError } from '../../utils/ownershipCheck';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 */
export async function register(email: string, password: string): Promise<IUser> {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email is already registered') as AppError;
    err.statusCode = 409;
    err.code = 'CONFLICT';
    throw err;
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = new User({ 
    email, 
    password, 
    role: 'user',
    isVerified: false,
    verificationToken,
    verificationTokenExpires
  });
  await user.save();

  logger.info(`✉️ Email Verification Token for ${email}: ${verificationToken}`);
  logger.info(`✉️ Click here to verify: http://localhost:5173/verify-email?token=${verificationToken}`);

  return user;
}

/**
 * Login user and issue initial tokens
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ email });
  
  if (user && user.lockUntil && user.lockUntil > new Date()) {
    const remainingMin = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
    const err = new Error(`Account is temporarily locked. Try again in ${remainingMin} minutes.`) as AppError;
    err.statusCode = 423;
    err.code = 'LOCKED';
    throw err;
  }

  // Generic error message to prevent email enumeration
  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }
      await user.save();
    }
    const err = new Error('Invalid email or password') as AppError;
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  // Reset lockout state on successful login
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const accessToken = signAccessToken(user._id.toString(), user.role);
  const refreshToken = signRefreshToken(user._id.toString());

  // Store SHA-256 hash of refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  user.refreshTokens.push({ tokenHash, expiresAt });
  await user.save();

  return { user, accessToken, refreshToken };
}

/**
 * Rotate refresh token: issue a new pair and revoke the old one.
 * If reuse is detected, revoke ALL refresh tokens for the user (breach detection).
 */
export async function rotateToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch (error) {
    const err = new Error('Invalid refresh token') as AppError;
    err.statusCode = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    const err = new Error('User not found') as AppError;
    err.statusCode = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  // Filter out expired tokens first
  const now = new Date();
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > now);

  // Hash incoming token to match
  const incomingHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

  // Find index of the matching token hash
  let matchIndex = -1;
  for (let i = 0; i < user.refreshTokens.length; i++) {
    if (user.refreshTokens[i].tokenHash === incomingHash) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) {
    // BREACH DETECTED: Reuse of refresh token!
    // Revoke all active sessions for this user for security
    user.refreshTokens = [];
    await user.save();

    const err = new Error('Session expired: Security breach detected') as AppError;
    err.statusCode = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  // Valid token found: perform rotation
  // 1. Remove the old token from active list
  user.refreshTokens.splice(matchIndex, 1);

  // 2. Issue new tokens
  const newAccessToken = signAccessToken(user._id.toString(), user.role);
  const newRefreshToken = signRefreshToken(user._id.toString());

  // 3. Hash and store the new refresh token
  const tokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  user.refreshTokens.push({ tokenHash, expiresAt });
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Revoke specific refresh token (logout)
 */
export async function logout(refreshToken: string): Promise<void> {
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return; // Token already invalid/expired, nothing to do
  }

  const user = await User.findById(decoded.userId);
  if (!user) return;

  // Filter out the matching token hash
  const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== incomingHash);
  await user.save();
}

/**
 * Verify user email using verification token
 */
export async function verifyEmail(token: string): Promise<IUser> {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    const err = new Error('Invalid or expired verification token') as AppError;
    err.statusCode = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return user;
}

/**
 * Request password reset token
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  
  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiration
  await user.save();

  logger.info(`🔑 Password Reset Token for ${email}: ${resetToken}`);
  logger.info(`🔑 Reset password link: http://localhost:5173/reset-password?token=${resetToken}`);
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, newPassword: string): Promise<IUser> {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    const err = new Error('Invalid or expired password reset token') as AppError;
    err.statusCode = 400;
    err.code = 'BAD_REQUEST';
    throw err;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  // Revoke all active refresh tokens on password change
  user.refreshTokens = [];
  
  await user.save();
  return user;
}
