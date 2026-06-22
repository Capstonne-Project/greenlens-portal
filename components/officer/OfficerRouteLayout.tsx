'use client';

import { OfficerNavbar } from '@/components/officer/OfficerNavbar';
import { MapShellRouteWrapper } from '@/components/map/MapShellRouteWrapper';
import { NavigationProgressProvider } from '@/lib/providers/navigationProgressProvider';
import { isMapShellRoute } from '@/lib/constants/mapShellNav';
import { usePathname } from 'next/navigation';

export function OfficerRouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mapShell = isMapShellRoute(pathname);

  if (mapShell) {
    return (
      <NavigationProgressProvider>
        <MapShellRouteWrapper>{children}</MapShellRouteWrapper>
      </NavigationProgressProvider>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <NavigationProgressProvider>
        <OfficerNavbar />
        <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">{children}</main>
      </NavigationProgressProvider>
    </div>
  );
}
