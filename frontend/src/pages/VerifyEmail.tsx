import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthProvider';
import { env } from '../lib/env';
import { AuthLayout } from '../components/AuthLayout';

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
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Email Verification</h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant">Activating your invoice workspace account</p>
        </header>

        <div className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-border-muted border-t-primary animate-spin" />
              <span className="font-sans text-sm text-text-muted">Verifying token validity...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary border border-secondary/30 flex items-center justify-center text-3xl font-bold shadow-md shadow-secondary/10">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <span className="font-sans text-sm text-on-surface-variant font-medium">{msg || 'Email verified successfully!'}</span>
              <Link
                to={user ? '/dashboard' : '/login'}
                className="w-full text-center py-3 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg transition-colors text-sm shadow-sm"
              >
                {user ? 'Go to Dashboard' : 'Sign In Now'}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 text-error border border-error/30 flex items-center justify-center text-3xl font-bold shadow-md shadow-error/10">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              <span className="font-sans text-sm text-error font-medium">{msg}</span>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-3 bg-surface-container-high border border-border-muted text-on-surface hover:bg-surface-container-highest font-semibold rounded-lg transition-colors text-sm shadow-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {status === 'idle' && !token && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="p-4 rounded-xl border bg-primary-container/10 border-primary-container/20 text-on-surface text-sm font-medium">
                Enter the verification token received in your registration log to verify your email manually.
              </div>
              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface" htmlFor="verify-token">
                  Verification Token
                </label>
                <input
                  id="verify-token"
                  type="text"
                  placeholder="Paste token from console log"
                  className="w-full px-4 py-3 rounded-lg border border-border-muted bg-surface-container-lowest focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all duration-200 text-on-surface text-sm"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-primary-container hover:bg-primary text-on-primary font-sans text-sm md:text-base font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Verify Account
              </button>
            </form>
          )}

          <footer className="mt-8 text-center">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="font-sans text-sm font-semibold text-text-muted hover:text-on-surface transition-colors"
            >
              {user ? '← Back to Dashboard' : '← Back to Sign In'}
            </Link>
          </footer>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
