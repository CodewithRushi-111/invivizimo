import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';
import { tokenStore } from '../auth/tokenStore';
import { env } from '../lib/env';
import { AuthLayout } from '../components/AuthLayout';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await axios.post(
        `${env.VITE_API_BASE_URL}/api/v1/auth/login`,
        data,
        { withCredentials: true }
      );
      const { user, accessToken } = response.data.data;
      tokenStore.set(accessToken);
      setUser(user);
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Something went wrong. Please try again.';
      setErrorMsg(msg);
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
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Sign in to Invoizmo</h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">Welcome back! Please enter your details.</p>
        </header>

        <div className="space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl border bg-error-container/10 border-error/20 text-error flex items-start gap-2.5 text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
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
              <div className="flex justify-between items-center">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="login-password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="font-sans text-xs md:text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary-container hover:bg-primary text-on-primary font-sans text-sm md:text-base font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in to Invoizmo'}
            </button>
          </form>

          <footer className="mt-8 text-center">
            <p className="font-sans text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </AuthLayout>
  );
};
