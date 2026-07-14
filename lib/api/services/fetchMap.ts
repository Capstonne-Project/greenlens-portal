import type { ApiEnvelope } from '@/lib/api/types/auth';
import type { ReportStatus } from '@/lib/constants/reportStatus';
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

const mapApi = {
  fetchMapReports,
  fetchMapSummary,
};

export default mapApi;
