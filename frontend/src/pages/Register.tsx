import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { env } from '../lib/env';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

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

  return (
    <div style={styles.container}>
      <div className="card glass-panel" style={styles.authCard}>
        <div style={styles.cardHeader}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logoText}>Invivizimo</span>
          </Link>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to start managing your invoices</p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-info" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span>✉️ {successMsg}</span>
            <Link to="/login" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '13px', textDecoration: 'none' }}>
              Proceed to Sign In
            </Link>
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

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'is-invalid' : ''}`}
                placeholder="At least 8 characters"
                {...register('password')}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className={`form-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Repeat password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div style={styles.footerLinkRow}>
          <span>Already have an account?</span>
          <Link to="/login" style={styles.loginLink}>
            Sign In
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
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  loginLink: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Register;
