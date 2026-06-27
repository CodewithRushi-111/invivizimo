import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';
import { AuthLayout } from '../components/AuthLayout';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFields = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

  const passwordVal = watch('password') || '';

  const onSubmit = async (data: RegisterFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await axios.post(
        `${env.VITE_API_BASE_URL}/api/v1/auth/register`,
        { email: data.email, password: data.password }
      );
      setSuccessMsg(
        'Registration successful! We have sent a verification link to your email. (Check your backend console logs for the verification token link).'
      );
      reset();
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to register user. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine password strength
  const getStrengthScore = () => {
    let score = 0;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal)) score++;
    if (/[0-9]/.test(passwordVal)) score++;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score++;
    return score;
  };

  const strength = getStrengthScore();

  const getStrengthColor = (index: number) => {
    if (index >= strength) return 'bg-surface-container-highest';
    if (strength === 1) return 'bg-error';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-secondary';
  };

  const getStrengthText = () => {
    if (!passwordVal) return 'Password strength';
    if (strength <= 1) return 'Weak password';
    if (strength === 2) return 'Moderate password';
    if (strength === 3) return 'Strong password';
    return 'Very secure password';
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">
        <header className="mb-8 text-center lg:text-left">
          {/* Mobile branding logo */}
          <div className="lg:hidden mb-6 flex items-center justify-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm border border-border-muted">
              <img src="/logo.png" alt="Invoizmo" className="h-6 object-contain" />
            </div>
            <span className="font-display text-xl font-bold">Invoizmo</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Create your account</h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">Start managing your invoices in minutes.</p>
        </header>

        <div className="space-y-5">
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
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  id="signup-email"
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

              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
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

                {/* Password Strength Indicator */}
                <div className="flex gap-1 pt-1.5">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(0)}`} />
                  <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(1)}`} />
                  <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(2)}`} />
                  <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(3)}`} />
                </div>
                <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                  {getStrengthText()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
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
                {isLoading ? 'Creating account...' : 'Create Free Account'}
              </button>
            </form>
          )}

          <footer className="mt-8 text-center">
            <p className="font-sans text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
                Sign in here
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </AuthLayout>
  );
};
