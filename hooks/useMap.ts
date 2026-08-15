'use client';

import { useQuery } from '@tanstack/react-query';
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
};

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
