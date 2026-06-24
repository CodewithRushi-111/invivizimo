import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';
import { env } from '../lib/env';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  const token = searchParams.get('token');

  const executeVerification = async (verifyToken: string) => {
    setStatus('loading');
    setMsg(null);
    try {
      const res = await axios.post(
        `${env.VITE_API_BASE_URL}/api/v1/auth/verify-email`,
        { token: verifyToken }
      );
      setStatus('success');
      setMsg(res.data.data.message);

      // If user is currently authenticated locally, update their verified flag
      if (user) {
        setUser({ ...user, isVerified: true });
      }
    } catch (error: any) {
      setStatus('error');
      setMsg(error.response?.data?.error?.message || 'Verification failed. Token may be invalid or expired.');
    }
  };

  useEffect(() => {
    if (token) {
      executeVerification(token);
    }
  }, [token]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      executeVerification(manualToken.trim());
    }
  };

  return (
    <div style={styles.container}>
      <div className="card glass-panel" style={styles.authCard}>
        <div style={styles.cardHeader}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logoText}>Invivizimo</span>
          </Link>
          <h2 style={styles.title}>Email Verification</h2>
          <p style={styles.subtitle}>Activating your invoice workspace account</p>
        </div>

        {status === 'loading' && (
          <div style={styles.stateContainer}>
            <div style={styles.spinner} />
            <span style={styles.stateText}>Verifying token validity...</span>
          </div>
        )}

        {status === 'success' && (
          <div style={styles.stateContainer}>
            <div style={styles.successBadge}>✓</div>
            <span style={styles.successText}>{msg || 'Email verified successfully!'}</span>
            <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary" style={styles.actionBtn}>
              {user ? 'Go to Dashboard' : 'Sign In Now'}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.stateContainer}>
            <div style={styles.errorBadge}>!</div>
            <span style={styles.errorText}>{msg}</span>
            <button onClick={() => setStatus('idle')} className="btn btn-secondary" style={styles.actionBtn}>
              Try Again
            </button>
          </div>
        )}

        {status === 'idle' && !token && (
          <form onSubmit={handleManualSubmit} style={styles.form}>
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              <span>Enter the verification token received in your registration log to verify your email manually.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Verification Token</label>
              <input
                type="text"
                className="form-input"
                placeholder="Paste token from backend console"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
              Verify Account
            </button>
          </form>
        )}

        <div style={styles.footerLinkRow}>
          <Link to={user ? '/dashboard' : '/login'} style={styles.backLink}>
            {user ? '← Back to Dashboard' : '← Back to Sign In'}
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
  stateContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
    padding: '24px 0',
    textAlign: 'center' as const,
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 1s linear infinite',
  },
  stateText: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  successBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    boxShadow: '0 0 16px rgba(34, 197, 94, 0.2)',
  },
  successText: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  errorBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    boxShadow: '0 0 16px rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    fontWeight: '500',
  },
  actionBtn: {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
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
export default VerifyEmail;
