'use client';

import { clearAuthCookies } from '@/lib/storage/authCookies';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'officer' | 'cleanup' | 'admin';
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
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
        if (typeof window !== 'undefined') {
          (window as Window & { __authToken?: string }).__authToken = undefined;
          clearAuthCookies();
          try {
            localStorage.removeItem('auth-storage');
          } catch {
            /* ignore */
          }
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist token+user — never persist lists or API data
      partialize: state => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
