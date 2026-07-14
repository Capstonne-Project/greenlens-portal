const DEFAULT_CENTER = {
  lat: 10.8231,
  lng: 106.6297,
} as const;

/** BR-MAP — giới hạn tọa độ VN (validation API). */
export const VIETNAM_MAP_BOUNDS = {
  minLat: 8,
  maxLat: 24,
  minLng: 102,
  maxLng: 110,
} as const;

const BOUNDS_EPSILON = 1e-6;

export interface MapViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Clamp viewport vào VN và đảm bảo min < max (tránh 422 từ API map). */
export function clampMapViewportToVietnam(bounds: MapViewportBounds): MapViewportBounds {
  let minLat = Math.min(
    Math.max(bounds.minLat, VIETNAM_MAP_BOUNDS.minLat),
    VIETNAM_MAP_BOUNDS.maxLat
  );
  let maxLat = Math.min(
    Math.max(bounds.maxLat, VIETNAM_MAP_BOUNDS.minLat),
    VIETNAM_MAP_BOUNDS.maxLat
  );
  let minLng = Math.min(
    Math.max(bounds.minLng, VIETNAM_MAP_BOUNDS.minLng),
    VIETNAM_MAP_BOUNDS.maxLng
  );
  let maxLng = Math.min(
    Math.max(bounds.maxLng, VIETNAM_MAP_BOUNDS.minLng),
    VIETNAM_MAP_BOUNDS.maxLng
  );

  if (minLat >= maxLat) {
    maxLat = Math.min(minLat + BOUNDS_EPSILON, VIETNAM_MAP_BOUNDS.maxLat);
    if (minLat >= maxLat) {
      minLat = Math.max(maxLat - BOUNDS_EPSILON, VIETNAM_MAP_BOUNDS.minLat);
    }
  }
  if (minLng >= maxLng) {
    maxLng = Math.min(minLng + BOUNDS_EPSILON, VIETNAM_MAP_BOUNDS.maxLng);
    if (minLng >= maxLng) {
      minLng = Math.max(maxLng - BOUNDS_EPSILON, VIETNAM_MAP_BOUNDS.minLng);
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}

function parseMapDefaultCenter(): { lat: number; lng: number } {
  const raw = process.env.NEXT_PUBLIC_MAP_DEFAULT_CENTER;
  if (!raw?.trim()) return DEFAULT_CENTER;

  const [latRaw, lngRaw] = raw.split(',');
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return DEFAULT_CENTER;

  return {
    lat: Math.min(Math.max(lat, VIETNAM_MAP_BOUNDS.minLat), VIETNAM_MAP_BOUNDS.maxLat),
    lng: Math.min(Math.max(lng, VIETNAM_MAP_BOUNDS.minLng), VIETNAM_MAP_BOUNDS.maxLng),
  };
}

/** Viewport admin overview — API map từ chối bbox quá rộng (422: zoom in). */
export function getAdminOverviewMapBounds() {
  const { lat, lng } = parseMapDefaultCenter();
  const deltaLat = 0.35;
  const deltaLng = 0.35;

  return {
    minLat: Math.max(VIETNAM_MAP_BOUNDS.minLat, lat - deltaLat),
    maxLat: Math.min(VIETNAM_MAP_BOUNDS.maxLat, lat + deltaLat),
    minLng: Math.max(VIETNAM_MAP_BOUNDS.minLng, lng - deltaLng),
    maxLng: Math.min(VIETNAM_MAP_BOUNDS.maxLng, lng + deltaLng),
  };
}
