'use client';

import { useEffect, useMemo, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';

import { COMPARE_MAP_FRAME_HEIGHT } from '@/components/officer/verify/compareMapFrame';
import { getMapStyle } from '@/lib/map/mapStyle';
import { cn } from '@/lib/utils';

export { COMPARE_MAP_FRAME_HEIGHT };

export type CompareMapPin = {
  latitude: number;
  longitude: number;
  label: string;
  /** amber = nghi trùng / đang xác minh; brand green (`#3f6b32`) = báo cáo gốc */
  tone: 'suspect' | 'original';
};

type CompareReportsMapProps = {
  pins: CompareMapPin[];
  className?: string;
  /** Legend dưới map — `null` ẩn; mặc định nhãn dialog trùng lặp. */
  legend?: { suspect: string; original: string } | null;
};

function isValidCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/** Bản đồ so sánh 2 vị trí báo cáo — fitBounds cả 2 pin (MapLibre + OSM). */
export function CompareReportsMap({
  pins,
  className,
  legend = { suspect: 'Đang xác minh', original: 'Báo cáo gốc' },
}: CompareReportsMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  const validPins = useMemo(() => pins.filter(p => isValidCoord(p.latitude, p.longitude)), [pins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || validPins.length === 0) return;

    if (validPins.length === 1) {
      const only = validPins[0];
      map.flyTo({ center: [only.longitude, only.latitude], zoom: 15, duration: 400 });
      return;
    }

    const lngs = validPins.map(p => p.longitude);
    const lats = validPins.map(p => p.latitude);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, duration: 450, maxZoom: 16 }
    );
  }, [validPins]);

  if (validPins.length === 0) {
    return (
      <div
        className={cn(
          'flex min-w-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-center text-sm text-slate-500 ring-1 ring-slate-200',
          COMPARE_MAP_FRAME_HEIGHT,
          className
        )}
      >
        Không có tọa độ GPS để hiển thị bản đồ
      </div>
    );
  }

  const initial = validPins[0];

  return (
    <div
      className={cn('w-full min-w-0 overflow-hidden rounded-xl ring-1 ring-slate-200', className)}
    >
      <div className={cn('min-w-0', COMPARE_MAP_FRAME_HEIGHT)}>
        <Map
          ref={mapRef}
          mapStyle={getMapStyle()}
          projection={{ type: 'globe' }}
          initialViewState={{
            longitude: initial.longitude,
            latitude: initial.latitude,
            zoom: 14,
          }}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" showCompass={false} />
          {validPins.map(pin => (
            <Marker
              key={`${pin.tone}-${pin.latitude}-${pin.longitude}`}
              longitude={pin.longitude}
              latitude={pin.latitude}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'mb-0.5 max-w-[min(7rem,28vw)] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm',
                    pin.tone === 'suspect' ? 'bg-amber-500' : 'bg-brand'
                  )}
                >
                  {pin.label}
                </span>
                <MapPin
                  className={cn(
                    'size-7 -translate-y-1 drop-shadow sm:size-8',
                    pin.tone === 'suspect'
                      ? 'fill-amber-500 text-amber-700'
                      : 'fill-brand text-brand-dark'
                  )}
                  aria-hidden
                />
              </div>
            </Marker>
          ))}
        </Map>
      </div>
      {legend ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 bg-white px-3 py-2 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            {legend.suspect}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden />
            {legend.original}
          </span>
        </div>
      ) : null}
    </div>
  );
}
