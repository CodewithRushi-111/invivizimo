import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useCurrency } from '../context/CurrencyContext';

export const WorkspaceLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard Overview';
    if (location.pathname.includes('/new')) return 'Create Invoice';
    if (location.pathname.includes('/settings')) return 'Settings Hub';
    if (location.pathname.match(/\/invoices\/[a-f0-9]+$/i)) return 'Invoice Details';
    return 'Workspace';
  };

  return (
    <div className="min-h-screen flex bg-background text-on-background font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[240px] bg-surface border-r border-border-muted flex-col py-6 z-50">
        <div className="px-6 py-2 flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm border border-border-muted">
            <img src="/logo.png" alt="Invoizmo" className="h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-on-surface">Invoizmo</h1>
            <p className="text-[10px] text-text-muted font-mono tracking-tighter uppercase">
              {user?.role || 'user'} workspace
            </p>
          </div>
        </div>

        <nav className="mt-8 flex-1 px-4 space-y-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/dashboard')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/invoices/new"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/invoices/new')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span>Create Invoice</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/settings')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="mt-auto px-4 space-y-4">
          <div className="pt-4 border-t border-border-muted space-y-3">
            <div className="flex flex-col px-4">
              <span className="text-xs font-semibold text-on-surface truncate" title={user?.email}>
                {user?.email}
              </span>
              <span className="text-[10px] text-text-muted font-mono uppercase mt-0.5">
                Role: {user?.role || 'Member'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/10 rounded-lg transition-colors text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-[240px] bg-surface border-r border-border-muted flex flex-col py-6 z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-2 flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-lg flex items-center justify-center shadow-sm border border-border-muted">
            <img src="/logo.png" alt="Invoizmo" className="h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-on-surface">Invoizmo</h1>
            <p className="text-[10px] text-text-muted font-mono tracking-tighter uppercase">
              {user?.role || 'user'} workspace
            </p>
          </div>
        </div>

        <nav className="mt-8 flex-1 px-4 space-y-1">
          <Link
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/dashboard')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/invoices/new"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/invoices/new')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span>Create Invoice</span>
          </Link>
          <Link
            to="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
              isActive('/settings')
                ? 'text-primary border-l-4 border-primary bg-primary-container/10 font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="mt-auto px-4 space-y-4">
          <div className="pt-4 border-t border-border-muted space-y-3">
            <div className="flex flex-col px-4">
              <span className="text-xs font-semibold text-on-surface truncate" title={user?.email}>
                {user?.email}
              </span>
              <span className="text-[10px] text-text-muted font-mono uppercase mt-0.5">
                Role: {user?.role || 'Member'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/10 rounded-lg transition-colors text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[240px] overflow-x-hidden">
        {/* Verification Alert Banner */}
        {user && !user.isVerified && (
          <div className="no-print bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-600 dark:text-yellow-500 py-3.5 px-6 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm font-medium z-30">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">mail</span>
              <span>
                <strong>Your email is unverified.</strong> Verify your account to unlock full invoicing features.
              </span>
            </div>
            <Link
              to="/verify-email"
              className="self-start sm:self-center px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              Verify Now
            </Link>
          </div>
        )}

        {/* TopNavBar */}
        <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-border-muted h-16 flex items-center justify-between px-6 md:px-8 shadow-sm">
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h2 className="font-display text-lg md:text-xl font-bold tracking-tight text-on-surface">
              {getPageTitle()}
            </h2>
          </div>

          {/* Right: Currency Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container border border-border-muted p-1 rounded-lg gap-1">
              <span className="hidden sm:inline text-xs font-semibold text-text-muted px-2">Currency:</span>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  currency === 'USD'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  currency === 'INR'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
