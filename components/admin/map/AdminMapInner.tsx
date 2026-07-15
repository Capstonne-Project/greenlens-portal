'use client';

import { AdminMapReportPopup } from '@/components/admin/map/AdminMapReportPopup';
import { AdminMapSummaryPanel } from '@/components/admin/map/AdminMapSummaryPanel';
import { useMapReports, useMapSummary, type MapViewportParams } from '@/hooks/useMap';
import type { MapReportDetailItem } from '@/lib/api/services/fetchMap';
import { MAP_VIEWPORT_PIN_LIMIT } from '@/lib/constants/mapReports';
import { clampMapViewportToVietnam } from '@/lib/constants/vietnamMapBounds';
import { cn } from '@/lib/utils';
import type { FeatureCollection, Point } from 'geojson';
import type { CircleLayerSpecification, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useMemo, useRef, useState } from 'react';
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
const DEFAULT_ZOOM = 11;

const SOURCE_ID = 'admin-map-reports';
const REPORT_POINTS_LAYER_ID = 'admin-report-points';

type ReportFeatureProperties = {
  id: string;
};

const REPORT_POINTS_LAYER: CircleLayerSpecification = {
  id: REPORT_POINTS_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  paint: {
    'circle-color': '#059669',
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 6],
    'circle-stroke-width': 1.2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.95,
  },
};

function readViewport(mapRef: MapRef | null): MapViewportParams | null {
  const map = mapRef?.getMap();
  if (!map) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;
  const clamped = clampMapViewportToVietnam({
    minLat: Number(bounds.getSouth().toFixed(6)),
    maxLat: Number(bounds.getNorth().toFixed(6)),
    minLng: Number(bounds.getWest().toFixed(6)),
    maxLng: Number(bounds.getEast().toFixed(6)),
  });
  return {
    ...clamped,
    mode: 'detail',
    /** BR-MAP-002 — tối đa 100 điểm / viewport */
    limit: MAP_VIEWPORT_PIN_LIMIT,
  };
}

export function AdminMapInner() {
  const mapRef = useRef<MapRef | null>(null);
  const [viewport, setViewport] = useState<MapViewportParams | null>(null);
  const [days, setDays] = useState(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reportsQuery = useMapReports(viewport);
  const summaryQuery = useMapSummary(
    viewport
      ? {
          ...viewport,
          days,
        }
      : null
  );

  const items = reportsQuery.data?.data?.items ?? [];

  const itemsById = useMemo(() => {
    const lookup = new globalThis.Map<string, MapReportDetailItem>();
    for (const item of items) {
      lookup.set(item.id, item);
    }
    return lookup;
  }, [items]);

  /** Derive popup from current items — clears itself when pin leaves viewport. */
  const selected = selectedId ? (itemsById.get(selectedId) ?? null) : null;

  const geojson = useMemo<FeatureCollection<Point, ReportFeatureProperties>>(() => {
    return {
      type: 'FeatureCollection',
      features: items
        .filter(item => Number.isFinite(item.longitude) && Number.isFinite(item.latitude))
        .map(item => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [item.longitude, item.latitude] as [number, number],
          },
          properties: { id: item.id },
        })),
    };
  }, [items]);

  const updateViewportFromMap = useCallback(() => {
    const next = readViewport(mapRef.current);
    if (next) setViewport(next);
  }, []);

  const handleMapLoad = useCallback(() => {
    updateViewportFromMap();
  }, [updateViewportFromMap]);

  const handleMoveEnd = useCallback(
    (_event: ViewStateChangeEvent) => {
      updateViewportFromMap();
    },
    [updateViewportFromMap]
  );

  const handleMapClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const id = feature?.properties?.id as string | undefined;
    setSelectedId(id ?? null);
  }, []);

  const isReportsLoading = reportsQuery.isFetching && !reportsQuery.data;

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[560px] w-full min-w-0 flex-col gap-4">
      <div className="shrink-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Bản đồ công khai
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Báo cáo Verified trở lên · theo dõi viewport quản trị
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div
          className={cn(
            'relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border bg-muted shadow-sm',
            isReportsLoading && 'ring-1 ring-emerald-500/20'
          )}
          role="application"
          aria-label="Bản đồ quản trị — báo cáo công khai"
        >
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: DEFAULT_CENTER[0],
              latitude: DEFAULT_CENTER[1],
              zoom: DEFAULT_ZOOM,
            }}
            mapStyle={OSM_LIGHT_STYLE}
            attributionControl={false}
            interactiveLayerIds={[REPORT_POINTS_LAYER_ID]}
            style={{ width: '100%', height: '100%' }}
            onLoad={handleMapLoad}
            onMoveEnd={handleMoveEnd}
            onClick={handleMapClick}
            onError={event => console.error('[AdminMapInner] Map error:', event.error)}
          >
            <NavigationControl position="top-left" showCompass={false} />
            <AttributionControl position="bottom-right" compact />

            <Source id={SOURCE_ID} type="geojson" data={geojson}>
              <Layer {...REPORT_POINTS_LAYER} />
            </Source>

            {selected ? (
              <Popup
                longitude={selected.longitude}
                latitude={selected.latitude}
                closeOnClick={false}
                onClose={() => setSelectedId(null)}
                closeButton
                maxWidth="280px"
                className="admin-map-report-popup"
                offset={12}
              >
                <AdminMapReportPopup report={selected} />
              </Popup>
            ) : null}
          </Map>

          {reportsQuery.isFetching ? (
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-border bg-card/95 px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-sm backdrop-blur">
              Đang cập nhật ghim…
            </div>
          ) : null}

          {reportsQuery.isError ? (
            <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-destructive/30 bg-card/95 px-3 py-2 text-xs text-destructive shadow-sm">
              Không tải được ghim. Di chuyển bản đồ để thử lại.
            </div>
          ) : null}
        </div>

        <AdminMapSummaryPanel
          summary={summaryQuery.data?.data}
          isLoading={summaryQuery.isFetching}
          isError={summaryQuery.isError}
          days={days}
          onDaysChange={setDays}
          pinCount={items.length}
        />
      </div>
    </div>
  );
}
