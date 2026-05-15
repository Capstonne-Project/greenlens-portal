'use client';

import type { LoginSuccessData } from '@/lib/api/types/auth';
import { mapApiRoleToAuth } from '@/lib/auth/mapUser';
import { getUserFromAccessToken } from '@/lib/auth/userFromAccessToken';
import { getAccessTokenFromCookie } from '@/lib/storage/authCookies';
import type { AuthUser } from '@/lib/store/authStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect } from 'react';

function sessionToAuthUser(data: LoginSuccessData): AuthUser {
  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    name: u.fullName,
    role: mapApiRoleToAuth(u.role),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, logout, setAuth } = useAuthStore();

  // After persist rehydrates from localStorage, sync window token; if empty, restore from cookie (browser revisit).
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      const s = useAuthStore.getState();
      if (s.token && s.user) {
        (window as Window & { __authToken?: string }).__authToken = s.token;
        return;
      }
      if (s.token && !s.user) {
        const user = getUserFromAccessToken(s.token);
        if (user) setAuth(s.token, user);
        return;
      }
      const cookieToken = getAccessTokenFromCookie();
      if (!cookieToken) return;
      const user = getUserFromAccessToken(cookieToken);
      if (!user) return;
      setAuth(cookieToken, user);
    });
    return unsub;
  }, [setAuth]);

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

  // Sync Zustand after silent refresh (cookies + window token already updated in L1)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<LoginSuccessData>;
      const d = ce.detail;
      if (!d?.user) return;
      setAuth(d.accessToken, sessionToAuthUser(d));
    };
    window.addEventListener('auth:session', handler);
    return () => window.removeEventListener('auth:session', handler);
  }, [setAuth]);

  return <>{children}</>;
}
