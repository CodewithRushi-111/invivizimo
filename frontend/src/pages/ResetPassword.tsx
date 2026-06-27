import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';
import { AuthLayout } from '../components/AuthLayout';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFields = z.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetFields>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Pre-fill token from query parameters if present
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setValue('token', token);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: ResetFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await axios.post(
        `${env.VITE_API_BASE_URL}/api/v1/auth/reset-password`,
        { token: data.token, password: data.password }
      );
      setSuccessMsg(res.data.data.message);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <header className="mb-10 text-center lg:text-left">
          {/* Mobile branding logo */}
          <div className="lg:hidden mb-6 flex items-center justify-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm border border-border-muted">
              <img src="/logo.png" alt="Invoizmo" className="h-6 object-contain" />
            </div>
            <span className="font-display text-xl font-bold">Invoizmo</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">New Password</h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">Enter your recovery token and new password details</p>
        </header>

        <div className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl border bg-error-container/10 border-error/20 text-error flex items-start gap-2.5 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-5 rounded-xl border bg-secondary-container/15 border-secondary/20 text-on-surface flex flex-col gap-4 text-sm font-medium">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
                <span>{successMsg}</span>
              </div>
              <Link
                to="/login"
                className="w-full text-center py-2.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg transition-colors text-sm shadow-sm"
              >
                Proceed to Sign In
              </Link>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="reset-token">
                  Recovery Token
                </label>
                <input
                  id="reset-token"
                  type="text"
                  placeholder="Paste token from email/console"
                  className={`w-full px-4 py-3 rounded-lg border bg-surface-container-lowest focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all duration-200 text-on-surface text-sm ${
                    errors.token ? 'border-error focus:border-error focus:ring-error/15' : 'border-border-muted'
                  }`}
                  {...register('token')}
                />
                {errors.token && (
                  <p className="text-xs text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.token.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="reset-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-lg border bg-surface-container-lowest focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all duration-200 text-on-surface text-sm ${
                      errors.password ? 'border-error focus:border-error focus:ring-error/15' : 'border-border-muted'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    className={`w-full px-4 py-3 rounded-lg border bg-surface-container-lowest focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all duration-200 text-on-surface text-sm ${
                      errors.confirmPassword ? 'border-error focus:border-error focus:ring-error/15' : 'border-border-muted'
                    }`}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary-container hover:bg-primary text-on-primary font-sans text-sm md:text-base font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting password...' : 'Update Password'}
              </button>
            </form>
          )}

          <footer className="mt-8 text-center">
            <Link
              to="/login"
              className="font-sans text-sm font-semibold text-text-muted hover:text-on-surface transition-colors"
            >
              ← Back to Sign In
            </Link>
          </footer>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
