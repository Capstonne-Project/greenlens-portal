/** BR-MAP-002 — tối đa 100 điểm trên viewport map (LEO / protected). */
export const MAP_VIEWPORT_PIN_LIMIT = 100;

/** Public national map — không áp cap 100 của BR-MAP-002. */
export const PUBLIC_MAP_DETAIL_PIN_LIMIT = 500;
export const PUBLIC_MAP_AGGREGATE_CELL_LIMIT = 300;
export const PUBLIC_MAP_MIN_ZOOM = 5;
export const PUBLIC_MAP_MAX_ZOOM = 18;
/** zoom < 10 → aggregate; zoom >= 10 → detail. */
export const PUBLIC_MAP_AGGREGATE_MAX_ZOOM = 9;

export function publicMapModeForZoom(zoom: number): 'detail' | 'aggregate' {
  return zoom <= PUBLIC_MAP_AGGREGATE_MAX_ZOOM ? 'aggregate' : 'detail';
}
