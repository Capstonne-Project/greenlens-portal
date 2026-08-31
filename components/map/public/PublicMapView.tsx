'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { CircleLayerSpecification, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, {
  AttributionControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import { MapLoadingSkeleton } from '@/components/map/MapLoadingSkeleton';
import { MapReportPopupCard } from '@/components/map/MapReportPopupCard';
import { usePublicMapReports, type PublicMapViewportParams } from '@/hooks/useMap';
import {
  PUBLIC_MAP_MAX_ZOOM,
  PUBLIC_MAP_MIN_ZOOM,
  publicMapModeForZoom,
} from '@/lib/constants/mapReports';
import {
  isPublicMapCleanedStatus,
  publicMapGuestStatusLabelVi,
  type PublicMapPresence,
} from '@/lib/constants/reportStatus';
import { VIETNAM_MAP_BOUNDS, VIETNAM_MAP_MAX_BOUNDS } from '@/lib/constants/vietnamMapBounds';
import { getMapStyle } from '@/lib/map/mapStyle';
import { isAbortError } from '@/lib/utils/abortError';
import { cn } from '@/lib/utils';

const VIEWPORT_UPDATE_DEBOUNCE_MS = 250;
const CLUSTER_SOURCE_ID = 'public-clusters';
const CLUSTER_LAYER_ID = 'public-clusters-circle';
const PIN_SOURCE_ID = 'public-pins';
const PIN_LAYER_ID = 'public-pins-circle';

const EMPTY_POINTS: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

const VN_CENTER = {
  longitude: (VIETNAM_MAP_BOUNDS.minLng + VIETNAM_MAP_BOUNDS.maxLng) / 2,
  latitude: (VIETNAM_MAP_BOUNDS.minLat + VIETNAM_MAP_BOUNDS.maxLat) / 2,
};

export interface PublicMapFlyTo {
  seq: number;
  longitude: number;
  latitude: number;
  zoom: number;
}

export interface PublicMapCameraHint {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface PinProperties {
  id: string;
  code: string;
  title: string;
  address?: string | null;
  status: string;
  imageUrl?: string | null;
  afterImageUrl?: string | null;
  categoryIconUrl?: string | null;
  reporterCount?: number;
  /** 1 = cleaned (Resolved/Closed) — MapLibre paint không tin cậy boolean. */
  isCleaned: 0 | 1;
}

interface ClusterProperties {
  count: number;
  cleanedCount?: number;
}

type PinFeature = Feature<Point, PinProperties>;

interface PublicMapViewProps {
  presence: PublicMapPresence;
  provinceCode?: string | null;
  flyTo?: PublicMapFlyTo | null;
  initialCamera?: PublicMapCameraHint | null;
  onViewportChange?: (viewport: PublicMapViewportParams) => void;
  className?: string;
}

function clusterPaint(presence: PublicMapPresence): CircleLayerSpecification['paint'] {
  const fill = presence === 'cleaned' ? '#15803d' : presence === 'all' ? '#c2410c' : '#d92b2b';
  return {
    'circle-color': fill,
    'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 14, 20, 20, 100, 28, 500, 40],
    'circle-opacity': 0.88,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
  };
}

const PIN_LAYER_PAINT: CircleLayerSpecification['paint'] = {
  'circle-color': ['case', ['==', ['to-number', ['get', 'isCleaned']], 1], '#15803d', '#d92b2b'],
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 8],
  'circle-stroke-width': 1.2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.96,
};

