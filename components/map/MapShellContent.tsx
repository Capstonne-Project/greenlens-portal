'use client';

import type { ReactNode } from 'react';
import {
  MAP_SHELL_SIDEBAR_WIDTH_MS,
  selectPanelContentInsetLeft,
  useMapShellStore,
} from '@/lib/store/mapShellStore';
import {
  mapOfficerNavPageShellClass,
  mapShellContentPanelClass,
  mapShellMapLayerClass,
} from '@/lib/map/mapShellStyles';

type MapShellContentProps = {
  children: ReactNode;
  variant?: 'map' | 'panel';
};

/**
 * Map: full-bleed — sidebar overlay; MapLibre padding khi pin.
 * Panel: collapsed rail inset; hover expand = overlay; pin = đẩy content theo sidebar rộng.
 */
export function MapShellContent({ children, variant = 'map' }: MapShellContentProps) {
  const panelInsetLeft = useMapShellStore(selectPanelContentInsetLeft);

  if (variant === 'map') {
    return <div className={mapShellMapLayerClass()}>{children}</div>;
  }

  return (
    <div
      className={mapShellContentPanelClass()}
      style={{
        paddingLeft: `${panelInsetLeft}px`,
        transition: `padding-left ${MAP_SHELL_SIDEBAR_WIDTH_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      }}
    >
      <div className={mapOfficerNavPageShellClass('outer')}>
        <div className={mapOfficerNavPageShellClass('inner')}>{children}</div>
      </div>
    </div>
  );
}
