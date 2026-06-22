'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FeatureCollection, Point } from 'geojson';
import type { CircleLayerSpecification, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, {
  AttributionControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import { useMapReports, type MapViewportParams } from '@/hooks/useMap';
import {
  MAP_SIDEBAR_TRANSITION_MS,
  selectMapPaddingLeft,
  useMapShellStore,
} from '@/lib/store/mapShellStore';
import { mapShellMapClass } from '@/lib/map/mapShellStyles';

/**
 * OpenStreetMap standard-like raster style for Google/OpenLitterMap basic appearance:
 * colorful roads, rivers, and real place labels.
 */
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
  layers: [
    {
      id: 'osm-raster',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/** Default center HCM — BR-MAP-001 */
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 10;

const SOURCE_ID = 'reports';
const REPORT_POINTS_LAYER_ID = 'report-points';

export type MapLibreViewHandle = {
  refresh: () => void;
  setMapStyle: (style: 'dark' | 'light') => void;
};

type MapLibreViewProps = {
  className?: string;
  onMonitoringCountChange?: (count: number) => void;
};

type ReportFeatureProperties = {
  id: string;
  severity: string;
  code: string;
  title: string;
  address?: string | null;
  status?: string;
  createdAt?: string;
};

type ReportFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: ReportFeatureProperties;
};

const REPORT_POINTS_LAYER: CircleLayerSpecification = {
  id: REPORT_POINTS_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  paint: {
    // OpenLitterMap-like: mostly small red dots.
    'circle-color': '#d92b2b',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2.2, 14, 4.2],
    'circle-stroke-width': 0.8,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.98,
  },
};

export const MapLibreView = forwardRef<MapLibreViewHandle, MapLibreViewProps>(function MapLibreView(
  { className, onMonitoringCountChange },
  ref
) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewport, setViewport] = useState<MapViewportParams | null>(null);
  const [mapStyle, setMapStyleState] = useState<StyleSpecification>(OSM_LIGHT_STYLE);
  const [popupFeature, setPopupFeature] = useState<ReportFeature | null>(null);
  const mapPaddingLeft = useMapShellStore(selectMapPaddingLeft);
  const { data, isFetching } = useMapReports(viewport);

  const geojson = useMemo<FeatureCollection<Point, ReportFeatureProperties>>(() => {
    const items = data?.data?.items ?? [];
    return {
      type: 'FeatureCollection' as const,
      features: items
        .filter(item => Number.isFinite(item.longitude) && Number.isFinite(item.latitude))
        .map(item => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [item.longitude, item.latitude] as [number, number],
          },
          properties: {
            id: item.id,
            severity: item.severity,
            code: item.code,
            title: item.title,
            address: item.address,
            status: item.status,
            createdAt: item.createdAt,
          },
        })),
    };
  }, [data?.data?.items]);

  const updateViewportFromMap = useCallback((ref: MapRef | null) => {
    const map = ref?.getMap();
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    setViewport({
      minLat: Number(bounds.getSouth().toFixed(6)),
      maxLat: Number(bounds.getNorth().toFixed(6)),
      minLng: Number(bounds.getWest().toFixed(6)),
      maxLng: Number(bounds.getEast().toFixed(6)),
      mode: 'detail',
      limit: 1000,
    });
  }, []);

  const refresh = useCallback(() => {
    const ref = mapRef.current;
    const map = ref?.getMap();
    if (!map) return;
    updateViewportFromMap(ref);
    map.resize();
    map.triggerRepaint();
  }, [updateViewportFromMap]);

  const setMapStyle = useCallback((style: 'dark' | 'light') => {
    // Keep API stable; map now uses one OSM-like light style to match requested UI.
    setMapStyleState(OSM_LIGHT_STYLE);
    if (style === 'dark') setMapStyleState(OSM_LIGHT_STYLE);
  }, []);

  useImperativeHandle(ref, () => ({ refresh, setMapStyle }), [refresh, setMapStyle]);

  const applyMapPadding = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({
      padding: {
        left: mapPaddingLeft,
        top: 0,
        right: 0,
        bottom: 0,
      },
      duration: MAP_SIDEBAR_TRANSITION_MS,
    });
  }, [mapPaddingLeft]);

  const handleMapLoad = useCallback(() => {
    updateViewportFromMap(mapRef.current);
    applyMapPadding();
  }, [updateViewportFromMap, applyMapPadding]);

  const handleMoveEnd = useCallback(
    (_event: ViewStateChangeEvent) => {
      updateViewportFromMap(mapRef.current);
    },
    [updateViewportFromMap]
  );

  const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0] as ReportFeature | undefined;
    setPopupFeature(feature ?? null);
  }, []);

  useEffect(() => {
    onMonitoringCountChange?.(geojson.features.length);
  }, [geojson, onMonitoringCountChange]);

  useEffect(() => {
    if (!isFetching && !data?.data?.items?.length) {
      onMonitoringCountChange?.(0);
    }
  }, [data?.data?.items?.length, isFetching, onMonitoringCountChange]);

  /** Shift visible viewport when sidebar is pinned — hover does NOT affect map. */
  useEffect(() => {
    applyMapPadding();
  }, [applyMapPadding]);

  return (
    <div
      className={className ?? mapShellMapClass()}
      role="application"
      aria-label="Bản đồ báo cáo ô nhiễm"
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        mapStyle={mapStyle}
        attributionControl={false}
        interactiveLayerIds={[REPORT_POINTS_LAYER_ID]}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onError={event => console.error('[MapLibreView] Map error:', event.error)}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <AttributionControl position="bottom-right" compact />

        <Source id={SOURCE_ID} type="geojson" data={geojson}>
          <Layer {...REPORT_POINTS_LAYER} />
        </Source>

        {popupFeature ? (
          <Popup
            longitude={popupFeature.geometry.coordinates[0]}
            latitude={popupFeature.geometry.coordinates[1]}
            closeOnClick={false}
            onClose={() => setPopupFeature(null)}
            closeButton
            maxWidth="220px"
            className="map-report-popup"
          >
            <div className="text-[11px] leading-[1.35] text-zinc-600">
              <p className="mb-0.5 text-xs leading-[1.35] font-semibold text-gray-900">
                {popupFeature.properties.title}
              </p>
              <p className="mb-0.5 text-[11px] text-zinc-600">#{popupFeature.properties.code}</p>
              {popupFeature.properties.address ? (
                <p className="mb-0.5 text-gray-500">{popupFeature.properties.address}</p>
              ) : null}
              {popupFeature.properties.status ? (
                <p className="m-0 text-gray-700">Status: {popupFeature.properties.status}</p>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
});
