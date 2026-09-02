'use client';

import { useAuthStore } from '@/lib/store/authStore';

/** Subscribe to Zustand persist rehydration from localStorage. */
export function subscribeAuthStoreHydration(onStoreChange: () => void) {
  const persistApi = useAuthStore.persist;
  if (!persistApi) return () => {};
  return persistApi.onFinishHydration(onStoreChange);
}

/** Client: auth profile flags restored from localStorage. */
export function getAuthStoreHydratedSnapshot() {
  return useAuthStore.persist?.hasHydrated() ?? true;
}

/** SSR: never read persist storage on the server. */
export function getAuthStoreHydratedServerSnapshot() {
  return false;
}
