'use client';

import type {
  AdminGeographicData,
  AdminGeographicHeatmapPoint,
  AdminGeographicMarker,
} from '@/lib/api/services/fetchAdminDashboard';
import {
  normalizeReportStatus,
  REPORT_STATUS_CHART_COLORS,
  reportStatusLabelVi,
  type ReportStatus,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from 'geojson';
import { LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, {
  AttributionControl,
  Layer,
  NavigationControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import { getMapStyle } from '@/lib/map/mapStyle';

type MapSourceErrorEvent = {
  sourceId?: string;
  error?: Error | { message?: string } | string;
  message?: string;
};

/** Vietnam overview — not HCM street zoom */
const VIETNAM_CENTER: [number, number] = [106.3, 16.0];
const VIETNAM_ZOOM = 4.6;

const VIETNAM_BOUNDS: [[number, number], [number, number]] = [
  [102.14, 8.18],
  [109.47, 23.4],
];

/** Post-2025 Vietnam provinces (34) — Free GIS Data / open GIS dataset */
const PROVINCES_GEOJSON_URL =
  'https://raw.githubusercontent.com/nguyenduy1133/Free-GIS-Data/main/Vietnam%20Administrative%20Divisions%20(Post-2025)%20-%20%C4%90%C6%A1n%20v%E1%BB%8B%20h%C3%A0nh%20ch%C3%ADnh%20Vi%E1%BB%87t%20Nam%20(T%E1%BB%AB%202025)/Provinces.geojson';

const MARKERS_SOURCE_ID = 'admin-dashboard-markers';
const PROVINCES_SOURCE_ID = 'admin-dashboard-provinces';
const MARKERS_LAYER_ID = 'admin-dashboard-markers-layer';
const PROVINCES_FILL_LAYER_ID = 'admin-dashboard-provinces-fill';
const PROVINCES_OUTLINE_LAYER_ID = 'admin-dashboard-provinces-outline';

const NONE_PROVINCE = '__none__';

/** Density fill: empty → green → yellow → orange → red */
const DENSITY_ZONES: { label: string; color: string; min: number }[] = [
  { label: 'Không có', color: '#e2e8f0', min: 0 },
  { label: 'Thấp', color: '#22c55e', min: 1 },
  { label: 'Trung bình', color: '#facc15', min: 3 },
  { label: 'Cao', color: '#f97316', min: 8 },
  { label: 'Rất cao', color: '#dc2626', min: 20 },
];

type MarkerFeatureProps = { reportId: string; status: string; color: string };
type ProvinceProps = { TinhThanh?: string; reportCount?: number; fillColor?: string };
type BoundaryStatus = 'pending' | 'ready' | 'error';

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function markerColor(status: string): string {
  const normalized = normalizeReportStatus(status);
  return REPORT_STATUS_CHART_COLORS[normalized] ?? '#64748b';
}

function densityColor(count: number): string {
  let color = DENSITY_ZONES[0].color;
  for (const zone of DENSITY_ZONES) {
    if (count >= zone.min) color = zone.color;
  }
  return color;
}

function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0];
    const yi = ring[i]?.[1];
    const xj = ring[j]?.[0];
    const yj = ring[j]?.[1];
    if (
      typeof xi !== 'number' ||
      typeof yi !== 'number' ||
      typeof xj !== 'number' ||
      typeof yj !== 'number'
    ) {
      continue;
    }
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, geometry: Polygon): boolean {
  const [outer, ...holes] = geometry.coordinates;
  if (!outer || !pointInRing(lng, lat, outer)) return false;
  for (const hole of holes) {
    if (pointInRing(lng, lat, hole)) return false;
  }
  return true;
}

function pointInGeometry(lng: number, lat: number, geometry: Geometry): boolean {
  if (geometry.type === 'Polygon') return pointInPolygon(lng, lat, geometry);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(coords =>
      pointInPolygon(lng, lat, { type: 'Polygon', coordinates: coords })
    );
  }
  return false;
}

function extendBoundsWithPosition(bounds: LngLatBounds, position: Position): void {
  const lng = position[0];
  const lat = position[1];
  if (typeof lng !== 'number' || typeof lat !== 'number') return;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
  bounds.extend([lng, lat]);
}

function boundsFromPolygon(geometry: Polygon): LngLatBounds | null {
  const rings = geometry.coordinates;
  const firstRing = rings[0];
  const firstPos = firstRing?.[0];
  if (!firstPos) return null;

  const lng = firstPos[0];
  const lat = firstPos[1];
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const bounds = new LngLatBounds([lng, lat], [lng, lat]);
  for (const ring of rings) {
    for (const position of ring) {
      extendBoundsWithPosition(bounds, position);
    }
  }
  return bounds;
}

