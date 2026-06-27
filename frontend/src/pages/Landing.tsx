import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const { primaryColor } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border-muted">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="Invoizmo" className="h-8 object-contain" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight">Invoizmo</span>
          </div>

          <nav className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-5 py-2.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg transition-all duration-300 text-sm shadow-sm hover:shadow"
              >
                Enter Workspace
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2.5 text-on-surface-variant hover:text-on-surface font-semibold transition-colors text-sm"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg transition-all duration-300 text-sm shadow-sm hover:shadow"
                >
                  Start Free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow max-w-6xl mx-auto px-6 py-12 md:py-24 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/10 border border-primary/20" style={{ color: primaryColor }}>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              Release v1.0.0
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Beautiful Invoicing for <span style={{ color: primaryColor }}>Modern Teams</span>
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant leading-relaxed">
              Streamline client billing with custom branding, dynamic itemized calculators, multi-currency support (USD/INR), and robust security built for high-growth businesses.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="px-6 py-3.5 bg-primary-container hover:bg-primary text-on-primary font-semibold rounded-lg transition-all duration-300 text-sm md:text-base shadow-md hover:shadow-lg"
              >
                Get Started Instantly
              </Link>
              <a 
                href="#features" 
                className="px-6 py-3.5 bg-surface-container-high border border-border-muted text-on-surface hover:bg-surface-container-highest font-semibold rounded-lg transition-colors text-sm md:text-base"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Interactive Mockup Grid */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 bg-primary-container/5 rounded-3xl blur-[80px] pointer-events-none" />
            <div className="relative w-full max-w-[420px] bg-surface-container-lowest border border-border-muted rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">Dynamic Calculator</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-on-surface-variant">Acme Services</span>
                  <span className="font-mono">$1,250.00</span>
                </div>
                <div className="border-t border-border-muted pt-4 flex justify-between items-center text-base font-bold">
                  <span>Total Amount</span>
                  <span style={{ color: primaryColor }} className="font-mono">$1,250.00</span>
                </div>
                <div className="pt-2 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 border border-secondary/20 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    Real-Time Sync
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 md:py-24 border-t border-border-muted">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Engineered for Visual Excellence</h2>
          <p className="text-on-surface-variant text-sm md:text-base">Everything you need to handle billing without losing track of your aesthetics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-lowest border border-border-muted rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 bg-primary-container/10 text-primary">🎨</div>
            <h3 className="text-lg font-bold mb-3">Custom UI Theme Settings</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Select from premium preset accent schemes or pick brand custom hex colors. Syncs automatically to local storage.</p>
          </div>

          <div className="bg-surface-container-lowest border border-border-muted rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 bg-secondary-container/10 text-secondary">💵</div>
            <h3 className="text-lg font-bold mb-3">USD & INR Formatting</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Switch currency formats seamlessly on the dashboard. Stored in cents, rendered to match your billing locale.</p>
          </div>

          <div className="bg-surface-container-lowest border border-border-muted rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-6 bg-error-container/10 text-error">🔒</div>
            <h3 className="text-lg font-bold mb-3">Breach & RTR Protection</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">Refresh token rotation prevents session theft. Logs automatically lock out on brute-force attempts.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-muted py-8 text-center bg-surface-container-low text-xs md:text-sm text-on-surface-variant">
        <p>© 2026 Invivizimo Platform. Styled with Tailwind CSS v4.</p>
      </footer>
    </div>
  );
};
