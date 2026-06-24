import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';
import { tokenStore } from '../auth/tokenStore';
import { env } from '../lib/env';

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
    <div style={styles.container}>
      <div className="card glass-panel" style={styles.authCard}>
        <div style={styles.cardHeader}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logoText}>Invivizimo</span>
          </Link>
          <h2 style={styles.title}>Sign In</h2>
          <p style={styles.subtitle}>Enter credentials to access your invoices</p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className={`form-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <div style={styles.labelRow}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={styles.forgotLink}>
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              className={`form-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footerLinkRow}>
          <span>Don't have an account?</span>
          <Link to="/register" style={styles.signupLink}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-app)',
    padding: '16px',
  },
  authCard: {
    width: '420px',
    maxWidth: '100%',
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-xl)',
  },
  cardHeader: {
    textAlign: 'center' as const,
    marginBottom: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  logoLink: {
    textDecoration: 'none',
    marginBottom: '16px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  forgotLink: {
    fontSize: '13px',
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
  },
  footerLinkRow: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  signupLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;