function boundsFromMultiPolygon(geometry: MultiPolygon): LngLatBounds | null {
  let bounds: LngLatBounds | null = null;

  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      for (const position of ring) {
        const lng = position[0];
        const lat = position[1];
        if (typeof lng !== 'number' || typeof lat !== 'number') continue;
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;

        if (!bounds) {
          bounds = new LngLatBounds([lng, lat], [lng, lat]);
        } else {
          bounds.extend([lng, lat]);
        }
      }
    }
  }

  return bounds;
}

function boundsFromProvinceGeometry(geometry: Geometry): LngLatBounds | null {
  if (geometry.type === 'Polygon') return boundsFromPolygon(geometry);
  if (geometry.type === 'MultiPolygon') return boundsFromMultiPolygon(geometry);
  return null;
}

function readProvinceName(properties: Record<string, unknown> | null): string | null {
  if (!properties) return null;
  const name = properties.TinhThanh;
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
}

function errorMessageFromMapEvent(e: MapSourceErrorEvent): string {
  const raw = e.error;
  if (raw instanceof Error) return raw.message;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && typeof raw.message === 'string') return raw.message;
  if (typeof e.message === 'string') return e.message;
  return '';
}

function collectWeightedPoints(
  heatmap: AdminGeographicHeatmapPoint[],
  markers: AdminGeographicMarker[]
): { lng: number; lat: number; weight: number }[] {
  const points: { lng: number; lat: number; weight: number }[] = [];
  for (const p of heatmap) {
    if (!isValidCoord(p.latitude, p.longitude)) continue;
    points.push({
      lng: p.longitude,
      lat: p.latitude,
      weight: Number.isFinite(p.weight) ? Math.max(0, p.weight) : 1,
    });
  }
  for (const m of markers) {
    if (!isValidCoord(m.latitude, m.longitude)) continue;
    points.push({ lng: m.longitude, lat: m.latitude, weight: 1 });
  }
  return points;
}

function enrichProvincesWithDensity(
  provinces: FeatureCollection,
  points: { lng: number; lat: number; weight: number }[]
): FeatureCollection {
  const features = provinces.features.map((feature: Feature) => {
    const name = readProvinceName(
      feature.properties && typeof feature.properties === 'object'
        ? (feature.properties as Record<string, unknown>)
        : null
    );
    let reportCount = 0;
    if (feature.geometry) {
      for (const point of points) {
        if (pointInGeometry(point.lng, point.lat, feature.geometry)) {
          reportCount += point.weight;
        }
      }
    }
    const fillColor = densityColor(reportCount);
    return {
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        TinhThanh: name ?? '',
        reportCount,
        fillColor,
      } satisfies ProvinceProps,
    };
  });

  return { type: 'FeatureCollection', features };
}

interface AdminDashboardGeographicMapProps {
  geographic: AdminGeographicData | undefined;
  className?: string;
  /** Fill parent height instead of fixed 240px (embedded / fullscreen). */
  fillHeight?: boolean;
  /** Fullscreen overlay mode — parent should be fixed inset-0. */
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function AdminDashboardGeographicMap({
  geographic,
  className,
  fillHeight = false,
  expanded = false,
  onToggleExpand,
}: AdminDashboardGeographicMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<BoundaryStatus>('pending');
  const [rawProvinces, setRawProvinces] = useState<FeatureCollection | null>(null);

  const heatmapPoints = useMemo(
    () => (geographic?.heatmap ?? []).filter(p => isValidCoord(p.latitude, p.longitude)),
    [geographic?.heatmap]
  );

  const markers = useMemo(
    () => (geographic?.markers ?? []).filter(m => isValidCoord(m.latitude, m.longitude)),
    [geographic?.markers]
  );

  const hasPoints = heatmapPoints.length > 0 || markers.length > 0;

  useEffect(() => {
    let cancelled = false;

    fetch(PROVINCES_GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FeatureCollection>;
      })
      .then(data => {
        if (cancelled) return;
        if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('Invalid GeoJSON');
        }
        setRawProvinces(data);
        setBoundaryStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setRawProvinces(null);
        setBoundaryStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const provincesGeojson = useMemo(() => {
    if (!rawProvinces) return null;
    const points = collectWeightedPoints(heatmapPoints, markers);
    return enrichProvincesWithDensity(rawProvinces, points);
  }, [rawProvinces, heatmapPoints, markers]);

  const markersGeojson = useMemo<FeatureCollection<Point, MarkerFeatureProps>>(
    () => ({
      type: 'FeatureCollection',
      features: markers.map((marker: AdminGeographicMarker) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [marker.longitude, marker.latitude] as [number, number],
        },
        properties: {
          reportId: marker.reportId,
          status: marker.status,
          color: markerColor(marker.status),
        },
      })),
    }),
    [markers]
  );

