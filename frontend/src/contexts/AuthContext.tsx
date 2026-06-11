'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'FREE' | 'ENROLLED' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  enroll: () => Promise<{ ok: boolean; message?: string }>;
  isEnrolled: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    return Boolean(localStorage.getItem('token'));
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const enroll = async () => {
    try {
      const res = await api.post('/enrollment/enroll');
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      setUser(prev => prev ? { ...prev, role: 'ENROLLED' } : prev);
      return { ok: true };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          logout();
          return { ok: false, message: 'Session expired. Please login again.' };
        }
        return { ok: false, message: error.response?.data?.error || 'Enrollment failed' };
      }
      return { ok: false, message: 'Enrollment failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, enroll,
      isEnrolled: user?.role === 'ENROLLED' || user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
