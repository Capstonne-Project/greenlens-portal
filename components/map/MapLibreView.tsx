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
import buffer from '@turf/buffer';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  LineString,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from 'geojson';
import { LngLatBounds, type StyleSpecification, type CircleLayerSpecification } from 'maplibre-gl';
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
import { useLeoWardBoundary } from '@/hooks/useLeoOffices';
import { useCanFetchProtected } from '@/hooks/useAuthSession';
import { MAP_VIEWPORT_PIN_LIMIT } from '@/lib/constants/mapReports';
import { isAbortError } from '@/lib/utils/abortError';
import {
  MAP_SIDEBAR_TRANSITION_MS,
  selectMapPaddingLeft,
  useMapShellStore,
} from '@/lib/store/mapShellStore';
import { mapShellMapClass } from '@/lib/map/mapShellStyles';
import {
  applyBuilding3dMinZoom,
  getMapStyle,
  GOONG_BUILDING_3D_MIN_ZOOM,
} from '@/lib/map/mapStyle';
import { cn } from '@/lib/utils';
import { MapLoadingSkeleton } from './MapLoadingSkeleton';
import { MapReportPopupCard } from './MapReportPopupCard';

/** Default center HCM — BR-MAP-001 */
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];
/** Khớp GOONG_BUILDING_3D_MIN_ZOOM (mapStyle.ts) — đủ gần để building 3D hiện ngay từ đầu. */
const DEFAULT_ZOOM = 15;
/** MapLibre giới hạn pitch tối đa 60° — nghiêng hết cỡ để building 3D lộ rõ chiều cao. */
const DEFAULT_PITCH = 60;

/**
 * Trễ trước khi query lại reports theo viewport mới — tránh gọi API dồn dập mỗi frame trong lúc
 * người dùng đang kéo/zoom liên tục. `moveend` của MapLibre đã tự chỉ bắn khi camera dừng hẳn,
 * nhưng zoom nhanh nhiều nấc hoặc pan-thả liên tiếp vẫn có thể tạo chuỗi `moveend` sát nhau.
 */
const VIEWPORT_UPDATE_DEBOUNCE_MS = 250;

const SOURCE_ID = 'reports';
const REPORT_POINTS_LAYER_ID = 'report-points';

const REPORT_PILLAR_SOURCE_ID = 'report-pillars';
const REPORT_PILLAR_LAYER_ID = 'report-pillars-extrusion';

const WARD_BOUNDARY_SOURCE_ID = 'ward-boundary';
const WARD_BOUNDARY_OUTLINE_LAYER_ID = 'ward-boundary-outline';

const WARD_MASK_SOURCE_ID = 'ward-mask';
const WARD_MASK_LAYER_ID = 'ward-mask-fill';

const WARD_WALL_SOURCE_ID = 'ward-boundary-wall';
const WARD_WALL_LAYER_ID = 'ward-boundary-wall-extrusion';
/** Chiều cao tường bo (mét) — đủ cao để thấy rõ khi nghiêng camera, không che khuất building 3D quá nhiều. */
const BOUNDARY_WALL_HEIGHT_M = 220;

/** Ring bao toàn cầu — dùng làm outer ring của mask, các ward ring bên trong là "lỗ khoét". */
const WORLD_RING: Position[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

const EMPTY_GEOJSON: FeatureCollection = { type: 'FeatureCollection', features: [] };

const DOT_GRID_PATTERN_ID = 'ward-mask-dot-grid';
const DOT_GRID_SIZE = 16;

/** Vẽ pattern lưới chấm trắng dùng làm fill-pattern cho vùng che ngoài ranh giới phường. */
function createDotGridPattern(): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = DOT_GRID_SIZE;
  canvas.height = DOT_GRID_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new ImageData(DOT_GRID_SIZE, DOT_GRID_SIZE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DOT_GRID_SIZE, DOT_GRID_SIZE);
  ctx.fillStyle = '#d9dde3';
  ctx.beginPath();
  ctx.arc(DOT_GRID_SIZE / 2, DOT_GRID_SIZE / 2, 1.4, 0, Math.PI * 2);
  ctx.fill();
  return ctx.getImageData(0, 0, DOT_GRID_SIZE, DOT_GRID_SIZE);
}

/**
 * "Inverse mask": 1 Polygon với outer ring = toàn cầu, holes = từng ring của ranh giới phường.
 * Fill trắng đục → chỉ phần bên trong phường (lỗ khoét) lộ map ra, còn lại bị che trắng.
 */