  const statusLegend = useMemo(() => {
    const seen = new Set<ReportStatus>();
    for (const m of markers) {
      seen.add(normalizeReportStatus(m.status));
    }
    return Array.from(seen).slice(0, 6);
  }, [markers]);

  const selectedKey = selectedProvince ?? NONE_PROVINCE;

  const fitNationwide = useCallback(
    (duration = 0) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      // Tight fit so the tall S-shape of Vietnam fills a portrait panel with minimal empty space
      map.fitBounds(VIETNAM_BOUNDS, {
        padding: expanded
          ? { top: 40, bottom: 56, left: 40, right: 40 }
          : { top: 8, bottom: 12, left: 8, right: 8 },
        maxZoom: expanded ? 6.4 : 6,
        duration,
      });
    },
    [expanded]
  );

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.on('error', (e: MapSourceErrorEvent) => {
        const message = errorMessageFromMapEvent(e);
        if (
          e.sourceId === PROVINCES_SOURCE_ID ||
          message.includes('Provinces.geojson') ||
          message.includes('Free-GIS-Data')
        ) {
          setBoundaryStatus('error');
        }
      });
    }
    fitNationwide(0);
  }, [fitNationwide]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const id = window.setTimeout(() => {
      map.resize();
      if (!selectedProvince) {
        fitNationwide(0);
      }
    }, 80);
    return () => window.clearTimeout(id);
  }, [expanded, fillHeight, fitNationwide, selectedProvince]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleExpand?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded, onToggleExpand]);

  const handleProvinceClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.layer?.id !== PROVINCES_FILL_LAYER_ID) return;

    const rawProps = feature.properties;
    const name = readProvinceName(
      rawProps && typeof rawProps === 'object' ? (rawProps as Record<string, unknown>) : null
    );
    if (!name) return;

    const bounds = boundsFromProvinceGeometry(feature.geometry);
    if (!bounds) return;

    setSelectedProvince(name);
    const map = mapRef.current?.getMap();
    map?.fitBounds(bounds, { padding: 56, maxZoom: 9, duration: 500 });
  }, []);

  const handleProvinceEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = 'pointer';
  }, []);

  const handleProvinceLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = '';
  }, []);

  const handleResetNationwide = useCallback(() => {
    setSelectedProvince(null);
    fitNationwide(500);
  }, [fitNationwide]);

  return (
    <div
      className={cn(
        fillHeight || expanded ? 'flex h-full min-h-0 flex-col' : 'space-y-1.5',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-border bg-muted',
          fillHeight || expanded ? 'min-h-0 flex-1' : 'h-[280px]'
        )}
        role="application"
        aria-label="Bản đồ tỉnh thành Việt Nam tô màu theo mật độ báo cáo"
      >
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: VIETNAM_CENTER[0],
            latitude: VIETNAM_CENTER[1],
            zoom: VIETNAM_ZOOM,
          }}
          mapStyle={getMapStyle()}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={provincesGeojson ? [PROVINCES_FILL_LAYER_ID] : []}
          onLoad={handleLoad}
          onClick={handleProvinceClick}
          onMouseEnter={handleProvinceEnter}
          onMouseLeave={handleProvinceLeave}
        >
          <NavigationControl position="top-left" showCompass={false} />
          <AttributionControl position="bottom-right" compact />

          {provincesGeojson ? (
            <Source id={PROVINCES_SOURCE_ID} type="geojson" data={provincesGeojson}>
              <Layer
                id={PROVINCES_FILL_LAYER_ID}
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['==', ['get', 'TinhThanh'], selectedKey],
                    '#34d399',
                    ['coalesce', ['get', 'fillColor'], '#e2e8f0'],
                  ],
                  'fill-opacity': ['case', ['==', ['get', 'TinhThanh'], selectedKey], 0.85, 0.72],
                }}
              />
              <Layer
                id={PROVINCES_OUTLINE_LAYER_ID}
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['==', ['get', 'TinhThanh'], selectedKey],
                    '#047857',
                    '#334155',
                  ],
                  'line-width': ['case', ['==', ['get', 'TinhThanh'], selectedKey], 2.5, 1],
                  'line-opacity': 0.9,
                }}
              />
            </Source>
          ) : null}

          <Source id={MARKERS_SOURCE_ID} type="geojson" data={markersGeojson}>
            <Layer
              id={MARKERS_LAYER_ID}
              type="circle"
              paint={{
                'circle-color': ['get', 'color'],
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 6, 14, 8],
                'circle-stroke-width': 1.2,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 0.95,
              }}
            />
          </Source>
        </Map>

        <div className="absolute top-2 right-2 z-10 flex max-w-[min(100%,300px)] flex-col items-end gap-1.5">
          {onToggleExpand ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
              className="h-auto gap-1.5 rounded-md border-border bg-card/95 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur"
              aria-label={expanded ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ toàn màn hình'}
            >
              {expanded ? (
                <>
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Quay lại
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" aria-hidden />
                  Phóng to
                </>
              )}
            </Button>
          ) : null}
          {selectedProvince ? (
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-card/95 px-2 py-1 text-xs shadow-sm backdrop-blur">
              <span className="truncate text-foreground" title={selectedProvince}>
                Đang xem: <span className="font-medium">{selectedProvince}</span>
              </span>
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetNationwide}
            className="h-auto rounded-md border-border bg-card/95 px-2 py-1 text-xs font-semibold shadow-sm backdrop-blur"
          >
            Toàn quốc
          </Button>
        </div>

        {boundaryStatus === 'pending' ? (
          <div
            className="pointer-events-none absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-md border border-border bg-card/95 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur"
            role="status"
          >
            Đang tải bản đồ tỉnh/thành Việt Nam…
          </div>
        ) : null}

        {boundaryStatus === 'error' ? (
          <div
            className="pointer-events-none absolute top-2 left-1/2 z-10 max-w-[min(100%-1rem,340px)] -translate-x-1/2 rounded-md border border-destructive/30 bg-card/95 px-2.5 py-1.5 text-center text-xs text-destructive shadow-sm backdrop-blur"
            role="status"
          >
            Không tải được ranh giới tỉnh — vẫn hiển thị điểm báo cáo nếu có
          </div>
        ) : null}

        {!hasPoints && boundaryStatus === 'ready' ? (
          <div
            className="pointer-events-none absolute top-12 left-1/2 z-10 max-w-[min(100%-1rem,320px)] -translate-x-1/2 rounded-md border border-border bg-card/95 px-2.5 py-1.5 text-center text-xs text-muted-foreground shadow-sm backdrop-blur"
            role="status"
          >
            Chưa có điểm báo cáo — tỉnh đang tô xám nhạt
          </div>
        ) : null}

        <div className="pointer-events-none absolute right-2 bottom-8 z-10 rounded-md border border-border bg-card/95 px-2 py-1.5 text-xs shadow-sm backdrop-blur">
          <p className="mb-1.5 font-semibold text-foreground">Mật độ theo tỉnh</p>
          <ul className="space-y-1 text-muted-foreground">
            {DENSITY_ZONES.map(zone => (
              <li key={zone.label} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-sm border border-black/10"
                  style={{ backgroundColor: zone.color }}
                  aria-hidden
                />
                {zone.label}
              </li>
            ))}
          </ul>
        </div>

        {statusLegend.length > 0 ? (
          <div className="pointer-events-none absolute bottom-8 left-2 z-10 max-w-[min(100%,220px)] rounded-md border border-border bg-card/95 px-2 py-1.5 text-xs shadow-sm backdrop-blur">
            <p className="mb-1 font-semibold text-foreground">Trạng thái điểm báo cáo</p>
            <ul className="flex flex-wrap gap-x-2 gap-y-1">
              {statusLegend.map(status => (
                <li key={status} className="inline-flex items-center gap-1 text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: REPORT_STATUS_CHART_COLORS[status] }}
                    aria-hidden
                  />
                  {reportStatusLabelVi(status)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {!expanded ? (
        <p className="mt-1.5 shrink-0 text-xs leading-snug text-muted-foreground">
          Bản đồ toàn quốc 34 tỉnh/thành (post-2025): Free GIS Data — tô màu theo số báo cáo trong
          tỉnh. Click tỉnh để focus · Toàn quốc để thu phóng lại. Bản đồ nền © OpenStreetMap.
        </p>
      ) : null}
    </div>
  );
}
