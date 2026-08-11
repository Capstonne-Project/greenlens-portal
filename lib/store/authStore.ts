'use client';

import { clearAuthSessionViaApi } from '@/lib/api/authSessionClient';
import type { UserRole } from '@/lib/constants/systemRoles';
import { clearLegacyClientAuthCookies } from '@/lib/storage/authCookies';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** Bucket route: admin | officer | cleanup | citizen | company */
  role: 'citizen' | 'officer' | 'cleanup' | 'admin' | 'company';
  /** Role BE (`UserRole`) — 8 human roles; officer portal chỉ DEO/LEO. */
  systemRole?: UserRole;
  avatarUrl?: string;
  mustChangePassword?: boolean;
}

interface AuthState {
  /** In-memory only — never persisted to localStorage (XSS surface). */
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        // Expose token on window so L1 interceptor can read it without circular import
        if (typeof window !== 'undefined') {
          (window as Window & { __authToken?: string }).__authToken = token;
        }
        set({ token, user, isAuthenticated: true });
      },

      updateUser: patch =>
        set(state => {
          if (!state.user) return state;
          return { user: { ...state.user, ...patch } };
        }),

      logout: () => {
        const { token, user, isAuthenticated } = get();
        // Idempotent: auth:logout listeners may call logout() again after we dispatch.
        if (!token && !user && !isAuthenticated) {
          return;
        }

        // RQ cache clear happens in AuthProvider via useQueryClient (live Provider instance).
        if (typeof window !== 'undefined') {
          (window as Window & { __authToken?: string }).__authToken = undefined;
          clearLegacyClientAuthCookies();
          void clearAuthSessionViaApi();
          try {
            localStorage.removeItem('auth-storage');
          } catch {
            /* ignore */
          }
        }
        set({ token: null, user: null, isAuthenticated: false });

        // Notify AuthProvider (RQ clear) + SignalR.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist profile only — never token / secrets (BR-DAT / XSS).
      // Protected REST must wait for memory JWT: hooks/useAuthSession.ts → useCanFetchProtected().
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
