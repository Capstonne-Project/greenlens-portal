'use client';

import { MapShellRouteWrapper } from '@/components/map/MapShellRouteWrapper';
import { NavigationProgressProvider } from '@/lib/providers/navigationProgressProvider';

export function OfficerRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProgressProvider>
      <MapShellRouteWrapper>{children}</MapShellRouteWrapper>
    </NavigationProgressProvider>
  );
}
