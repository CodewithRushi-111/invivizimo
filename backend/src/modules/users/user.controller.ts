import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const user = await userService.getUserById(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const updatedUser = await userService.updateUserProfile(userId, req.body);
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    await userService.deleteUserAccount(userId);
    
    // Clear refresh token cookie on deletion
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      data: { message: 'Account successfully deleted' },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const exportData = await userService.exportUserData(userId);
    res.status(200).json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    next(error);
  }
}
