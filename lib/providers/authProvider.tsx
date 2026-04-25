'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthStore();

  // Expose token on window so L1 interceptor can read it
  useEffect(() => {
    if (token) {
      (window as Window & { __authToken?: string }).__authToken = token;
    }
  }, [token]);

  // Listen for logout events dispatched by L1 401 interceptor
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  return <>{children}</>;
}
