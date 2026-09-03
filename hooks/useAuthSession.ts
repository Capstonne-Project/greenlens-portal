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
 *    hit L1 without Bearer → historically 401 flash, then interceptor refresh → 200.
 * 5. L1 now awaits `sessionRestoreGate` before sending protected calls without a
 *    token (see `lib/auth/sessionRestoreGate.ts`) — eliminates the 401 round-trip.
 * 6. Rule: still prefer `useCanFetchProtected()` for `enabled` on protected
 *    REST/SignalR so RQ does not start until memory JWT exists.
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
import {
  getSessionRestoreServerSnapshot,
  isSessionRestoreComplete,
  subscribeSessionRestore,
} from '@/lib/auth/sessionRestoreGate';

/** True after Zustand `auth-storage` rehydrates from localStorage. */
export function useAuthStoreHydrated(): boolean {
  return useSyncExternalStore(
    subscribeAuthStoreHydration,
    getAuthStoreHydratedSnapshot,
    getAuthStoreHydratedServerSnapshot
  );
}

/** True after AuthProvider finished hydrate + optional silent refresh. */
export function useSessionRestoreReady(): boolean {
  return useSyncExternalStore(
    subscribeSessionRestore,
    isSessionRestoreComplete,
    getSessionRestoreServerSnapshot
  );
}

/** True when memory holds an access JWT (L1 can send Bearer). */
export function useHasAccessToken(): boolean {
  return Boolean(useAuthStore(s => s.token));
}

/**
 * React Query `enabled` / realtime subscribe gate for protected endpoints.
 * Requires session bootstrap done AND memory JWT present.
 */
export function useCanFetchProtected(): boolean {
  const sessionReady = useSessionRestoreReady();
  const hasToken = useHasAccessToken();
  return sessionReady && hasToken;
}

/**
 * Compose call-site `enabled` with the protected session gate.
 * Use at every protected `useQuery` so RQ does not start work before Bearer exists.
 */
export function useProtectedQueryEnabled(enabled = true): boolean {
  return useCanFetchProtected() && enabled;
}
