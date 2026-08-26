import type { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl';

const GOONG_MAPTILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;

/** OpenStreetMap-based raster fallback — Carto CDN (tile.openstreetmap.org thường bị chặn/timeout từ browser). */
export const OSM_LIGHT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm-raster', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 22 }],
};

/** Goong Maptiles vector style — https://docs.goong.io/rest/maptiles */
const GOONG_STYLE_URL = GOONG_MAPTILES_KEY
  ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`
  : null;

/** Style dùng chung cho mọi map trong FE: Goong khi có key, fallback OSM raster khi thiếu key. */
export function getMapStyle(): StyleSpecification | string {
  return GOONG_STYLE_URL ?? OSM_LIGHT_STYLE;
}

/** Layer building 3D (fill-extrusion) trong Goong style mặc định chỉ hiện từ zoom 16. */
const GOONG_BUILDING_3D_LAYER_ID = 'building';
/**
 * Ngưỡng zoom hiện building 3D — giữ gần mức mặc định của style (16) thay vì hạ sâu xuống 14.
 * Extrusion 3D là phần tốn GPU nhất khi pan/zoom; hạ ngưỡng quá thấp buộc map phải render hàng
 * loạt khối 3D ngay cả ở zoom trung bình, gây giật khi zoom in/out. 15 vẫn cho 3D hiện sớm hơn
 * mặc định một chút mà không kéo tải nặng xuống dải zoom hay dùng (14–15, xem toàn khu vực).
 */
export const GOONG_BUILDING_3D_MIN_ZOOM = 15;

/**
 * Điều chỉnh nhẹ ngưỡng hiện building 3D — style Goong tải qua URL runtime nên không thể sửa
 * trực tiếp JSON nguồn, phải override sau khi style đã load vào map instance. Gọi trong `onLoad`
 * của mọi component map dùng Goong style. Giữ opacity/light ở mức mặc định của style (không ép
 * thêm shading nghiêng) để giảm chi phí render mỗi frame khi camera di chuyển.
 */
export function applyBuilding3dMinZoom(map: MaplibreMap): void {
  if (!map.getLayer(GOONG_BUILDING_3D_LAYER_ID)) return;
  map.setLayerZoomRange(GOONG_BUILDING_3D_LAYER_ID, GOONG_BUILDING_3D_MIN_ZOOM, 24);

  map.setPaintProperty(GOONG_BUILDING_3D_LAYER_ID, 'fill-extrusion-height', [
    'interpolate',
    ['linear'],
    ['zoom'],
    GOONG_BUILDING_3D_MIN_ZOOM,
    0,
    GOONG_BUILDING_3D_MIN_ZOOM + 0.5,
    ['get', 'max_height'],
  ]);
  map.setPaintProperty(GOONG_BUILDING_3D_LAYER_ID, 'fill-extrusion-base', [
    'interpolate',
    ['linear'],
    ['zoom'],
    GOONG_BUILDING_3D_MIN_ZOOM,
    0,
    GOONG_BUILDING_3D_MIN_ZOOM + 0.5,
    ['get', 'min_height'],
  ]);
  map.setPaintProperty(GOONG_BUILDING_3D_LAYER_ID, 'fill-extrusion-opacity', 0.7);
}
