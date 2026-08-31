import type { ApiEnvelope } from '@/lib/api/types/auth';
import type { PublicMapPresence, ReportStatus } from '@/lib/constants/reportStatus';
import apiService from '../core';

export type MapReportsMode = 'detail' | 'aggregate';

export type MapReportStatus = ReportStatus;

export interface MapReportDetailItem {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  severity: string;
  categoryCode: string;
  title: string;
  categoryIconUrl?: string | null;
  description?: string | null;
  address?: string | null;
  reporterCount: number;
  imageUrl?: string | null;
  status: MapReportStatus;
  createdAt: string;
}

export interface MapReportAggregateCell {
  centerLatitude: number;
  centerLongitude: number;
  count: number;
  maxSeverity: string;
}

export interface MapReportsMeta {
  returned: number;
  limit: number;
  gridLevel: number;
  cellSizeDegrees: number;
}

export interface MapReportsData {
  mode: string;
  items: MapReportDetailItem[];
  cells: MapReportAggregateCell[];
  meta: MapReportsMeta;
}

export interface MapReportsQueryParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  mode?: MapReportsMode;
  limit?: number;
  gridLevel?: number;
  categoryId?: string;
}

export interface MapSummaryDailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface MapSummaryData {
  reportCount: number;
  days: number;
  periodStart: string;
  periodEnd: string;
  dailyCounts: MapSummaryDailyCount[];
}

export interface MapSummaryQueryParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  days?: number; // default BE 30
  categoryId?: string;
}

export async function fetchMapReports(
  params: MapReportsQueryParams
): Promise<ApiEnvelope<MapReportsData>> {
  const query: Record<string, string | number> = {
    MinLat: params.minLat,
    MaxLat: params.maxLat,
    MinLng: params.minLng,
    MaxLng: params.maxLng,
  };
  if (params.mode) query.Mode = params.mode;
  if (params.limit != null) query.Limit = params.limit;
  if (params.gridLevel != null) query.GridLevel = params.gridLevel;
  if (params.categoryId) query.CategoryId = params.categoryId;

  const res = await apiService.get<ApiEnvelope<MapReportsData>>('/v1/map/reports', query);
  return res.data;
}

export async function fetchMapSummary(
  params: MapSummaryQueryParams
): Promise<ApiEnvelope<MapSummaryData>> {
  const query: Record<string, string | number> = {
    MinLat: params.minLat,
    MaxLat: params.maxLat,
    MinLng: params.minLng,
    MaxLng: params.maxLng,
  };
  if (params.days != null) query.Days = params.days;
  if (params.categoryId) query.CategoryId = params.categoryId;

  const res = await apiService.get<ApiEnvelope<MapSummaryData>>('/v1/map/summary', query);
  return res.data;
}

/** GET /v1/public/map/reports — AllowAnonymous, bbox bắt buộc, không đọc JWT office. */
export interface PublicMapReportPin {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  title: string;
  categoryCode: string;
  categoryId?: string | null;
  categoryIconUrl?: string | null;
  severity: string;
  status: MapReportStatus;
  address?: string | null;
  imageUrl?: string | null;
  afterImageUrl?: string | null;
  reporterCount: number;
  createdAt: string;
}

export interface PublicMapClusterCell {
  centerLatitude: number;
  centerLongitude: number;
  count: number;
  maxSeverity: string;
  provinceCode?: string | null;
  provinceName?: string | null;
  cleanedCount?: number;
}

export interface PublicMapReportsMeta {
  returned: number;
  limit: number;
  zoom: number;
  truncated: boolean;
  gridLevel?: number;
}

export interface PublicMapReportsData {
  mode: MapReportsMode | string;
  items: PublicMapReportPin[];
  cells: PublicMapClusterCell[];
  meta: PublicMapReportsMeta;
}

export interface PublicMapReportsQueryParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoom: number;
  mode?: MapReportsMode;
  presence?: PublicMapPresence;
  limit?: number;
  categoryId?: string;
  severity?: string;
  provinceCode?: string;
  from?: string;
  to?: string;
}