function buildInverseMask(geometry: Geometry | null | undefined): Feature<Polygon> {
  const holes: Position[][] = [];
  if (geometry?.type === 'Polygon') {
    holes.push(...geometry.coordinates);
  } else if (geometry?.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) holes.push(...polygon);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] },
  };
}

/** Độ rộng dải tường bo — buffer quanh đường ranh giới phường (mỗi bên ~7.5m). */
const BOUNDARY_WALL_HALF_WIDTH_KM = 0.0075;

/**
 * Dựng "tường bo" quanh ranh giới phường: buffer đường viền (LineString) thành 1 dải Polygon
 * mỏng, sau đó `fill-extrusion` kéo dải này lên cao — tạo hiệu ứng vòng tường ánh sáng bao quanh
 * khu vực, giống vòng bo an toàn trong game battle-royale, thay vì chỉ 1 đường line phẳng.
 */
function buildBoundaryWall(
  geometry: Geometry | null | undefined
): FeatureCollection<Polygon | MultiPolygon> {
  const rings: Position[][] = [];
  if (geometry?.type === 'Polygon') {
    rings.push(...geometry.coordinates);
  } else if (geometry?.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) rings.push(...polygon);
  }
  const features = rings
    .map(ring => {
      const line: Feature<LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: ring },
      };
      return buffer(line, BOUNDARY_WALL_HALF_WIDTH_KM, { units: 'kilometers' });
    })
    .filter((f): f is Feature<Polygon | MultiPolygon> => f != null);
  return { type: 'FeatureCollection', features };
}

const REPORT_PILLAR_RADIUS_M = 18;
const METERS_PER_DEGREE_LAT = 111_320;

/**
 * `fill-extrusion` chỉ extrude Polygon, không extrude Point — dựng 1 hình lục giác nhỏ
 * (bán kính cố định theo mét, quy đổi độ theo latitude) quanh mỗi report point để làm "cột".
 * Xấp xỉ bằng hệ số mét/độ là đủ chính xác ở bán kính vài chục mét, không cần turf/circle.
 */
function buildPointPillar(
  longitude: number,
  latitude: number,
  radiusMeters: number = REPORT_PILLAR_RADIUS_M
): Position[] {
  const latRad = (latitude * Math.PI) / 180;
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos(latRad);
  const ring: Position[] = [];
  const sides = 6;
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const dLng = (radiusMeters * Math.cos(angle)) / metersPerDegreeLng;
    const dLat = (radiusMeters * Math.sin(angle)) / METERS_PER_DEGREE_LAT;
    ring.push([longitude + dLng, latitude + dLat]);
  }
  return ring;
}

function boundsFromGeometry(geometry: Geometry): LngLatBounds | null {
  let bounds: LngLatBounds | null = null;
  const extend = (lng: unknown, lat: unknown) => {
    if (typeof lng !== 'number' || typeof lat !== 'number') return;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    if (!bounds) bounds = new LngLatBounds([lng, lat], [lng, lat]);
    else bounds.extend([lng, lat]);
  };

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      for (const [lng, lat] of ring) extend(lng, lat);
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const [lng, lat] of ring) extend(lng, lat);
      }
    }
  }
  return bounds;
}

export type MapViewMode = 'map' | 'globe';

export type MapLibreViewHandle = {
  refresh: () => void;
  setMapStyle: (style: 'dark' | 'light') => void;
  setViewMode: (mode: MapViewMode) => void;
};

type MapLibreViewProps = {
  className?: string;
  onMonitoringCountChange?: (count: number) => void;
};

/** Globe mode: bỏ nghiêng + zoom ra world view để thấy rõ độ cong địa cầu. */
const GLOBE_PITCH = 0;
const GLOBE_ZOOM = 2.2;

type ReportFeatureProperties = {
  id: string;
  severity: string;
  code: string;
  title: string;
  address?: string | null;
  status?: string;
  createdAt?: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryIconUrl?: string | null;
  reporterCount?: number;
  pillarHeight: number;
};

/** Chiều cao cột report theo severity — severity cao nổi rõ hơn khi xem globe. */
const SEVERITY_PILLAR_HEIGHT_M: Record<string, number> = {
  low: 60,
  medium: 120,
  high: 200,
  critical: 280,
};
const DEFAULT_REPORT_PILLAR_HEIGHT_M = 100;

