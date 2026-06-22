'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { getMapShellNavForRole, isMapShellRoute } from '@/lib/constants/mapShellNav';
import { MapShellLayout } from '@/components/map/MapShellLayout';
import { usePathname } from 'next/navigation';

export function MapShellRouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const systemRole = useAuthStore(s => s.user?.systemRole);

  if (!isMapShellRoute(pathname)) {
    return <>{children}</>;
  }

  const navConfig = getMapShellNavForRole(systemRole);
  return <MapShellLayout config={navConfig}>{children}</MapShellLayout>;
}
