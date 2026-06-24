import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';

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
    <div style={styles.container}>
      <div className="card glass-panel" style={styles.authCard}>
        <div style={styles.cardHeader}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logoText}>Invivizimo</span>
          </Link>
          <h2 style={styles.title}>New Password</h2>
          <p style={styles.subtitle}>Enter your recovery token and new password details</p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span>✓ {successMsg}</span>
            <Link to="/login" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '13px', textDecoration: 'none' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Recovery Token</label>
              <input
                type="text"
                className={`form-input ${errors.token ? 'is-invalid' : ''}`}
                placeholder="Paste token from console log"
                {...register('token')}
              />
              {errors.token && <span className="error-text">{errors.token.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="At least 8 characters"
                {...register('password')}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className={`form-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Repeat new password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}

        <div style={styles.footerLinkRow}>
          <Link to="/login" style={styles.backLink}>
            ← Back to Sign In
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
  submitBtn: {
    width: '100%',
    padding: '12px',
    marginTop: '8px',
  },
  footerLinkRow: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
    fontSize: '14px',
  },
  backLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default ResetPassword;
