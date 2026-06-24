import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const { primaryColor } = useTheme();

  return (
    <div style={styles.container}>
      {/* Navigation Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoArea}>
            <span style={{ ...styles.logoIcon, backgroundColor: primaryColor }}>I</span>
            <span style={styles.logoText}>Invivizimo</span>
          </div>
          <nav style={styles.navLinks}>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary" style={styles.navBtn}>
                Enter Workspace
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={styles.navBtnLink}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary" style={styles.navBtn}>
                  Start Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroGrid}>
          <div style={styles.heroLeft}>
            <span className="status-badge" style={{ marginBottom: '16px', color: primaryColor }}>
              ⚡ Release v1.0.0
            </span>
            <h1 style={styles.heroTitle}>
              Beautiful Invoicing for <span style={{ color: primaryColor }}>Modern Teams</span>
            </h1>
            <p style={styles.heroSubtitle}>
              Streamline client billing with custom branding, dynamic itemized calculators, multi-currency support (USD/INR), and robust security.
            </p>
            <div style={styles.ctaWrapper}>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="btn btn-primary"
                style={styles.heroCta}
              >
                Get Started Instantly
              </Link>
              <a href="#features" className="btn btn-secondary" style={styles.heroSecondary}>
                Learn More
              </a>
            </div>
          </div>

          {/* Interactive Mockup Grid */}
          <div style={styles.heroRight}>
            <div className="card glass-panel" style={styles.mockCard}>
              <div style={styles.mockHeader}>
                <div style={styles.mockDotRow}>
                  <span style={styles.redDot}></span>
                  <span style={styles.yellowDot}></span>
                  <span style={styles.greenDot}></span>
                </div>
                <span style={styles.mockTitle}>Dynamic Calculator</span>
              </div>
              <div style={styles.mockItemRow}>
                <span style={styles.mockItemLabel}>Acme Services</span>
                <span style={styles.mockItemVal}>$1,250.00</span>
              </div>
              <div style={{ ...styles.mockItemRow, borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <strong>Total Amount</strong>
                <strong style={{ color: primaryColor }}>$1,250.00</strong>
              </div>
              <span className="status-badge" style={styles.mockBadge}>
                ✓ Real-Time Sync
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.featuresHeader}>
          <h2>Engineered for Visual Excellence</h2>
          <p>Everything you need to handle billing without losing track of your aesthetics.</p>
        </div>

        <div style={styles.featuresGrid}>
          <div className="card" style={styles.featureCard}>
            <div style={{ ...styles.featureIcon, color: primaryColor }}>🎨</div>
            <h3>Custom UI Theme Settings</h3>
            <p>Select from premium preset accent schemes or picker brand custom hex colors. Syncs to local storage.</p>
          </div>

          <div className="card" style={styles.featureCard}>
            <div style={{ ...styles.featureIcon, color: primaryColor }}>💵</div>
            <h3>USD & INR Formatting</h3>
            <p>Switch currency formats seamlessly on the dashboard. Stored in cents, rendered to match your billing locale.</p>
          </div>

          <div className="card" style={styles.featureCard}>
            <div style={{ ...styles.featureIcon, color: primaryColor }}>🔒</div>
            <h3>Breach & RTR Protection</h3>
            <p>Refresh token rotation prevents session theft. Logs automatically lock out on brute-force attempts.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Invivizimo Platform. Made with Vanilla CSS aesthetics.</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'var(--bg-app)',
  },
  header: {
    height: '70px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 32px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--glass-border)',
  },
  headerContent: {
    width: '1200px',
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: '14px',
  },
  navBtnLink: {
    padding: '8px 16px',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    textDecoration: 'none',
  },
  heroSection: {
    width: '1200px',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '80px 24px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '60px',
    width: '100%',
    alignItems: 'center',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    textAlign: 'left' as const,
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.03em',
    marginBottom: '20px',
    color: 'var(--text-primary)',
  },
  heroSubtitle: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    marginBottom: '36px',
  },
  ctaWrapper: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  heroCta: {
    padding: '14px 28px',
    fontSize: '16px',
    textDecoration: 'none',
  },
  heroSecondary: {
    padding: '14px 28px',
    fontSize: '16px',
    textDecoration: 'none',
  },
  heroRight: {
    display: 'flex',
    justifyContent: 'center',
  },
  mockCard: {
    width: '320px',
    padding: '24px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-lg)',
  },
  mockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '12px',
  },
  mockDotRow: {
    display: 'flex',
    gap: '6px',
  },
  redDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' },
  yellowDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' },
  greenDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' },
  mockTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' },
  mockItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
  },
  mockItemLabel: { color: 'var(--text-secondary)' },
  mockItemVal: { fontWeight: '600' },
  mockBadge: { alignSelf: 'flex-start', fontSize: '11px', marginTop: '8px' },
  featuresSection: {
    width: '1200px',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '80px 24px',
    borderTop: '1px solid var(--border)',
  },
  featuresHeader: {
    textAlign: 'center' as const,
    marginBottom: '48px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    textAlign: 'left' as const,
    gap: '12px',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  footer: {
    padding: '40px 24px',
    borderTop: '1px solid var(--border)',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
};

export default Landing;