function severityPillarHeight(severity: string | undefined): number {
  if (!severity) return DEFAULT_REPORT_PILLAR_HEIGHT_M;
  return SEVERITY_PILLAR_HEIGHT_M[severity.toLowerCase()] ?? DEFAULT_REPORT_PILLAR_HEIGHT_M;
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const viewportUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewport, setViewport] = useState<MapViewportParams | null>(null);
  const [mapStyle, setMapStyleState] = useState<StyleSpecification | string>(getMapStyle);
  const [popupFeature, setPopupFeature] = useState<ReportFeature | null>(null);
  /**
   * Goong style (vector) tải style JSON + sprite + tiles mất thời gian đáng kể hơn OSM raster.
   * Trong lúc đó, map hiển thị vị trí/zoom mặc định trước khi `fitBounds` vào ranh giới phường
   * kịp chạy — gây hiệu ứng "nháy" vị trí sai khi mount/remount (route change). Che bằng overlay
   * cho tới khi map đã load xong VÀ (nếu có ranh giới) đã fit xong vào đúng vị trí.
   */
  const [isReady, setIsReady] = useState(false);
  /** Buộc effect fitBounds re-run khi map instance vừa sẵn sàng (xem comment tại nơi khai báo effect). */
  const [mapInstanceTick, setMapInstanceTick] = useState(0);
  const [viewMode, setViewModeState] = useState<MapViewMode>('map');
  const mapPaddingLeft = useMapShellStore(selectMapPaddingLeft);
  const { data, isFetching } = useMapReports(viewport);

  const canFetchProtected = useCanFetchProtected();
  const { data: wardBoundary, isFetched: isWardBoundaryFetched } = useLeoWardBoundary({
    enabled: canFetchProtected,
  });
  const wardFeature = useMemo<Feature<Geometry> | null>(() => {
    if (!wardBoundary?.geometry) return null;
    return { type: 'Feature', properties: {}, geometry: wardBoundary.geometry };
  }, [wardBoundary]);
  const boundaryGeojson = useMemo<FeatureCollection>(
    () => (wardFeature ? { type: 'FeatureCollection', features: [wardFeature] } : EMPTY_GEOJSON),
    [wardFeature]
  );
  const hasBoundary = boundaryGeojson.features.length > 0;
  const maskFeature = useMemo(() => buildInverseMask(wardFeature?.geometry), [wardFeature]);
  const wallGeojson = useMemo(() => buildBoundaryWall(wardFeature?.geometry), [wardFeature]);
  const hasFitBoundaryRef = useRef(false);

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
            description: item.description,
            imageUrl: item.imageUrl,
            categoryIconUrl: item.categoryIconUrl,
            reporterCount: item.reporterCount,
            pillarHeight: severityPillarHeight(item.severity),
          },
        })),
    };
  }, [data?.data?.items]);

  /** Globe mode: mỗi report point trở thành 1 Polygon lục giác nhỏ để `fill-extrusion` dựng cột. */
  const pillarGeojson = useMemo<FeatureCollection<Polygon, ReportFeatureProperties>>(() => {
    return {
      type: 'FeatureCollection' as const,
      features: geojson.features.map(feature => ({
        type: 'Feature' as const,
        properties: feature.properties,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            buildPointPillar(feature.geometry.coordinates[0], feature.geometry.coordinates[1]),
          ],
        },
      })),
    };
  }, [geojson]);

  const applyViewportFromMap = useCallback((ref: MapRef | null) => {
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
      limit: MAP_VIEWPORT_PIN_LIMIT,
    });
  }, []);

  /** Cập nhật ngay — dùng cho các lần chỉ chạy một lần (load, fit boundary), không cần debounce. */
  const updateViewportFromMap = applyViewportFromMap;

  /**
   * Bản debounce dùng cho sự kiện lặp lại trong lúc thao tác (`moveend` khi pan/zoom liên tục) —
   * hoãn set state/refetch tới khi camera thực sự dừng lại thay vì mỗi lần dừng tạm cũng gọi API.
   */
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

  const refresh = useCallback(() => {
    const ref = mapRef.current;
    const map = ref?.getMap();
    if (!map) return;
    updateViewportFromMap(ref);
    map.resize();
    map.triggerRepaint();
  }, [updateViewportFromMap]);

  const setMapStyle = useCallback((_style: 'dark' | 'light') => {
    // Keep API stable; map now always uses Goong Maptiles (fallback OSM) regardless of theme.
    setMapStyleState(getMapStyle());
  }, []);

  const savedMaxBoundsRef = useRef<LngLatBounds | null>(null);
  const savedCameraRef = useRef<{ zoom: number; center: [number, number] } | null>(null);

  /**
   * Globe mode: zoom ra world view + bỏ nghiêng để thấy rõ độ cong địa cầu (ranh giới phường vẫn
   * còn nhưng chỉ là 1 điểm nhỏ trên bản đồ thế giới). `maxBounds` tạm gỡ để xoay/pan tự do quan
   * sát quả cầu. Lưu lại camera + maxBounds hiện tại để khôi phục đúng vị trí khi quay lại map mode.
   */
  const setViewMode = useCallback((mode: MapViewMode) => {
    setViewModeState(mode);
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (mode === 'globe') {
      savedMaxBoundsRef.current = map.getMaxBounds();
      const center = map.getCenter();
      savedCameraRef.current = { zoom: map.getZoom(), center: [center.lng, center.lat] };
      map.setMaxBounds(undefined);
      map.easeTo({ pitch: GLOBE_PITCH, zoom: GLOBE_ZOOM, center: DEFAULT_CENTER, duration: 800 });
    } else {
      const target = savedCameraRef.current;
      map.easeTo({
        pitch: DEFAULT_PITCH,
        zoom: target?.zoom ?? DEFAULT_ZOOM,
        center: target?.center ?? DEFAULT_CENTER,
        duration: 800,
      });
      if (savedMaxBoundsRef.current) {
        map.setMaxBounds(savedMaxBoundsRef.current);
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({ refresh, setMapStyle, setViewMode }), [
    refresh,
    setMapStyle,
    setViewMode,
  ]);

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
    const map = mapRef.current?.getMap();
    if (map && !map.hasImage(DOT_GRID_PATTERN_ID)) {
      const pattern = createDotGridPattern();
      map.addImage(DOT_GRID_PATTERN_ID, pattern, { pixelRatio: 2 });
    }
    if (map) {
      applyBuilding3dMinZoom(map);
      /**
       * Mặc định 1/450 khá nhạy trên chuột/trackpad độ phân giải cao — mỗi lần lăn nhẹ đã
       * nhảy nhiều nấc zoom, buộc building 3D + tile re-render liên tục gây giật. Giảm nhạy
       * để mỗi thao tác zoom mượt và có chủ đích hơn.
       */
      map.scrollZoom.setWheelZoomRate(1 / 900);
    }
    updateViewportFromMap(mapRef.current);
    applyMapPadding();
    setMapInstanceTick(tick => tick + 1);
  }, [updateViewportFromMap, applyMapPadding]);

  /**
   * MapLibre đọc kích thước container ngay lúc khởi tạo (constructor gọi `resize()` nội bộ).
   * Sau route change, container cha có thể vẫn ở 0x0 vì Next.js chưa layout xong tại thời điểm
   * đó — map khởi tạo với canvas sai kích thước và không tự sửa lại. Gắn observer NGAY khi
   * component mount (không đợi `onLoad`) để bắt kịp lúc container đạt kích thước thật và luôn
   * theo dõi suốt vòng đời (kể cả resize do sidebar/cửa sổ sau này).
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.getMap()?.resize();
    });
    observer.observe(container);
    resizeObserverRef.current = observer;
    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

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
    setPopupFeature({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [event.lngLat.lng, event.lngLat.lat] },
      properties: feature.properties as ReportFeatureProperties,
    });
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

  /**
   * Fit vào ranh giới phường (padding: 0 — polygon lấp sát 4 cạnh khung nhìn), chỉ 1 lần khi
   * boundary có sẵn. Sau khi fit xong mới `setMaxBounds` — nới thêm ~25% quanh bbox thật để pan
   * có đệm nhẹ trước khi chặn cứng, đỡ cảm giác bó sát ngay tại viền. Zoom in/out vẫn tự do
   * (`maxBounds` không giới hạn zoom). Gọi `setMaxBounds` sau khi animation `fitBounds` xong
   * (qua event `moveend`) để tránh race condition giữa 2 lệnh camera cùng lúc.
   *
   * `mapRef.current` có thể vẫn `null` ngay sau mount (route change) — `<Map>` gắn ref sau khi
   * effect này chạy lần đầu. Effect chỉ re-run khi `boundaryGeojson`/`mapPaddingLeft` đổi (không
   * đổi khi data đến từ cache), nên bỏ cuộc vì thiếu map instance sẽ khiến `doFit`/`setIsReady`
   * không bao giờ chạy — overlay loading treo vĩnh viễn. `mapInstanceTick` (set trong `onLoad`)
   * buộc effect chạy lại đúng lúc map đã sẵn sàng.
   */
  useEffect(() => {
    if (hasFitBoundaryRef.current) return;
    const feature = boundaryGeojson.features[0];
    if (!feature?.geometry) return;
    const bounds = boundsFromGeometry(feature.geometry);
    if (!bounds) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    hasFitBoundaryRef.current = true;

    const doFit = () => {
      /**
       * Khi `boundaryGeojson` đến từ React Query cache (quay lại route thay vì F5), effect này
       * chạy ngay sau mount — trước khi container hoàn tất layout (ví dụ transition sidebar/route).
       * `resize()` đồng bộ kích thước canvas với DOM thật ngay trước khi tính `fitBounds`, tránh
       * zoom/center bị lệch do đọc kích thước cũ/tạm thời.
       */
      map.resize();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const latPad = (ne.lat - sw.lat) * 0.25;
      const lngPad = (ne.lng - sw.lng) * 0.25;
      const paddedBounds = new LngLatBounds(
        [sw.lng - lngPad, sw.lat - latPad],
        [ne.lng + lngPad, ne.lat + latPad]
      );

      // fitBounds đã bao gồm padding trái hiện tại — tránh chạy chồng easeTo padding cùng lúc.
      map.once('moveend', () => {
        map.setMaxBounds(paddedBounds);
        /**
         * `fitBounds` tự tính zoom theo kích thước ranh giới phường — với phường rộng, kết quả
         * có thể thấp hơn `GOONG_BUILDING_3D_MIN_ZOOM`, khiến building 3D không hiện dù đã hạ
         * ngưỡng. Ép zoom tối thiểu ngay sau khi fit xong để 3D luôn hiện lúc vừa vào.
         */
        if (map.getZoom() < GOONG_BUILDING_3D_MIN_ZOOM) {
          map.setZoom(GOONG_BUILDING_3D_MIN_ZOOM);
        }
        /**
         * `moveend` chỉ báo camera đã tới đích, KHÔNG đảm bảo tile ở vị trí mới đã tải/render
         * xong (vector tiles cần fetch qua network) — tắt overlay ngay ở đây để lộ khung hình
         * tạm (tile cũ/trống) trong chốc lát trước khi tile thật hiện ra, đúng hiệu ứng "chớp
         * 1 cái". `idle` báo mọi nguồn/tile đã render xong, không còn gì đang tải.
         */
        map.once('idle', () => setIsReady(true));
      });
      map.fitBounds(bounds, {
        padding: { top: 0, bottom: 0, left: mapPaddingLeft, right: 0 },
        pitch: DEFAULT_PITCH,
        duration: 0,
      });
    };

    /**
     * Container có thể vẫn ở kích thước 0x0 ngay sau route change (layout Next.js chưa reflow
     * xong) — `resize()`/`fitBounds` đọc kích thước tại đúng lúc đó sẽ sai và co polygon lại nhỏ
     * xíu ở góc canvas cũ. Đợi container thực sự có kích thước hợp lệ (qua ResizeObserver) rồi
     * mới fit, thay vì đoán bằng requestAnimationFrame 1 frame.
     */
    const container = containerRef.current;
    const runWhenSized = (run: () => void) => {
      if (!container) {
        run();
        return;
      }
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        run();
        return;
      }
      const observer = new ResizeObserver(entries => {
        const box = entries[0]?.contentRect;
        if (box && box.width > 0 && box.height > 0) {
          observer.disconnect();
          run();
        }
      });
      observer.observe(container);
    };

    /**
     * `loaded()` false khi style/sprite của map chưa tải xong (đặc biệt vừa remount sau route
     * change) — fitBounds lúc đó dễ bị bỏ qua hoặc tính sai. Đợi sự kiện `load` trước khi fit.
     */
    if (map.loaded()) {
      runWhenSized(doFit);
    } else {
      map.once('load', () => runWhenSized(doFit));
    }
  }, [boundaryGeojson, mapPaddingLeft, mapInstanceTick]);

  useEffect(() => {
    hasFitBoundaryRef.current = false;
    mapRef.current?.getMap()?.setMaxBounds(undefined);
  }, [wardBoundary?.wardCode]);

  /** Không có ranh giới phường để fit (đã fetch xong nhưng rỗng) — coi map sẵn sàng khi tile đã render (idle). */
  useEffect(() => {
    if (hasBoundary) return;
    if (!isWardBoundaryFetched) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (map.loaded()) {
      map.once('idle', () => setIsReady(true));
    } else {
      map.once('load', () => map.once('idle', () => setIsReady(true)));
    }
  }, [hasBoundary, isWardBoundaryFetched]);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className ?? mapShellMapClass())}
      role="application"
      aria-label="Bản đồ báo cáo ô nhiễm"
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_CENTER[0],
          latitude: DEFAULT_CENTER[1],
          zoom: DEFAULT_ZOOM,
          pitch: DEFAULT_PITCH,
        }}
        mapStyle={mapStyle}
        projection={{ type: 'globe' }}
        attributionControl={false}
        interactiveLayerIds={[REPORT_POINTS_LAYER_ID, REPORT_PILLAR_LAYER_ID]}
        style={{ width: '100%', height: '100%' }}
        /**
         * `around: 'center'` giữ tâm zoom cố định thay vì theo con trỏ chuột — cảm giác zoom
         * ổn định, có chủ đích hơn khi building 3D phải render lại liên tục quanh vị trí zoom.
         * Độ nhạy scroll wheel (`wheelZoomRate`) được giảm thêm trong `handleMapLoad`.
         */
        scrollZoom={{ around: 'center' }}
        touchZoomRotate={{ around: 'center' }}
        dragRotate={viewMode === 'globe'}
        maxPitch={viewMode === 'globe' ? 85 : DEFAULT_PITCH}
        onLoad={handleMapLoad}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onError={event => {
          const err = event.error as (Error & { url?: string; sourceId?: string }) | undefined;
          if (isAbortError(err) || isAbortError(err?.message)) return;
          console.error('[MapLibreView] Map error:', {
            message: err?.message,
            url: err?.url,
            sourceId: err?.sourceId,
          });
        }}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <AttributionControl position="bottom-right" compact />

        <Source id={SOURCE_ID} type="geojson" data={geojson}>
          <Layer
            {...REPORT_POINTS_LAYER}
            layout={{ visibility: viewMode === 'map' ? 'visible' : 'none' }}
          />
        </Source>

        <Source id={REPORT_PILLAR_SOURCE_ID} type="geojson" data={pillarGeojson}>
          <Layer
            id={REPORT_PILLAR_LAYER_ID}
            type="fill-extrusion"
            layout={{ visibility: viewMode === 'globe' ? 'visible' : 'none' }}
            paint={{
              'fill-extrusion-color': '#d92b2b',
              'fill-extrusion-height': ['get', 'pillarHeight'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85,
            }}
          />
        </Source>

        {hasBoundary ? (
          <Source id={WARD_BOUNDARY_SOURCE_ID} type="geojson" data={boundaryGeojson}>
            <Layer
              id={WARD_BOUNDARY_OUTLINE_LAYER_ID}
              type="line"
              paint={{ 'line-color': '#15803d', 'line-width': 2.5, 'line-opacity': 0.9 }}
            />
          </Source>
        ) : null}

        {/* Che trắng toàn bộ ngoài ranh giới phường — chỉ ở map mode; globe mode hiện map thế giới bình thường. */}
        {hasBoundary && viewMode === 'map' ? (
          <Source id={WARD_MASK_SOURCE_ID} type="geojson" data={maskFeature}>
            <Layer
              id={WARD_MASK_LAYER_ID}
              type="fill"
              paint={{ 'fill-pattern': DOT_GRID_PATTERN_ID, 'fill-opacity': 1 }}
            />
          </Source>
        ) : null}

        {/* "Tường bo" dựng đứng quanh ranh giới phường — chỉ ở globe mode, kiểu vòng an toàn PUBG. */}
        {hasBoundary && viewMode === 'globe' ? (
          <Source id={WARD_WALL_SOURCE_ID} type="geojson" data={wallGeojson}>
            <Layer
              id={WARD_WALL_LAYER_ID}
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': '#22c55e',
                'fill-extrusion-height': BOUNDARY_WALL_HEIGHT_M,
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.55,
              }}
            />
          </Source>
        ) : null}

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
    </div>
  );
});