export interface PublicMapStatusCount {
  status: MapReportStatus | string;
  count: number;
}

export interface PublicMapCategoryCount {
  categoryId?: string | null;
  categoryCode?: string | null;
  name: string;
  count: number;
}

export interface PublicMapProvinceCount {
  code: string;
  name: string;
  count: number;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
}

export interface PublicMapSummaryData {
  reportCount: number;
  nationalCount: number;
  nationalActiveCount: number;
  nationalCleanedCount: number;
  days: number;
  periodStart: string;
  periodEnd: string;
  byStatus: PublicMapStatusCount[];
  byCategory: PublicMapCategoryCount[];
  byProvince: PublicMapProvinceCount[];
}

export interface PublicMapSummaryQueryParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  presence?: PublicMapPresence;
  days?: number;
  categoryId?: string;
  provinceCode?: string;
}

function toPublicMapQuery(
  params: PublicMapReportsQueryParams | PublicMapSummaryQueryParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    MinLat: params.minLat,
    MaxLat: params.maxLat,
    MinLng: params.minLng,
    MaxLng: params.maxLng,
  };
  if (params.presence) query.Presence = params.presence;
  if (params.categoryId) query.CategoryId = params.categoryId;
  if (params.provinceCode) query.ProvinceCode = params.provinceCode;
  return query;
}

/**
 * Public map pins/clusters — guest-safe, PII stripped.
 * Không dùng `/v1/map/reports` (JWT + ward/province scope).
 */
export async function fetchPublicMapReports(
  params: PublicMapReportsQueryParams
): Promise<ApiEnvelope<PublicMapReportsData>> {
  const query = toPublicMapQuery(params);
  query.Zoom = params.zoom;
  if (params.mode) query.Mode = params.mode;
  if (params.limit != null) query.Limit = params.limit;
  if (params.severity) query.Severity = params.severity;
  if (params.from) query.From = params.from;
  if (params.to) query.To = params.to;

  const res = await apiService.get<ApiEnvelope<PublicMapReportsData>>(
    '/v1/public/map/reports',
    query
  );
  const envelope = res.data;
  const payload = envelope.data;
  return {
    ...envelope,
    data: {
      mode: payload?.mode ?? params.mode ?? 'detail',
      items: payload?.items ?? [],
      cells: payload?.cells ?? [],
      meta: payload?.meta ?? {
        returned: 0,
        limit: params.limit ?? 0,
        zoom: params.zoom,
        truncated: false,
      },
    },
  };
}

/** Public KPI chrome — nationalActiveCount / nationalCleanedCount tách khỏi viewport. */
export async function fetchPublicMapSummary(
  params: PublicMapSummaryQueryParams
): Promise<ApiEnvelope<PublicMapSummaryData>> {
  const query = toPublicMapQuery(params);
  if (params.days != null) query.Days = params.days;

  const res = await apiService.get<ApiEnvelope<PublicMapSummaryData>>(
    '/v1/public/map/summary',
    query
  );
  const envelope = res.data;
  const payload = envelope.data;
  return {
    ...envelope,
    data: {
      reportCount: payload?.reportCount ?? 0,
      nationalCount: payload?.nationalCount ?? 0,
      nationalActiveCount: payload?.nationalActiveCount ?? 0,
      nationalCleanedCount: payload?.nationalCleanedCount ?? 0,
      days: payload?.days ?? params.days ?? 30,
      periodStart: payload?.periodStart ?? '',
      periodEnd: payload?.periodEnd ?? '',
      byStatus: payload?.byStatus ?? [],
      byCategory: payload?.byCategory ?? [],
      byProvince: payload?.byProvince ?? [],
    },
  };
}

const mapApi = {
  fetchMapReports,
  fetchMapSummary,
  fetchPublicMapReports,
  fetchPublicMapSummary,
};

export default mapApi;
