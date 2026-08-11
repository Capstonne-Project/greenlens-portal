'use client';

import { useCallback, useRef, useState } from 'react';
import { MapLibreView, type MapLibreViewHandle, type MapViewMode } from './MapLibreView';
import { MapRightSidebar } from './MapRightSidebar';

/** Heavy map island — only loaded via `dynamic({ ssr: false })` from OfficerMapPageClient. */
export function OfficerMapInner() {
  const mapRef = useRef<MapLibreViewHandle>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('map');

  const handleToggleViewMode = useCallback(() => {
    const next: MapViewMode = viewMode === 'map' ? 'globe' : 'map';
    setViewMode(next);
    mapRef.current?.setViewMode(next);
  }, [viewMode]);

  return (
    <div className="absolute inset-0 z-0 flex size-full">
      <div className="relative h-full min-w-0 flex-1">
        <MapLibreView ref={mapRef} className="absolute inset-0 size-full" />
        <MapRightSidebar
          onRefresh={() => mapRef.current?.refresh()}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
        />
      </div>
    </div>
  );
}
