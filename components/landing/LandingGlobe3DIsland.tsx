'use client';

import dynamic from 'next/dynamic';
import {
  globeDemoConfig,
  globeDemoMarkers,
  VIETNAM_INITIAL_VIEW,
} from '@/components/3d-globe-demo';

const Globe3D = dynamic(
  () =>
    import('@/lib/three/r3fClockCompat').then(() =>
      import('@/components/ui/3d-globe').then(mod => ({ default: mod.Globe3D }))
    ),
  {
    ssr: false,
    loading: () => <div className="size-full" aria-hidden />,
  }
);

export function LandingGlobe3DIsland() {
  return (
    <Globe3D
      className="h-full w-full"
      markers={globeDemoMarkers}
      config={{
        ...globeDemoConfig,
        initialViewLatLng: VIETNAM_INITIAL_VIEW,
      }}
    />
  );
}
