import { User, IUser } from './user.model';
import { AppError } from '../../utils/ownershipCheck';

export async function getUserById(id: string): Promise<IUser> {
  const user = await User.findById(id).select('-password -refreshTokens');
  if (!user) {
    const err = new Error('User not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return user;
}

export async function updateUserProfile(id: string, data: { email?: string }): Promise<IUser> {
  // If email is being updated, check if it's already in use
  if (data.email) {
    const existing = await User.findOne({ email: data.email, _id: { $ne: id } });
    if (existing) {
      const err = new Error('Email is already in use') as AppError;
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { returnDocument: 'after', runValidators: true }
  ).select('-password -refreshTokens');

  if (!user) {
    const err = new Error('User not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return user;
}

export async function deleteUserAccount(id: string): Promise<void> {
  const result = await User.findByIdAndDelete(id);
  if (!result) {
    const err = new Error('User not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
}

export async function exportUserData(id: string): Promise<Record<string, any>> {
  const user = await User.findById(id).select('-password -refreshTokens');
  if (!user) {
    const err = new Error('User not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Generate GDPR export payload
  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    // Plugs for other resources if needed later
    dataSources: [],
    activityLogs: [],
  };
}
