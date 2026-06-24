import { z } from 'zod';

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
});

export const deleteAccountSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE MY ACCOUNT', {
    message: "Confirmation text must be 'DELETE MY ACCOUNT'",
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});
