'use client';

import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/common/AppSidebar';
import { MapShellContent } from './MapShellContent';
import type { MapShellNavConfig } from '@/lib/constants/mapShellNav';
import { usePathname } from 'next/navigation';

type MapShellLayoutProps = {
  config: MapShellNavConfig;
  children: ReactNode;
};

/**
 * Shell:
 * - Canvas `#f7f7f7` full viewport (sidebar + gutters around content).
 * - Content panel `#fffdfc` overlays with inset + rounded border (depth).
 * Map route: full-bleed map, sidebar overlay only.
 */
export function MapShellLayout({ config, children }: MapShellLayoutProps) {
  const pathname = usePathname();
  const isMapRoute = pathname === '/officer/map' || pathname.startsWith('/officer/map/');

  if (isMapRoute) {
    return (
      <div className="relative h-screen w-screen overflow-hidden font-sans">
        <div className="absolute inset-0 z-0">{children}</div>
        <div className="pointer-events-auto absolute top-0 left-0 z-30 h-full">
          <AppSidebar config={config} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#f7f7f7] font-sans md:flex-row">
      <AppSidebar config={config} />
      <MapShellContent variant="panel">{children}</MapShellContent>
    </div>
  );
}
