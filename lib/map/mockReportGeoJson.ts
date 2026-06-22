export type MockReportProperties = {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  weight: number;
};

const CATEGORIES = ['Rác thải', 'Nước thải', 'Khói bụi', 'Tiếng ồn', 'Đất ô nhiễm'];

/** HCM metro bounds — BR-MAP default center ~10.8231, 106.6297 */
const HCM_CENTER = { lng: 106.6297, lat: 10.8231 };
const SPREAD_LNG = 0.45;
const SPREAD_LAT = 0.35;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSeverity(rand: () => number): MockReportProperties['severity'] {
  const r = rand();
  if (r < 0.08) return 'Critical';
  if (r < 0.28) return 'High';
  if (r < 0.62) return 'Medium';
  return 'Low';
}

function severityWeight(severity: MockReportProperties['severity']): number {
  switch (severity) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    default:
      return 1;
  }
}

/**
 * Generates clustered-friendly mock report points for map dev (no API).
 * Default ~800 points — suitable for heatmap + cluster stress test.
 */
export type MockReportGeoJson = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: MockReportProperties;
  }>;
};

export function createMockReportGeoJson(count = 800, seed = 42): MockReportGeoJson {
  const rand = mulberry32(seed);
  const features = Array.from({ length: count }, (_, index) => {
    const severity = pickSeverity(rand);
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand());
    const lngCoord = HCM_CENTER.lng + Math.cos(angle) * radius * SPREAD_LNG;
    const latCoord = HCM_CENTER.lat + Math.sin(angle) * radius * SPREAD_LAT;

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lngCoord, latCoord] as [number, number],
      },
      properties: {
        id: `mock-report-${index + 1}`,
        severity,
        category: CATEGORIES[Math.floor(rand() * CATEGORIES.length)] ?? 'Rác thải',
        weight: severityWeight(severity),
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export const MOCK_MONITORING_COUNT = 842;
