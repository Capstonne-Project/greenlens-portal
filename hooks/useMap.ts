'use client';

import { useQuery } from '@tanstack/react-query';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
  fetchMapReports,
  fetchMapSummary,
  type MapReportsMode,
  type MapReportsQueryParams,
  type MapSummaryQueryParams,
} from '@/lib/api/services/fetchMap';
import { MAP_VIEWPORT_PIN_LIMIT } from '@/lib/constants/mapReports';
import { clampMapViewportToVietnam } from '@/lib/constants/vietnamMapBounds';

export type MapViewportParams = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  limit?: number;
  mode?: MapReportsMode;
  gridLevel?: number;
  categoryId?: string;
};

export type MapSummaryParams = MapViewportParams & {
  days?: number;
};

export const mapKeys = {
  all: ['map'] as const,
  reports: () => [...mapKeys.all, 'reports'] as const,
  reportViewport: (params: MapReportsQueryParams) => [...mapKeys.reports(), params] as const,
  summary: () => [...mapKeys.all, 'summary'] as const,
  summaryViewport: (params: MapSummaryQueryParams) => [...mapKeys.summary(), params] as const,
  wardBoundaryFeature: (url: string, wardCode: string) =>
    [...mapKeys.all, 'ward-boundary-feature', url, wardCode] as const,
};

/**
 * File tại `boundaryUrl` là 1 FeatureCollection CHỨA NHIỀU WARD gộp theo vùng (giảm số file CDN) —
 * phải fetch rồi tìm đúng feature theo `properties.ma_xa === wardCode`, không dùng cả file làm polygon.
 * Field thật của dataset là `ma_xa` (đã verify từ CDN thật) — KHÔNG phải `code` như ví dụ minh hoạ
 * trong guide BE (`docs/leo-ward-boundary-fe-guide.md`), field đó không khớp dữ liệu thật.
 *
 * Fetch qua `/api/ward-boundary` (Route Handler proxy) — không gọi thẳng CDN từ browser vì
 * CloudFront không set CORS header (`Access-Control-Allow-Origin`), fetch trực tiếp bị chặn.
 */
async function fetchWardFeatureFromBoundaryUrl(
  url: string,
  wardCode: string
): Promise<Feature<Geometry> | null> {
  const res = await fetch(`/api/ward-boundary?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const collection = (await res.json()) as FeatureCollection;
  return (
    collection.features.find(f => {
      const props = f.properties as Record<string, unknown> | null;
      return props?.ma_xa === wardCode || props?.code === wardCode;
    }) ?? null
  );
}

export function useMapReports(params: MapViewportParams | null) {
  const clamped = params
    ? clampMapViewportToVietnam({
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
      })
    : null;

  const queryParams: MapReportsQueryParams | null = clamped
    ? {
        ...clamped,
        limit: params!.limit,
        mode: params!.mode,
        gridLevel: params!.gridLevel,
        categoryId: params!.categoryId,
      }
    : null;

  return useQuery({
    queryKey: queryParams ? mapKeys.reportViewport(queryParams) : [...mapKeys.reports(), 'idle'],
    queryFn: () => {
      if (!queryParams) {
        throw new Error('Map viewport params are missing');
      }
      return fetchMapReports({
        minLat: queryParams.minLat,
        maxLat: queryParams.maxLat,
        minLng: queryParams.minLng,
        maxLng: queryParams.maxLng,
        limit: queryParams.limit ?? MAP_VIEWPORT_PIN_LIMIT,
        mode: queryParams.mode ?? 'detail',
        gridLevel: queryParams.gridLevel,
        categoryId: queryParams.categoryId,
      });
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(queryParams),
    retry: false,
  });
}

/**
 * Feature (Polygon/MultiPolygon) đúng phường của LEO, đã filter khỏi file GeoJSON gộp nhiều ward.
 * `boundaryUrl`/`wardCode` lấy từ `useLeoWardBoundary` (GET /v1/offices/my/ward-boundary).
 */
export function useWardBoundaryFeature(boundaryUrl: string | null, wardCode: string | null) {
  return useQuery({
    queryKey: mapKeys.wardBoundaryFeature(boundaryUrl ?? '', wardCode ?? ''),
    queryFn: () => fetchWardFeatureFromBoundaryUrl(boundaryUrl!, wardCode!),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(boundaryUrl && wardCode),
    retry: false,
  });
}

export function useMapSummary(params: MapSummaryParams | null) {
  const days = params?.days ?? 30;
  const clamped = params
    ? clampMapViewportToVietnam({
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
      })
    : null;

  const queryParams: MapSummaryQueryParams | null = clamped
    ? {
        ...clamped,
        days,
        categoryId: params!.categoryId,
      }
    : null;

  return useQuery({
    queryKey: queryParams ? mapKeys.summaryViewport(queryParams) : [...mapKeys.summary(), 'idle'],
    queryFn: () => {
      if (!queryParams) {
        throw new Error('Map summary params are missing');
      }
      return fetchMapSummary(queryParams);
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(queryParams),
    retry: false,
  });
}
