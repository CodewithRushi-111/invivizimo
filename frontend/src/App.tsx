import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './auth/AuthProvider';
import { CurrencyProvider } from './context/CurrencyContext';
import { RequireAuth } from './components/RequireAuth';
import { WorkspaceLayout } from './components/WorkspaceLayout';

// Page imports
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Dashboard } from './pages/Dashboard';
import { InvoiceEditor } from './pages/InvoiceEditor';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Marketing/Auth routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected Workspace routes */}
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <WorkspaceLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="invoices/new" element={<InvoiceEditor />} />
                  <Route path="invoices/:id" element={<InvoiceEditor />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
