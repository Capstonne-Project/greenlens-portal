'use client';

import dynamic from 'next/dynamic';
import { MapLoadingSkeleton } from '@/components/map/MapLoadingSkeleton';

const CitizenMapView = dynamic(() => import('./CitizenMapView').then(mod => mod.CitizenMapView), {
  ssr: false,
  loading: () => (
    <div className="relative h-full w-full">
      <MapLoadingSkeleton ready={false} />
    </div>
  ),
});

export function CitizenMapPageClient() {
  return (
    <div className="absolute inset-0 size-full">
      <CitizenMapView />
    </div>
  );
}
