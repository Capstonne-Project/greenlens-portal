/**
 * Protected-API readiness — single gate for React Query / SignalR after hard reload.
 *
 * ── Auth security contract (read me in 6 months) ─────────────────────────────
 * 1. Access JWT lives in MEMORY only: `authStore.token` ↔ `window.__authToken`.
 *    L1 (`lib/api/core.ts`) attaches `Authorization: Bearer …` from `__authToken`.
 * 2. Access JWT is NEVER persisted (XSS). Zustand `partialize` keeps profile flags
 *    (`user`, `isAuthenticated`) only — see `lib/store/authStore.ts`.
 * 3. Refresh / session cookies are server-side (HttpOnly via `/api/auth/*`);
 *    `AuthProvider` runs silent refresh / legacy cookie migrate after hydration.
 * 4. Hard reload: `isAuthenticated` can be `true` while `token` is still `null`
 *    until that restore finishes. Queries gated on `isAuthenticated` alone will
 *    hit L1 without Bearer → 401 flash, then interceptor refresh → 200.
 * 5. Rule: use `useCanFetchProtected()` (or `useHasAccessToken()`) for `enabled`
 *    on protected REST/SignalR — not `isAuthenticated` alone.
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import {
  getAuthStoreHydratedServerSnapshot,
  getAuthStoreHydratedSnapshot,
  subscribeAuthStoreHydration,
} from '@/lib/auth/authStoreHydration';

/** True after Zustand `auth-storage` rehydrates from localStorage. */
export function useAuthStoreHydrated(): boolean {
  return useSyncExternalStore(
    subscribeAuthStoreHydration,
    getAuthStoreHydratedSnapshot,
    getAuthStoreHydratedServerSnapshot
  );
}

/** True when memory holds an access JWT (L1 can send Bearer). */
export function useHasAccessToken(): boolean {
  return Boolean(useAuthStore(s => s.token));
}

/**
 * React Query `enabled` / realtime subscribe gate for protected endpoints.
 * Alias of `useHasAccessToken` — name documents intent at call sites.
 */
export function useCanFetchProtected(): boolean {
  return useHasAccessToken();
}
