import type { Geometry } from 'geojson';
import type {
  CitizenMapProvinceDto,
  CitizenMapProvincesDataDto,
  CitizenMapWardDto,
  CitizenMapWardReportPinDto,
  CitizenMapWardReportsDataDto,
  CitizenMapWardsDataDto,
} from '@/lib/api/dto/citizenMap.dto';
import type {
  CitizenMapProvince,
  CitizenMapWard,
  CitizenMapWardReportPin,
  CitizenMapWardReports,
  CitizenMapWards,
} from '@/lib/api/models/citizenMap';

/** Parse GeoJSON geometry string (Polygon/MultiPolygon) từ PostGIS ST_AsGeoJSON — null nếu thiếu/hỏng. */
function parseBoundaryGeometry(geoJson: string | null | undefined): Geometry | null {
  if (!geoJson) return null;
  try {
    const parsed: unknown = JSON.parse(geoJson);
    if (
      parsed != null &&
      typeof parsed === 'object' &&
      'type' in parsed &&
      (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon')
    ) {
      return parsed as Geometry;
    }
    return null;
  } catch {
    return null;
  }
}

export function mapCitizenMapProvinceDto(dto: CitizenMapProvinceDto): CitizenMapProvince {
  return {
    code: dto.code,
    name: dto.name,
    geometry: parseBoundaryGeometry(dto.geoJson),
  };
}

export function mapCitizenMapProvincesDataDto(
  data: CitizenMapProvincesDataDto
): CitizenMapProvince[] {
  return (data.items ?? []).map(mapCitizenMapProvinceDto);
}

export function mapCitizenMapWardDto(dto: CitizenMapWardDto): CitizenMapWard {
  return {
    code: dto.code,
    name: dto.name,
    unitAbbreviation: dto.unitAbbreviation ?? null,
    geometry: parseBoundaryGeometry(dto.geoJson),
    activeReportCount: dto.activeReportCount,
    level: dto.level,
    colorHex: dto.colorHex,
  };
}

export function mapCitizenMapWardsDataDto(data: CitizenMapWardsDataDto): CitizenMapWards {
  return {
    provinceCode: data.provinceCode,
    provinceName: data.provinceName ?? null,
    items: (data.items ?? []).map(mapCitizenMapWardDto),
  };
}

export function mapCitizenMapWardReportPinDto(
  dto: CitizenMapWardReportPinDto
): CitizenMapWardReportPin {
  return {
    id: dto.id,
    code: dto.code,
    latitude: dto.latitude,
    longitude: dto.longitude,
    severity: dto.severity,
    categoryCode: dto.categoryCode,
    title: dto.title,
    categoryIconUrl: dto.categoryIconUrl ?? null,
    description: dto.description ?? null,
    address: dto.address ?? null,
    reporterCount: dto.reporterCount,
    imageUrl: dto.imageUrl ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export function mapCitizenMapWardReportsDataDto(
  data: CitizenMapWardReportsDataDto
): CitizenMapWardReports {
  return {
    wardCode: data.wardCode,
    wardName: data.wardName ?? null,
    items: (data.items ?? []).map(mapCitizenMapWardReportPinDto),
  };
}
