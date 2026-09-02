/** GET /v1/citizen-map/provinces — raw item. */
export interface CitizenMapProvinceDto {
  code: string;
  name: string;
  geoJson?: string | null;
}

export interface CitizenMapProvincesDataDto {
  items: CitizenMapProvinceDto[];
}

/** GET /v1/citizen-map/provinces/{provinceCode}/wards — 5-tier risk level (1 None – 5 Critical). */
export type CitizenMapWardRiskLevelDto = 1 | 2 | 3 | 4 | 5;

export interface CitizenMapWardDto {
  code: string;
  name: string;
  unitAbbreviation?: string | null;
  geoJson?: string | null;
  activeReportCount: number;
  level: CitizenMapWardRiskLevelDto;
  colorHex: string;
}

export interface CitizenMapWardsDataDto {
  provinceCode: string;
  provinceName?: string | null;
  items: CitizenMapWardDto[];
}

/** GET /v1/citizen-map/wards/{wardCode}/reports — report pin, matches Domain.Enums.Severity/ReportStatus. */
export type CitizenMapSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

export type CitizenMapReportStatusDto =
  | 'Submitted'
  | 'Verified'
  | 'InProgress'
  | 'Resolved'
  | 'Reopened'
  | 'Closed'
  | 'Rejected'
  | 'Duplicate';

export interface CitizenMapWardReportPinDto {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  severity: CitizenMapSeverityDto;
  categoryCode: string;
  title: string;
  categoryIconUrl?: string | null;
  description?: string | null;
  address?: string | null;
  reporterCount: number;
  imageUrl?: string | null;
  status: CitizenMapReportStatusDto;
  createdAt: string;
}

export interface CitizenMapWardReportsDataDto {
  wardCode: string;
  wardName?: string | null;
  items: CitizenMapWardReportPinDto[];
}
