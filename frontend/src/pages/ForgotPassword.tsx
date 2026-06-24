import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';

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
    <div style={styles.container}>
      <div className="card glass-panel" style={styles.authCard}>
        <div style={styles.cardHeader}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logoText}>Invivizimo</span>
          </Link>
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>Enter email to receive password recovery token</p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <span>🔑 {successMsg}</span>
          </div>
        )}

        {!successMsg && (
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

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Requesting...' : 'Send Recovery Token'}
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

export default ForgotPassword;
