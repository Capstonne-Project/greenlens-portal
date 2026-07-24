'use client';

import { refreshSessionOnce } from '@/lib/api/core';
import type { LoginSuccessData } from '@/lib/api/types/auth';
import { buildAuthUserFromApi } from '@/lib/auth/buildAuthUser';
import { getUserFromAccessToken } from '@/lib/auth/userFromAccessToken';
import { getAccessTokenFromCookie, getRefreshTokenFromCookie } from '@/lib/storage/authCookies';
import type { AuthUser } from '@/lib/store/authStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect } from 'react';

function sessionToAuthUser(data: LoginSuccessData): AuthUser {
  return buildAuthUserFromApi(data.user);
}

function syncAuthAfterHydration(setAuth: (token: string, user: AuthUser) => void) {
  const s = useAuthStore.getState();

  if (s.token && s.user) {
    (window as Window & { __authToken?: string }).__authToken = s.token;
    // Persist cũ có thể thiếu systemRole — backfill từ JWT.
    if (!s.user.systemRole) {
      const fromJwt = getUserFromAccessToken(s.token);
      if (fromJwt?.systemRole) {
        setAuth(s.token, { ...s.user, systemRole: fromJwt.systemRole });
      }
    }
    return;
  }

  if (s.token && !s.user) {
    const user = getUserFromAccessToken(s.token);
    if (user) setAuth(s.token, user);
    return;
  }

  const cookieToken = getAccessTokenFromCookie();
  if (cookieToken) {
    const user = getUserFromAccessToken(cookieToken);
    if (user) setAuth(cookieToken, user);
    return;
  }

  // Access token missing/expired but refresh cookie still valid — silently
  // refresh once on bootstrap so the session survives across visits.
  if (getRefreshTokenFromCookie()) {
    void refreshSessionOnce();
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, logout, setAuth } = useAuthStore();

  // After persist rehydrates from localStorage, sync window token; if empty, restore from cookie.
  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi) {
      syncAuthAfterHydration(setAuth);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => {
      syncAuthAfterHydration(setAuth);
    });
    if (persistApi.hasHydrated()) {
      syncAuthAfterHydration(setAuth);
    }
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
