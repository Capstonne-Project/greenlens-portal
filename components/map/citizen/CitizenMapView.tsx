'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, Geometry, Point, Polygon } from 'geojson';
import { LngLatBounds, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Map, {
  AttributionControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre';
import {
  useCitizenMapProvinces,
  useCitizenMapWardReports,
  useCitizenMapWards,
} from '@/hooks/useCitizenMap';
import { applyBuilding3dMinZoom, getMapStyle } from '@/lib/map/mapStyle';
import { borderColorForProvinceCode, colorForProvinceCode } from '@/lib/map/provinceColors';
import type { CitizenMapWard, CitizenMapWardReportPin } from '@/lib/api/models/citizenMap';
import { APP_LOGO_MARK_SRC, APP_NAME } from '@/lib/constants/brand';
import { cn } from '@/lib/utils';
import { MapLoadingSkeleton } from '@/components/map/MapLoadingSkeleton';
import { CitizenReportPreviewCard } from './CitizenReportPreviewCard';
import { CitizenReportDetailDialog } from './CitizenReportDetailDialog';

/** Default center Việt Nam (toàn quốc) — BR-MAP-001 dùng cho fallback khi geometry rỗng. */
const DEFAULT_CENTER: [number, number] = [106.6297, 16.0];
const DEFAULT_ZOOM = 5;
const MIN_ZOOM = 3.2;
/** Vùng nhìn khởi đầu toàn quốc — chỉ dùng cho `fitBounds` lúc "Toàn quốc", KHÔNG khoá pan/zoom. */
const VIETNAM_BOUNDS: [[number, number], [number, number]] = [
  [100, 6],
  [112, 24],
];

const PROVINCE_SOURCE_ID = 'citizen-provinces';
const PROVINCE_FILL_LAYER_ID = 'citizen-provinces-fill';
const PROVINCE_LINE_LAYER_ID = 'citizen-provinces-line';
const PROVINCE_LABEL_LAYER_ID = 'citizen-provinces-label';

const WARD_SOURCE_ID = 'citizen-wards';
const WARD_FILL_LAYER_ID = 'citizen-wards-fill';
const WARD_LINE_LAYER_ID = 'citizen-wards-line';
const WARD_LABEL_LAYER_ID = 'citizen-wards-label';

const WARD_MASK_SOURCE_ID = 'citizen-ward-mask';
const WARD_MASK_LAYER_ID = 'citizen-ward-mask-fill';

const REPORT_SOURCE_ID = 'citizen-ward-reports';
const REPORT_LAYER_ID = 'citizen-ward-reports-points';

const WORLD_RING: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

const EMPTY_FC: FeatureCollection = { type: 'FeatureCollection', features: [] };

const SEVERITY_POINT_COLOR: Record<CitizenMapWardReportPin['severity'], string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#dc2626',
};

function boundsFromGeometry(geometry: Geometry): LngLatBounds | null {
  let bounds: LngLatBounds | null = null;
  const extend = (lng: unknown, lat: unknown) => {
    if (typeof lng !== 'number' || typeof lat !== 'number') return;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    if (!bounds) bounds = new LngLatBounds([lng, lat], [lng, lat]);
    else bounds.extend([lng, lat]);
  };
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) for (const [lng, lat] of ring) extend(lng, lat);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates)
      for (const ring of polygon) for (const [lng, lat] of ring) extend(lng, lat);
  }
  return bounds;
}

/** "Inverse mask": world ring ngoài, holes = ranh giới ward — che trắng mọi thứ ngoài ward đã chọn. */
function buildInverseMask(geometry: Geometry | null | undefined): Feature<Polygon> {
  const holes: number[][][] = [];
  if (geometry?.type === 'Polygon') holes.push(...geometry.coordinates);
  else if (geometry?.type === 'MultiPolygon')
    for (const polygon of geometry.coordinates) holes.push(...polygon);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] },
  };
}

type ReportPinProperties = { pinId: string; severity: CitizenMapWardReportPin['severity'] };

interface CitizenMapViewProps {
  className?: string;
}

