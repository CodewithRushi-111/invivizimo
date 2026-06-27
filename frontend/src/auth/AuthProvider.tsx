import React, { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../lib/api/client';
import { refreshClient } from '../lib/api/refreshClient';
import { tokenStore } from './tokenStore';

export interface UserProfile {
  _id: string;
  email: string;
  role: 'user' | 'admin' | 'owner';
  isVerified: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;
  bootstrapSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let bootstrapPromise: Promise<void> | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrapSession = async () => {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = (async () => {
      try {
        // 1. Attempt refresh to get a new Access Token
        const { data: refreshData } = await refreshClient.post('/auth/refresh');
        const token = refreshData.data.accessToken;
        tokenStore.set(token);

        // 2. Fetch authenticated profile
        const { data: meData } = await client.get('/users/me');
        setUser(meData.data);
      } catch (e) {
        // No active session, wipe store
        tokenStore.clear();
        setUser(null);
      } finally {
        setLoading(false);
        bootstrapPromise = null;
      }
    })();

    return bootstrapPromise;
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  };

  // Bootstrap session on initial app mount
  useEffect(() => {
    bootstrapSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, bootstrapSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthProvider;
