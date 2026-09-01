'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicMapChrome } from '@/components/map/public/PublicMapChrome';
import { PublicMapHeader } from '@/components/map/public/PublicMapHeader';
import { usePublicMapSummary, type PublicMapViewportParams } from '@/hooks/useMap';
import { PUBLIC_MAP_MIN_ZOOM } from '@/lib/constants/mapReports';
import { parsePublicMapPresence, type PublicMapPresence } from '@/lib/constants/reportStatus';
import { VIETNAM_MAP_BOUNDS } from '@/lib/constants/vietnamMapBounds';
import type { PublicMapCameraHint, PublicMapFlyTo } from '@/components/map/public/PublicMapView';

const VN_FLY_CENTER = {
  longitude: (VIETNAM_MAP_BOUNDS.minLng + VIETNAM_MAP_BOUNDS.maxLng) / 2,
  latitude: (VIETNAM_MAP_BOUNDS.minLat + VIETNAM_MAP_BOUNDS.maxLat) / 2,
};

function MapFallback() {
  return <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden />;
}

const PublicMapView = dynamic(
  () => import('@/components/map/public/PublicMapView').then(m => m.PublicMapView),
  { ssr: false, loading: MapFallback }
);

function parseCamera(searchParams: URLSearchParams): PublicMapCameraHint | null {
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon') ?? searchParams.get('lng'));
  const zoom = Number(searchParams.get('zoom'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (
    lat < VIETNAM_MAP_BOUNDS.minLat ||
    lat > VIETNAM_MAP_BOUNDS.maxLat ||
    lon < VIETNAM_MAP_BOUNDS.minLng ||
    lon > VIETNAM_MAP_BOUNDS.maxLng
  ) {
    return null;
  }
  const clampedZoom = Number.isFinite(zoom) ? zoom : PUBLIC_MAP_MIN_ZOOM;
  return { latitude: lat, longitude: lon, zoom: clampedZoom };
}

function replaceQuery(current: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '') next.delete(key);
    else next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/map?${qs}` : '/map';
}

export function PublicMapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presence = parsePublicMapPresence(searchParams.get('presence'));
  const provinceCode = searchParams.get('province')?.trim() || null;
  const initialCamera = useMemo(() => parseCamera(searchParams), [searchParams]);

  const [viewport, setViewport] = useState<PublicMapViewportParams | null>(null);
  const [flyTo, setFlyTo] = useState<PublicMapFlyTo | null>(null);

  const summaryParams = viewport
    ? {
        minLat: viewport.minLat,
        maxLat: viewport.maxLat,
        minLng: viewport.minLng,
        maxLng: viewport.maxLng,
        presence,
        provinceCode: provinceCode ?? undefined,
      }
    : null;

  const summaryQuery = usePublicMapSummary(summaryParams);

  const setPresence = useCallback(
    (next: PublicMapPresence) => {
      router.replace(replaceQuery(searchParams, { presence: next === 'active' ? null : next }), {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const onProvinceSelect = useCallback(
    (province: { code: string | null; name?: string; longitude?: number; latitude?: number }) => {
      router.replace(replaceQuery(searchParams, { province: province.code }), { scroll: false });
      if (!province.code) {
        setFlyTo({
          seq: Date.now(),
          longitude: VN_FLY_CENTER.longitude,
          latitude: VN_FLY_CENTER.latitude,
          zoom: PUBLIC_MAP_MIN_ZOOM,
        });
        return;
      }
      if (Number.isFinite(province.longitude) && Number.isFinite(province.latitude)) {
        setFlyTo({
          seq: Date.now(),
          longitude: province.longitude as number,
          latitude: province.latitude as number,
          zoom: 8,
        });
      }
    },
    [router, searchParams]
  );

  return (
    <div className="absolute inset-0">
      <PublicMapView
        presence={presence}
        provinceCode={provinceCode}
        flyTo={flyTo}
        initialCamera={initialCamera}
        onViewportChange={setViewport}
      />
      <PublicMapHeader
        provinces={summaryQuery.data?.data?.byProvince ?? []}
        onProvinceSelect={onProvinceSelect}
      />
      <PublicMapChrome
        presence={presence}
        onPresenceChange={setPresence}
        provinceCode={provinceCode}
        onProvinceSelect={onProvinceSelect}
        summary={summaryQuery.data?.data}
        isSummaryError={summaryQuery.isError}
      />
    </div>
  );
}
