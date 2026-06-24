import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

export const WorkspaceLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { primaryColor } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeStyle = (path: string) => {
    const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
    return isActive
      ? {
          backgroundColor: 'var(--primary-glow-bg)',
          color: primaryColor,
          borderColor: primaryColor,
        }
      : {};
  };

  return (
    <div style={styles.workspaceWrapper}>
      {/* Sidebar */}
      <aside className="glass-panel" style={styles.sidebar}>
        <div style={styles.logoSection}>
          <span style={{ ...styles.logoIcon, backgroundColor: primaryColor }}>I</span>
          <span style={styles.logoText}>Invivizimo</span>
        </div>

        <nav style={styles.navGroup}>
          <Link
            to="/dashboard"
            className="btn btn-secondary"
            style={{ ...styles.navLink, ...activeStyle('/dashboard') }}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/invoices/new"
            className="btn btn-secondary"
            style={{ ...styles.navLink, ...activeStyle('/invoices/new') }}
          >
            ➕ Create Invoice
          </Link>
          <Link
            to="/settings"
            className="btn btn-secondary"
            style={{ ...styles.navLink, ...activeStyle('/settings') }}
          >
            ⚙️ Settings
          </Link>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{user?.email}</span>
            <span className="status-badge" style={styles.roleBadge}>
              {user?.role || 'user'}
            </span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={styles.mainContainer}>
        {/* Verification Alert Banner */}
        {user && !user.isVerified && (
          <div style={styles.verifyBanner}>
            <div style={styles.bannerTextRow}>
              <span>✉️</span>
              <strong>Your email address is unverified.</strong>
              <span>Please verify your account to unlock full invoice capabilities.</span>
            </div>
            <Link to="/verify-email" className="btn btn-primary" style={styles.bannerBtn}>
              Verify Now
            </Link>
          </div>
        )}

        {/* Top Header Bar */}
        <header style={styles.topHeader}>
          <div style={styles.headerTitleArea}>
            <h1 style={styles.pageTitle}>
              {location.pathname === '/dashboard'
                ? 'Invoice Hub'
                : location.pathname.includes('/new')
                ? 'Create New Invoice'
                : location.pathname.includes('/settings')
                ? 'System Settings'
                : 'Edit Invoice'}
            </h1>
          </div>

          <div style={styles.headerControls}>
            {/* Currency Switcher */}
            <div className="glass-panel" style={styles.currencyToggleBox}>
              <span style={styles.currencyLabel}>Currency:</span>
              <button
                onClick={() => setCurrency('USD')}
                style={{
                  ...styles.currencyBtn,
                  ...(currency === 'USD' ? { backgroundColor: primaryColor, color: '#fff' } : {}),
                }}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                style={{
                  ...styles.currencyBtn,
                  ...(currency === 'INR' ? { backgroundColor: primaryColor, color: '#fff' } : {}),
                }}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Outlet */}
        <main style={styles.workspaceContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles = {
  workspaceWrapper: {
    display: 'flex',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-app)',
    color: 'var(--text-primary)',
  },
  sidebar: {
    width: '260px',
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    borderRadius: 0,
    borderRight: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left' as const,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    borderLeft: '3px solid transparent',
    transition: 'all 0.2s ease',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    borderTop: '1px solid var(--border)',
    paddingTop: '20px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  userEmail: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
  },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
  },
  mainContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    overflowY: 'auto' as const,
  },
  verifyBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderBottom: '1px solid rgba(234, 179, 8, 0.25)',
    color: '#ca8a04',
    fontSize: '14px',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  bannerTextRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bannerBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#ca8a04',
    border: 'none',
    color: '#ffffff',
    textDecoration: 'none',
  },
  topHeader: {
    height: '80px',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitleArea: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  currencyToggleBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    gap: '4px',
    borderRadius: 'var(--radius-lg)',
  },
  currencyLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    margin: '0 8px',
  },
  currencyBtn: {
    border: 'none',
    background: 'none',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  workspaceContent: {
    padding: '40px',
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
};
export default WorkspaceLayout;
