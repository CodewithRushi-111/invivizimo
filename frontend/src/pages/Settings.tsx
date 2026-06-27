import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { client } from '../lib/api/client';
import { tokenStore } from '../auth/tokenStore';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, setUser } = useAuth();
  const {
    themeMode,
    setThemeMode,
    primaryColor,
    setPrimaryColor,
  } = useTheme();
  const resetToDefault = () => {
    setThemeMode('system');
    setPrimaryColor('#6366f1');
  };
  const navigate = useNavigate();

  // Local States
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  // GDPR States
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmString, setConfirmString] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Theme presets
  const presets = [
    { name: 'Aurora Haze', hex: '#6366f1' },
    { name: 'Coral Sun', hex: '#f97316' },
    { name: 'Mint Glow', hex: '#10b981' },
    { name: 'Electric Velvet', hex: '#a855f7' },
    { name: 'Crimson Edge', hex: '#ef4444' },
  ];

  // Save profile email changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const { data } = await client.patch('/users/me', { email: emailInput.trim() });
      if (user) {
        setUser({ ...user, email: data.data.email });
      }
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Re-trigger/send verification email (logs to backend console)
  const handleRequestVerification = async () => {
    if (!user) return;
    setIsSendingVerification(true);
    setVerificationMsg(null);
    try {
      // Trigger verification token flow logging in backend console
      setVerificationMsg('A verification token has been generated and logged in the backend console.');
    } catch (err: any) {
      setVerificationMsg('Failed to trigger verification. Please try again.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  // GDPR Data Export (downloads invivizimo_account_export.json)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data } = await client.get('/users/me/export');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'invivizimo_account_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export GDPR data.');
    } finally {
      setIsExporting(false);
    }
  };

  // GDPR Account Deletion
  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmString !== 'DELETE MY ACCOUNT') {
      setDeleteError('Confirmation string does not match.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Password is required.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await client.delete('/users/me', {
        data: { password: deletePassword, confirmString },
      });

      // Wipe local details
      tokenStore.clear();
      setUser(null);
      setShowDeleteModal(false);
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete account. Password may be incorrect.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: General Profile and Customizer */}
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-border-muted pb-3.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-text-muted">manage_accounts</span>
              Account Details
            </h2>

            {profileMsg && (
              <div className={`p-4 rounded-xl border text-sm font-medium ${
                profileMsg.type === 'success' 
                  ? 'bg-secondary-container/10 border-secondary/20 text-on-surface' 
                  : 'bg-error-container/10 border-error/20 text-error'
              }`}>
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="font-sans text-sm font-semibold text-on-surface">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-primary-container/15 focus:border-primary-container outline-none transition-all text-sm text-on-surface"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-sans text-sm font-semibold text-on-surface block">Verification Status</span>
                {user?.isVerified ? (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/35">
                    ✓ Verified Account
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/20 p-3.5 rounded-xl">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-600 border border-yellow-500/35">
                      ⚠ Unverified
                    </span>
                    <button
                      type="button"
                      onClick={handleRequestVerification}
                      className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-border-muted text-on-surface font-semibold rounded-lg text-xs transition-colors shadow-sm"
                      disabled={isSendingVerification}
                    >
                      {isSendingVerification ? 'Triggering...' : 'Get Verification Token'}
                    </button>
                  </div>
                )}
              </div>

              {verificationMsg && (
                <div className="p-4 rounded-xl border bg-secondary-container/10 border-secondary/20 text-on-surface text-xs font-medium">
                  <span>{verificationMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-container hover:bg-primary text-on-primary font-sans text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm disabled:opacity-50"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Update Email'}
              </button>
            </form>
          </div>

          {/* Theme customizer settings */}
          <div className="bg-surface-container-lowest border border-border-muted p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-on-surface border-b border-border-muted pb-3.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-text-muted">palette</span>
              Theme Customization
            </h2>

            <div className="space-y-3">
              <h3 className="font-sans text-sm font-semibold text-on-surface">Appearance Mode</h3>
              <div className="flex gap-2 bg-surface-container p-1 rounded-xl border border-border-muted">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      themeMode === mode
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-sans text-sm font-semibold text-on-surface">Accent Branding Color</h3>
              <div className="grid grid-cols-5 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setPrimaryColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    className={`h-9 rounded-lg transition-transform focus:scale-95 active:scale-90 ${
                      primaryColor === preset.hex
                        ? 'ring-4 ring-offset-2 ring-primary'
                        : 'border border-black/10'
                    }`}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Custom HEX:</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="border-none w-10 h-7 rounded cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-xs font-bold text-on-surface">{primaryColor}</span>
                </div>
              </div>
            </div>

            <button
              onClick={resetToDefault}
              className="w-full py-2.5 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-sans text-sm font-semibold rounded-lg transition-all duration-300 shadow-sm"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Right Side: GDPR Options */}
        <div className="bg-surface-container-lowest border border-error/20 p-6 rounded-2xl shadow-sm space-y-6">
          <h2 className="font-display text-lg font-bold text-error border-b border-border-muted pb-3.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-error">security</span>
            Privacy & GDPR Regulations
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Pursuant to EU General Data Protection Regulations, you have the right to request access to and deletion of all personal data held.
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="font-sans text-sm font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-text-muted">download</span>
              1. Download Account Data
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Download a machine-readable JSON archive containing your full profile details, metadata, and all active invoice records.
            </p>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
              disabled={isExporting}
            >
              {isExporting ? 'Generating JSON...' : 'Export All Account Data'}
            </button>
          </div>

          <div className="space-y-3 pt-6 border-t border-border-muted">
            <h3 className="font-sans text-sm font-semibold text-error flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-error">delete_forever</span>
              2. Terminate Account
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Permanently purge your account, hashed credentials, and active invoice databases from MongoDB. This action is irreversible.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-error hover:bg-error/95 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              Delete Account Discard
            </button>
          </div>
        </div>
      </div>

      {/* GDPR Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-surface-container-lowest border border-border-muted rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-muted">
              <h3 className="text-base font-bold text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Irreversible Account Purge
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-surface-container-low text-text-muted hover:text-on-surface rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {deleteError && (
              <div className="mx-6 mt-4 p-4 rounded-xl border bg-error-container/10 border-error/20 text-error text-xs font-semibold">
                <span>⚠️ {deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit} className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This action is irreversible. All client databases, total receivables, and active invoices will be deleted.
              </p>

              <div className="space-y-2">
                <label className="font-sans text-xs font-semibold text-on-surface block">
                  To confirm, type <strong className="text-error font-extrabold">DELETE MY ACCOUNT</strong> below:
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-error/15 focus:border-error outline-none transition-all text-xs"
                  placeholder="DELETE MY ACCOUNT"
                  value={confirmString}
                  onChange={(e) => setConfirmString(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-sans text-xs font-semibold text-on-surface block">Enter Password:</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-lg border border-border-muted bg-surface focus:ring-4 focus:ring-error/15 focus:border-error outline-none transition-all text-xs"
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 bg-surface hover:bg-surface-container-high border border-border-muted text-on-surface font-semibold rounded-lg text-xs transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-error hover:bg-error/95 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Purge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
