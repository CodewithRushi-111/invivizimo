import { Model, Types } from 'mongoose';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Asserts that a Mongoose document belongs to the specified user.
 * Throws a 404 NOT_FOUND error if the document is not found or does not belong to the user,
 * to avoid confirming the existence of resources to unauthorized users.
 */
export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string
): Promise<T> {
  if (!Types.ObjectId.isValid(resourceId) || !Types.ObjectId.isValid(userId)) {
    const err = new Error('Resource not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const doc = await ModelClass.findOne({
    _id: new Types.ObjectId(resourceId),
    userId: new Types.ObjectId(userId),
  });

  if (!doc) {
    const err = new Error('Resource not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return doc;
}