export function PublicMapView({
  presence,
  provinceCode,
  flyTo,
  initialCamera,
  onViewportChange,
  className,
}: PublicMapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const viewportUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFitVietnamRef = useRef(Boolean(initialCamera));
  const lastFlySeqRef = useRef(0);
  const [viewport, setViewport] = useState<PublicMapViewportParams | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [popupFeature, setPopupFeature] = useState<PinFeature | null>(null);

  const queryParams: PublicMapViewportParams | null = viewport
    ? { ...viewport, presence, provinceCode: provinceCode ?? undefined }
    : null;

  const { data, isFetching, isError } = usePublicMapReports(queryParams);

  const applyViewportFromMap = useCallback(
    (ref: MapRef | null) => {
      const map = ref?.getMap();
      if (!map) return;
      const bounds = map.getBounds();
      if (!bounds) return;
      const zoom = map.getZoom();
      const next: PublicMapViewportParams = {
        minLat: Number(bounds.getSouth().toFixed(6)),
        maxLat: Number(bounds.getNorth().toFixed(6)),
        minLng: Number(bounds.getWest().toFixed(6)),
        maxLng: Number(bounds.getEast().toFixed(6)),
        zoom: Number(zoom.toFixed(2)),
        mode: publicMapModeForZoom(zoom),
        presence,
        provinceCode: provinceCode ?? undefined,
      };
      setViewport(next);
      onViewportChange?.(next);
    },
    [onViewportChange, presence, provinceCode]
  );

  const scheduleViewportUpdateFromMap = useCallback(
    (ref: MapRef | null) => {
      if (viewportUpdateTimeoutRef.current) clearTimeout(viewportUpdateTimeoutRef.current);
      viewportUpdateTimeoutRef.current = setTimeout(() => {
        viewportUpdateTimeoutRef.current = null;
        applyViewportFromMap(ref);
      }, VIEWPORT_UPDATE_DEBOUNCE_MS);
    },
    [applyViewportFromMap]
  );

  useEffect(() => {
    return () => {
      if (viewportUpdateTimeoutRef.current) clearTimeout(viewportUpdateTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    applyViewportFromMap(mapRef.current);
  }, [applyViewportFromMap]);

  const pinGeojson = useMemo<FeatureCollection<Point, PinProperties>>(() => {
    const items = data?.data?.items ?? [];
    return {
      type: 'FeatureCollection',
      features: items
        .filter(item => Number.isFinite(item.longitude) && Number.isFinite(item.latitude))
        .map(item => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [item.longitude, item.latitude] },
          properties: {
            id: item.id,
            code: item.code,
            title: item.title,
            address: item.address,
            status: publicMapGuestStatusLabelVi(item.status),
            imageUrl: item.imageUrl,
            afterImageUrl: item.afterImageUrl,
            categoryIconUrl: item.categoryIconUrl,
            reporterCount: item.reporterCount,
            isCleaned: isPublicMapCleanedStatus(item.status) ? 1 : 0,
          },
        })),
    };
  }, [data?.data?.items]);

  const clusterGeojson = useMemo<FeatureCollection<Point, ClusterProperties>>(() => {
    const cells = data?.data?.cells ?? [];
    return {
      type: 'FeatureCollection',
      features: cells
        .filter(
          cell => Number.isFinite(cell.centerLongitude) && Number.isFinite(cell.centerLatitude)
        )
        .map(cell => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [cell.centerLongitude, cell.centerLatitude],
          },
          properties: {
            count: cell.count,
            cleanedCount: cell.cleanedCount,
          },
        })),
    };
  }, [data?.data?.cells]);

  const showClusters = (data?.data?.mode ?? queryParams?.mode) === 'aggregate';
  const hasPins = pinGeojson.features.length > 0;
  const hasClusters = clusterGeojson.features.length > 0;
  const showEmptyHint = Boolean(queryParams) && !isFetching && !isError && !hasPins && !hasClusters;

  const handleMoveEnd = useCallback(
    (_event: ViewStateChangeEvent) => {
      scheduleViewportUpdateFromMap(mapRef.current);
    },
    [scheduleViewportUpdateFromMap]
  );

  const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature) {
      setPopupFeature(null);
      return;
    }

    if (feature.layer?.id === CLUSTER_LAYER_ID) {
      setPopupFeature(null);
      const map = mapRef.current?.getMap();
      if (!map) return;
      const nextZoom = Math.min(map.getZoom() + 2, PUBLIC_MAP_MAX_ZOOM);
      map.easeTo({
        center: [event.lngLat.lng, event.lngLat.lat],
        zoom: nextZoom,
        duration: 400,
      });
      return;
    }

    const raw = feature.properties ?? {};
    setPopupFeature({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [event.lngLat.lng, event.lngLat.lat] },
      properties: {
        id: String(raw.id ?? ''),
        code: String(raw.code ?? ''),
        title: String(raw.title ?? ''),
        address: raw.address ? String(raw.address) : null,
        status: String(raw.status ?? ''),
        imageUrl: raw.imageUrl ? String(raw.imageUrl) : null,
        afterImageUrl: raw.afterImageUrl ? String(raw.afterImageUrl) : null,
        categoryIconUrl: raw.categoryIconUrl ? String(raw.categoryIconUrl) : null,
        reporterCount:
          raw.reporterCount == null || raw.reporterCount === ''
            ? undefined
            : Number(raw.reporterCount),
        isCleaned: Number(raw.isCleaned) === 1 ? 1 : 0,
      },
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (canvas) canvas.style.cursor = 'pointer';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const canvas = mapRef.current?.getMap()?.getCanvas();
    if (canvas) canvas.style.cursor = '';
  }, []);

  useEffect(() => {
    if (!flyTo || flyTo.seq === lastFlySeqRef.current) return;
    lastFlySeqRef.current = flyTo.seq;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({
      center: [flyTo.longitude, flyTo.latitude],
      zoom: flyTo.zoom,
      duration: 800,
      essential: true,
    });
  }, [flyTo]);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    applyViewportFromMap(mapRef.current);

    if (!hasFitVietnamRef.current) {
      hasFitVietnamRef.current = true;
      map.fitBounds(VIETNAM_MAP_MAX_BOUNDS, {
        padding: 48,
        pitch: 0,
        duration: 0,
      });
    }

    map.once('idle', () => setIsReady(true));
  }, [applyViewportFromMap]);

  return (
    <div
      className={cn('relative h-full w-full', className)}
      role="application"
      aria-label="Bản đồ công khai báo cáo ô nhiễm Việt Nam"
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: initialCamera?.longitude ?? VN_CENTER.longitude,
          latitude: initialCamera?.latitude ?? VN_CENTER.latitude,
          zoom: initialCamera?.zoom ?? PUBLIC_MAP_MIN_ZOOM,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle={getMapStyle()}
        minZoom={PUBLIC_MAP_MIN_ZOOM}
        maxZoom={PUBLIC_MAP_MAX_ZOOM}
        maxBounds={VIETNAM_MAP_MAX_BOUNDS}
        dragRotate={false}
        pitchWithRotate={false}
        attributionControl={false}
        interactiveLayerIds={[CLUSTER_LAYER_ID, PIN_LAYER_ID]}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onError={event => {
          const err = event.error as (Error & { url?: string; sourceId?: string }) | undefined;
          if (isAbortError(err) || isAbortError(err?.message)) return;
          console.error('[PublicMapView] Map error:', {
            message: err?.message,
            url: err?.url,
            sourceId: err?.sourceId,
          });
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        <AttributionControl position="bottom-left" compact />

        <Source
          id={CLUSTER_SOURCE_ID}
          type="geojson"
          data={showClusters ? clusterGeojson : EMPTY_POINTS}
        >
          <Layer
            id={CLUSTER_LAYER_ID}
            type="circle"
            paint={clusterPaint(presence)}
            layout={{ visibility: showClusters ? 'visible' : 'none' }}
          />
        </Source>

        <Source id={PIN_SOURCE_ID} type="geojson" data={showClusters ? EMPTY_POINTS : pinGeojson}>
          <Layer
            id={PIN_LAYER_ID}
            type="circle"
            paint={PIN_LAYER_PAINT}
            layout={{ visibility: showClusters ? 'none' : 'visible' }}
          />
        </Source>

        {popupFeature ? (
          <Popup
            longitude={popupFeature.geometry.coordinates[0]}
            latitude={popupFeature.geometry.coordinates[1]}
            closeOnClick={false}
            onClose={() => setPopupFeature(null)}
            closeButton
            maxWidth="240px"
            className="map-report-popup"
          >
            <MapReportPopupCard report={popupFeature.properties} />
          </Popup>
        ) : null}
      </Map>

      <MapLoadingSkeleton ready={isReady} />

      {isError ? (
        <p className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
          Không tải được dữ liệu bản đồ. Bản đồ nền vẫn xem được.
        </p>
      ) : null}
      {showEmptyHint ? (
        <p className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-sm ring-1 ring-border">
          Chưa có báo cáo công khai trong khu vực này.
        </p>
      ) : null}
    </div>
  );
}
