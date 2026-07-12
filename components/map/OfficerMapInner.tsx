'use client';

import { useRef } from 'react';
import { MapLibreView, type MapLibreViewHandle } from './MapLibreView';
import { MapRightSidebar } from './MapRightSidebar';

/** Heavy map island — only loaded via `dynamic({ ssr: false })` from OfficerMapPageClient. */
export function OfficerMapInner() {
  const mapRef = useRef<MapLibreViewHandle>(null);

  return (
    <>
      <MapLibreView ref={mapRef} />
      <MapRightSidebar onRefresh={() => mapRef.current?.refresh()} />
    </>
  );
}