export function CitizenMapView({ className }: CitizenMapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapStyle] = useState<StyleSpecification | string>(getMapStyle);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<string | null>(null);
  const [popupPin, setPopupPin] = useState<CitizenMapWardReportPin | null>(null);
  const [detailPin, setDetailPin] = useState<CitizenMapWardReportPin | null>(null);

  const { data: provinces, isLoading: isLoadingProvinces } = useCitizenMapProvinces();
  const { data: wards, isLoading: isLoadingWards } = useCitizenMapWards(selectedProvinceCode);
  const { data: wardReports, isLoading: isLoadingWardReports } =
    useCitizenMapWardReports(selectedWardCode);

  const selectedWard = useMemo<CitizenMapWard | null>(() => {
    if (!wards || !selectedWardCode) return null;
    return wards.items.find(w => w.code === selectedWardCode) ?? null;
  }, [wards, selectedWardCode]);

  // ── Bước 1: province choropleth ─────────────────────────────────────────
  const provinceFeatureCollection = useMemo<FeatureCollection>(() => {
    if (!provinces) return EMPTY_FC;
    return {
      type: 'FeatureCollection',
      features: provinces
        .filter(p => p.geometry)
        .map(p => ({
          type: 'Feature' as const,
          properties: {
            code: p.code,
            name: p.name,
            fillColor: colorForProvinceCode(p.code),
            lineColor: borderColorForProvinceCode(p.code),
          },
          geometry: p.geometry as Geometry,
        })),
    };
  }, [provinces]);

  // ── Bước 2: ward drill-down (5-tier color từ BE) ────────────────────────
  const wardFeatureCollection = useMemo<FeatureCollection>(() => {
    if (!wards) return EMPTY_FC;
    return {
      type: 'FeatureCollection',
      features: wards.items
        .filter(w => w.geometry)
        .map(w => ({
          type: 'Feature' as const,
          properties: {
            code: w.code,
            name: w.name,
            level: w.level,
            colorHex: w.colorHex,
            activeReportCount: w.activeReportCount,
          },
          geometry: w.geometry as Geometry,
        })),
    };
  }, [wards]);

  const wardMaskFeature = useMemo(() => buildInverseMask(selectedWard?.geometry), [selectedWard]);

  // ── Bước 3: report pins trong ward đã chọn ──────────────────────────────
  const reportsById = useMemo(() => {
    const byId = new globalThis.Map<string, CitizenMapWardReportPin>();
    for (const item of wardReports?.items ?? []) byId.set(item.id, item);
    return byId;
  }, [wardReports]);

  const reportFeatureCollection = useMemo<FeatureCollection<Point, ReportPinProperties>>(() => {
    const items = wardReports?.items ?? [];
    return {
      type: 'FeatureCollection',
      features: items
        .filter(item => Number.isFinite(item.longitude) && Number.isFinite(item.latitude))
        .map(item => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [item.longitude, item.latitude] },
          properties: { pinId: item.id, severity: item.severity },
        })),
    };
  }, [wardReports]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) applyBuilding3dMinZoom(map);
    setIsMapLoaded(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => mapRef.current?.getMap()?.resize());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const flyToGeometry = useCallback((geometry: Geometry | null | undefined, padding = 24) => {
    if (!geometry) return;
    const bounds = boundsFromGeometry(geometry);
    const map = mapRef.current?.getMap();
    if (!bounds || !map) return;
    map.fitBounds(bounds, {
      padding,
      duration: 1400,
      essential: true,
      easing: t => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  const handleSelectProvince = useCallback(
    (code: string) => {
      setSelectedProvinceCode(code);
      setSelectedWardCode(null);
      setPopupPin(null);
      const province = provinces?.find(p => p.code === code);
      flyToGeometry(province?.geometry, 32);
    },
    [provinces, flyToGeometry]
  );

  const handleSelectWard = useCallback(
    (code: string) => {
      setSelectedWardCode(code);
      setPopupPin(null);
      const ward = wards?.items.find(w => w.code === code);
      flyToGeometry(ward?.geometry, 40);
    },
    [wards, flyToGeometry]
  );

  const handleBackToProvince = useCallback(() => {
    setSelectedWardCode(null);
    setPopupPin(null);
    const province = provinces?.find(p => p.code === selectedProvinceCode);
    flyToGeometry(province?.geometry, 32);
  }, [provinces, selectedProvinceCode, flyToGeometry]);

  const handleBackToNational = useCallback(() => {
    setSelectedProvinceCode(null);
    setSelectedWardCode(null);
    setPopupPin(null);
    const map = mapRef.current?.getMap();
    map?.fitBounds(VIETNAM_BOUNDS, {
      padding: 24,
      duration: 1400,
      essential: true,
      easing: t => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      if (!selectedWardCode) {
        // Bước 3 chưa active → click chọn tỉnh/phường thay vì report.
        if (selectedProvinceCode && feature.layer?.id === WARD_FILL_LAYER_ID) {
          const code = feature.properties?.code as string | undefined;
          if (code) handleSelectWard(code);
          return;
        }
        if (!selectedProvinceCode && feature.layer?.id === PROVINCE_FILL_LAYER_ID) {
          const code = feature.properties?.code as string | undefined;
          if (code) handleSelectProvince(code);
          return;
        }
        return;
      }

      if (feature.layer?.id === REPORT_LAYER_ID) {
        const pinId = feature.properties?.pinId as string | undefined;
        const pin = pinId ? reportsById.get(pinId) : null;
        if (pin) setPopupPin(pin);
      }
    },
    [selectedWardCode, selectedProvinceCode, handleSelectWard, handleSelectProvince, reportsById]
  );

  /**
   * Chỉ che skeleton toàn màn hình lúc load lần đầu (chưa có provinces) — khi đã có map rồi, các
   * lần fetch ward/report tiếp theo dùng badge loading nhỏ để người dùng thấy camera bay mượt
   * thay vì bị đóng băng sau overlay trắng rồi "giật" hiện luôn kết quả cuối.
   */
  const isInitialLoading = !isMapLoaded || isLoadingProvinces;
  const isDrillDownLoading =
    (Boolean(selectedProvinceCode) && !selectedWardCode && isLoadingWards) ||
    (Boolean(selectedWardCode) && isLoadingWardReports);

  const interactiveLayerIds = !selectedWardCode
    ? selectedProvinceCode
      ? [WARD_FILL_LAYER_ID]
      : [PROVINCE_FILL_LAYER_ID]
    : [REPORT_LAYER_ID];

  const popupPosition = popupPin
    ? ([popupPin.longitude, popupPin.latitude] as [number, number])
    : null;

  return (
    <div ref={containerRef} className={cn('relative h-full w-full', className)}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
        }}
        mapStyle={mapStyle}
        attributionControl={false}
        interactiveLayerIds={interactiveLayerIds}
        style={{ width: '100%', height: '100%' }}
        minZoom={MIN_ZOOM}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        onError={event => {
          const err = event.error as (Error & { url?: string; sourceId?: string }) | undefined;
          console.error('[CitizenMapView] Map error:', {
            message: err?.message,
            url: err?.url,
            sourceId: err?.sourceId,
          });
        }}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <AttributionControl position="bottom-right" compact />

        {/* Bước 1: toàn quốc — mỗi tỉnh 1 màu cố định, các nước khác xám (base style) */}
        {!selectedProvinceCode ? (
          <Source id={PROVINCE_SOURCE_ID} type="geojson" data={provinceFeatureCollection}>
            <Layer
              id={PROVINCE_FILL_LAYER_ID}
              type="fill"
              paint={{ 'fill-color': ['get', 'fillColor'], 'fill-opacity': 0.85 }}
            />
            <Layer
              id={PROVINCE_LINE_LAYER_ID}
              type="line"
              paint={{ 'line-color': ['get', 'lineColor'], 'line-width': 1.5 }}
            />
            <Layer
              id={PROVINCE_LABEL_LAYER_ID}
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 4, 9, 8, 13],
                'text-font': ['OpenSans Bold'],
                'text-allow-overlap': false,
              }}
              paint={{
                'text-color': '#1f2937',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.4,
              }}
            />
          </Source>
        ) : null}

        {/*
          Phủ trắng đục TOÀN màn hình (world ring, không phụ thuộc geometry tỉnh/ward) ngay khi đã
          chọn 1 tỉnh — đảm bảo nền luôn trắng sạch tuyệt đối bất kể style nền Goong (vệ tinh/địa
          hình xanh xám) hay geometry mask có khớp chính xác hay không. Ward/report layer vẽ đè
          lên sau nên vẫn hiện rõ trên nền trắng này.
        */}
        {selectedProvinceCode && !selectedWardCode ? (
          <Source
            id="citizen-fullscreen-mask"
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [WORLD_RING] },
            }}
          >
            <Layer
              id="citizen-fullscreen-mask-fill"
              type="fill"
              paint={{ 'fill-color': '#f8fafc', 'fill-opacity': 1 }}
            />
          </Source>
        ) : null}

        {/* Bước 2: phường/xã của tỉnh đã chọn — màu theo 5 cấp rủi ro (BE trả), nền trắng phía dưới. */}
        {selectedProvinceCode && !selectedWardCode ? (
          <Source id={WARD_SOURCE_ID} type="geojson" data={wardFeatureCollection}>
            <Layer
              id={WARD_FILL_LAYER_ID}
              type="fill"
              paint={{
                'fill-color': ['get', 'colorHex'],
                'fill-opacity': ['match', ['get', 'level'], 1, 0.18, 0.82],
              }}
            />
            <Layer
              id={WARD_LINE_LAYER_ID}
              type="line"
              paint={{ 'line-color': '#94a3b8', 'line-width': 1 }}
            />
            <Layer
              id={WARD_LABEL_LAYER_ID}
              type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9, 13, 13],
                'text-font': ['Roboto Medium'],
                'text-allow-overlap': false,
              }}
              paint={{
                'text-color': '#1e293b',
                'text-halo-color': '#ffffff',
                'text-halo-width': 1.6,
              }}
            />
          </Source>
        ) : null}

        {/* Bước 3: đã chọn đúng 1 phường — trong ward lộ mask nhạt hơn để thấy đường/tên đường thật. */}
        {selectedWardCode ? (
          <Source id={WARD_MASK_SOURCE_ID} type="geojson" data={wardMaskFeature}>
            <Layer
              id={WARD_MASK_LAYER_ID}
              type="fill"
              paint={{ 'fill-color': '#f8fafc', 'fill-opacity': 0.85 }}
            />
          </Source>
        ) : null}

        {selectedWardCode && selectedWard?.geometry ? (
          <Source
            id="citizen-selected-ward-outline"
            type="geojson"
            data={{ type: 'Feature', properties: {}, geometry: selectedWard.geometry }}
          >
            <Layer
              id="citizen-selected-ward-outline-line"
              type="line"
              paint={{ 'line-color': '#16a34a', 'line-width': 2.5 }}
            />
          </Source>
        ) : null}

        {/* Điểm rác thải trong phường đã chọn */}
        {selectedWardCode ? (
          <Source id={REPORT_SOURCE_ID} type="geojson" data={reportFeatureCollection}>
            <Layer
              id={REPORT_LAYER_ID}
              type="circle"
              paint={{
                'circle-color': [
                  'match',
                  ['get', 'severity'],
                  'Low',
                  SEVERITY_POINT_COLOR.Low,
                  'Medium',
                  SEVERITY_POINT_COLOR.Medium,
                  'High',
                  SEVERITY_POINT_COLOR.High,
                  'Critical',
                  SEVERITY_POINT_COLOR.Critical,
                  '#d92b2b',
                ],
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 5, 17, 9],
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#ffffff',
              }}
            />
          </Source>
        ) : null}

        {popupPin && popupPosition ? (
          <Popup
            longitude={popupPosition[0]}
            latitude={popupPosition[1]}
            closeOnClick={false}
            onClose={() => setPopupPin(null)}
            closeButton
            maxWidth="260px"
            className="citizen-map-report-popup"
          >
            <CitizenReportPreviewCard
              report={popupPin}
              onViewDetail={() => setDetailPin(popupPin)}
            />
          </Popup>
        ) : null}
      </Map>

      <MapLoadingSkeleton ready={!isInitialLoading} />

      {/* Logo GreenLens — cố định giữa đầu bản đồ ở mọi bước. */}
      <Link
        href="/"
        className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 py-1.5 pl-2 pr-4 shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-transform hover:scale-[1.02]"
      >
        <Image
          src={APP_LOGO_MARK_SRC}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full object-contain"
        />
        <span className="text-sm font-bold tracking-tight text-slate-900">{APP_NAME}</span>
      </Link>

      {/* Breadcrumb + nút thoát filter — dưới giữa bản đồ, chỉ hiện khi đã chọn tỉnh/phường. */}
      {selectedProvinceCode ? (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 py-1.5 pl-4 pr-1.5 text-xs font-medium text-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            <button
              type="button"
              onClick={handleBackToNational}
              className="text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
            >
              Toàn quốc
            </button>
            <span className="text-muted-foreground/60">/</span>
            {selectedWardCode ? (
              <>
                <button
                  type="button"
                  onClick={handleBackToProvince}
                  className="text-emerald-700 transition-colors hover:text-emerald-800 hover:underline"
                >
                  {wards?.provinceName ?? selectedProvinceCode}
                </button>
                <span className="text-muted-foreground/60">/</span>
                <span className="font-semibold text-foreground">
                  {selectedWard?.name ?? selectedWardCode}
                </span>
              </>
            ) : (
              <span className="font-semibold text-foreground">
                {wards?.provinceName ?? selectedProvinceCode}
              </span>
            )}
            {isDrillDownLoading ? (
              <span
                className="ml-0.5 size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-emerald-600 border-t-transparent"
                aria-hidden
              />
            ) : null}
          </nav>
          <button
            type="button"
            onClick={handleBackToNational}
            className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Bỏ chọn, xem toàn quốc"
            title="Bỏ chọn, xem toàn quốc"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* Bước 3: nút quay lại + chú giải mức độ severity của từng điểm báo cáo trong phường đang xem. */}
      {selectedWardCode ? (
        <div className="absolute bottom-6 left-4 z-10 flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleBackToProvince}
            className="flex items-center gap-2 rounded-full bg-white/95 py-2 pl-3.5 pr-4 text-xs font-semibold text-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <X className="size-3.5 text-muted-foreground" />
            Bỏ chọn phường, xem lại {wards?.provinceName ?? selectedProvinceCode}
          </button>

          <div className="rounded-lg bg-white/95 p-3 text-xs shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
            <p className="mb-1.5 font-semibold text-foreground">Mức độ báo cáo</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: SEVERITY_POINT_COLOR.Low }}
                />
                Thấp
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: SEVERITY_POINT_COLOR.Medium }}
                />
                Trung bình
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: SEVERITY_POINT_COLOR.High }}
                />
                Cao
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: SEVERITY_POINT_COLOR.Critical }}
                />
                Khẩn cấp
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Legend 5 cấp độ — chỉ hiện ở bước 2 */}
      {selectedProvinceCode && !selectedWardCode ? (
        <div className="absolute bottom-6 left-4 z-10 rounded-lg bg-white/95 p-3 text-xs shadow-md ring-1 ring-black/5">
          <p className="mb-1.5 font-semibold text-foreground">Mức độ theo phường/xã</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: '#94A3B8' }} />
              Không có báo cáo
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: '#22C55E' }} />
              Thấp
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: '#EAB308' }} />
              Trung bình
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: '#F97316' }} />
              Cao
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: '#DC2626' }} />
              Khẩn cấp
            </li>
          </ul>
        </div>
      ) : null}

      {/* Ghi chú ranh giới hành chính — luôn hiện, góc dưới phải, phía trên attribution control. */}
      <p className="pointer-events-none absolute bottom-9 right-3 z-10 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-slate-500 shadow-sm backdrop-blur-sm">
        Bản đồ 34 tỉnh/thành sau sáp nhập
      </p>

      <CitizenReportDetailDialog
        report={detailPin}
        onOpenChange={open => {
          if (!open) setDetailPin(null);
        }}
      />
    </div>
  );
}
