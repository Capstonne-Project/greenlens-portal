'use client';

import { MapShellLayout } from '@/components/map/MapShellLayout';
import {
  getAuthStoreHydratedServerSnapshot,
  getAuthStoreHydratedSnapshot,
  subscribeAuthStoreHydration,
} from '@/lib/auth/authStoreHydration';
import { getMapShellNavForRole, isMapShellRoute } from '@/lib/constants/mapShellNav';
import { useAuthStore } from '@/lib/store/authStore';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';

function MapShellAuthSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-1 animate-pulse flex-col gap-4 p-6">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
      <div className="h-96 flex-1 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

export function MapShellRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const systemRole = useAuthStore(s => s.user?.systemRole);
  const hasHydrated = useSyncExternalStore(
    subscribeAuthStoreHydration,
    getAuthStoreHydratedSnapshot,
    getAuthStoreHydratedServerSnapshot
  );

  if (!isMapShellRoute(pathname)) {
    return <>{children}</>;
  }

  const navConfig = getMapShellNavForRole(hasHydrated ? systemRole : undefined);

  return (
    <MapShellLayout config={navConfig}>
      {hasHydrated ? children : <MapShellAuthSkeleton />}
    </MapShellLayout>
  );
}
