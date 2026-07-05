'use client';

import { useRef } from 'react';
import { MapLibreView, type MapLibreViewHandle } from './MapLibreView';
import { MapRightSidebar } from './MapRightSidebar';

export function OfficerMapPageClient() {
  const mapRef = useRef<MapLibreViewHandle>(null);

  return (
    <>
      <MapLibreView ref={mapRef} />
      <MapRightSidebar onRefresh={() => mapRef.current?.refresh()} />
    </>
  );
}
