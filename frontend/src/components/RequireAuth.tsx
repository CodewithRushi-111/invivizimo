import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.spinnerContainer}>
        <div style={styles.spinner} />
        <span style={styles.spinnerText}>Restoring Session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const styles = {
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'var(--bg-app)',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '3px solid var(--border)',
    borderTopColor: 'var(--primary)',
    animation: 'spin 1s linear infinite',
    boxShadow: 'var(--primary-glow)',
  },
  spinnerText: {
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    fontSize: '16px',
    fontWeight: '500',
    letterSpacing: '0.05em',
  },
};

// Add raw CSS animation tag if it's not defined
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleElement);

export default RequireAuth;
