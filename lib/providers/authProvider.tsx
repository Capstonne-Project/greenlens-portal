'use client';

import { refreshSessionOnce } from '@/lib/api/core';
import type { AuthSessionEventDetail } from '@/lib/api/core';
import { persistAuthSession } from '@/lib/api/authSessionClient';
import { buildAuthUserFromApi } from '@/lib/auth/buildAuthUser';
import { getUserFromAccessToken } from '@/lib/auth/userFromAccessToken';
import {
  clearLegacyClientAuthCookies,
  getLegacyAccessTokenFromCookie,
  getLegacyRefreshTokenFromCookie,
  getMustChangePasswordFromCookie,
  setMustChangePasswordCookie,
} from '@/lib/storage/authCookies';
import type { AuthUser } from '@/lib/store/authStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect } from 'react';

function sessionToAuthUser(data: AuthSessionEventDetail): AuthUser {
  return buildAuthUserFromApi(data.user);
}

function withMustChangeFromCookie(user: AuthUser): AuthUser {
  const fromCookie = getMustChangePasswordFromCookie();
  const must = Boolean(user.mustChangePassword) || fromCookie;

  if (must) {
    setMustChangePasswordCookie(true);
    return { ...user, mustChangePassword: true };
  }

  return { ...user, mustChangePassword: false };
}

async function migrateLegacyClientCookies(): Promise<{ access: string; refresh: string } | null> {
  const access = getLegacyAccessTokenFromCookie();
  const refresh = getLegacyRefreshTokenFromCookie();
  if (!access || !refresh) return null;
  const ok = await persistAuthSession(access, refresh);
  if (!ok) return null;
  clearLegacyClientAuthCookies();
  return { access, refresh };
}

async function syncAuthAfterHydration(
  setAuth: (token: string, user: AuthUser) => void,
  logout: () => void
) {
  const s = useAuthStore.getState();

  if (s.token && s.user) {
    (window as Window & { __authToken?: string }).__authToken = s.token;

    if (!s.user.systemRole) {
      const fromJwt = getUserFromAccessToken(s.token);
      if (fromJwt?.systemRole) {
        setAuth(
          s.token,
          withMustChangeFromCookie({
            ...s.user,
            systemRole: fromJwt.systemRole,
          })
        );
      }
    }
    return;
  }

  if (s.token && !s.user) {
    const user = getUserFromAccessToken(s.token);
    if (user) {
      setAuth(s.token, withMustChangeFromCookie(user));
    }
    return;
  }

  const migrated = await migrateLegacyClientCookies();
  if (migrated) {
    const user = getUserFromAccessToken(migrated.access);
    if (user) {
      setAuth(migrated.access, withMustChangeFromCookie(user));
    }
    return;
  }

  // No memory token — silent refresh using HttpOnly refresh cookie
  const ok = await refreshSessionOnce();
  if (!ok && (s.isAuthenticated || s.user)) {
    logout();
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, logout, setAuth } = useAuthStore();

  useEffect(() => {
    const persistApi = useAuthStore.persist;

    const run = () => {
      void syncAuthAfterHydration(setAuth, logout).then(() => {
        const s = useAuthStore.getState();
        if (s.token && s.user) {
          const merged = withMustChangeFromCookie(s.user);
          if (merged.mustChangePassword !== s.user.mustChangePassword) {
            setAuth(s.token, merged);
          }
        }
      });
    };

    if (!persistApi) {
      run();
      return;
    }

    const unsub = persistApi.onFinishHydration(run);

    if (persistApi.hasHydrated()) {
      run();
    }

    return unsub;
  }, [setAuth, logout]);

  useEffect(() => {
    if (token) {
      (window as Window & { __authToken?: string }).__authToken = token;
    }
  }, [token]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<AuthSessionEventDetail>;
      const d = ce.detail;
      if (!d?.user) return;
      setAuth(d.accessToken, withMustChangeFromCookie(sessionToAuthUser(d)));
    };
    window.addEventListener('auth:session', handler);
    return () => window.removeEventListener('auth:session', handler);
  }, [setAuth]);

  return <>{children}</>;
}
