import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IRefreshToken {
  tokenHash: string;
  expiresAt: Date;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  role: 'user' | 'admin' | 'owner';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { _id: false });

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    // Required if not using Google OAuth
    required: function(this: IUser) {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    sparse: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'owner'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  failedLoginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  refreshTokens: [refreshTokenSchema],
}, {
  timestamps: true,
});

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function(this: IUser) {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

// Compare password helper
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);
export default User;
