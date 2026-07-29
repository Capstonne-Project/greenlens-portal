'use client';

import { useEffect, useRef } from 'react';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';

const OSM_LIGHT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-raster', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 22 }],
};

export interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

/** Bản đồ đọc-only — pin vị trí báo cáo (MapLibre + OSM). */
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
        mapStyle={OSM_LIGHT_STYLE}
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
