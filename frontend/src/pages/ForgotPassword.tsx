import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';
import { AuthLayout } from '../components/AuthLayout';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFields = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotFields>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await axios.post(
        `${env.VITE_API_BASE_URL}/api/v1/auth/forgot-password`,
        data
      );
      setSuccessMsg(res.data.data.message + ' (Check your backend console logs for the reset link token).');
      reset();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error?.message || 'Something went wrong. Please try again.');
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
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Reset Password</h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">Enter email to receive password recovery token</p>
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
                <span className="material-symbols-outlined text-secondary text-[22px]">mail</span>
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
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full px-4 py-3 rounded-lg border bg-surface-container-lowest focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all duration-200 text-on-surface text-sm ${
                    errors.email ? 'border-error focus:border-error focus:ring-error/15' : 'border-border-muted'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-primary-container hover:bg-primary text-on-primary font-sans text-sm md:text-base font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Requesting...' : 'Send Recovery Token'}
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

export default ForgotPassword;
