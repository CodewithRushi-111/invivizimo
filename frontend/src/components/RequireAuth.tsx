import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-surface gap-5">
        <div className="w-12 h-12 rounded-full border-4 border-border-muted border-t-primary animate-spin" />
        <span className="font-sans text-on-surface text-base font-semibold tracking-wide">
          Restoring Session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
