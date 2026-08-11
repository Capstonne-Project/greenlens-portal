'use client';

import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';

import { getMapStyle } from '@/lib/map/mapStyle';

export interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

/** Bản đồ đọc-only — pin vị trí báo cáo (MapLibre + Goong Maptiles). */
export function ReportLocationMap({ latitude, longitude, className }: ReportLocationMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [longitude, latitude], zoom: 15, duration: 400 });
  }, [latitude, longitude]);

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapStyle={getMapStyle()}
        projection={{ type: 'globe' }}
        initialViewState={{ longitude, latitude, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <MapPin
            className="size-8 -translate-y-1 fill-emerald-500 text-emerald-700 drop-shadow"
            aria-hidden
          />
        </Marker>
      </Map>
    </div>
  );
}
