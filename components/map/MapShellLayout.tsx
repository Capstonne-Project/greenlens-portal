'use client';

import type { ReactNode } from 'react';
import { MapLeftSidebar } from './MapLeftSidebar';
import { MapShellContent } from './MapShellContent';
import type { MapShellNavConfig } from '@/lib/constants/mapShellNav';
import { mapShellRootClass } from '@/lib/map/mapShellStyles';
import { usePathname } from 'next/navigation';

type MapShellLayoutProps = {
  config: MapShellNavConfig;
  children: ReactNode;
};

export function MapShellLayout({ config, children }: MapShellLayoutProps) {
  const pathname = usePathname();
  const isMapRoute = pathname === '/officer/map' || pathname.startsWith('/officer/map/');

  return (
    <div className={mapShellRootClass('font-sans')}>
      <MapShellContent variant={isMapRoute ? 'map' : 'panel'}>{children}</MapShellContent>
      <MapLeftSidebar config={config} />
    </div>
  );
}
