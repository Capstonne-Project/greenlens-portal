'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchMapReports,
  fetchMapSummary,
  fetchPublicMapReports,
  fetchPublicMapSummary,
  type MapReportsMode,
  type MapReportsQueryParams,
  type MapSummaryQueryParams,
  type PublicMapReportsQueryParams,
  type PublicMapSummaryQueryParams,
} from '@/lib/api/services/fetchMap';
import {
  MAP_VIEWPORT_PIN_LIMIT,
  PUBLIC_MAP_AGGREGATE_CELL_LIMIT,
  PUBLIC_MAP_DETAIL_PIN_LIMIT,
  publicMapModeForZoom,
} from '@/lib/constants/mapReports';
import type { PublicMapPresence } from '@/lib/constants/reportStatus';
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

export type PublicMapViewportParams = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  zoom: number;
  presence?: PublicMapPresence;
  mode?: MapReportsMode;
  limit?: number;
  categoryId?: string;
  severity?: string;
  provinceCode?: string;
  from?: string;
  to?: string;
};

export type PublicMapSummaryParams = Pick<
  PublicMapViewportParams,
  'minLat' | 'maxLat' | 'minLng' | 'maxLng' | 'presence' | 'categoryId' | 'provinceCode'
> & {
  days?: number;
};

export const mapKeys = {
  all: ['map'] as const,
  reports: () => [...mapKeys.all, 'reports'] as const,
  reportViewport: (params: MapReportsQueryParams) => [...mapKeys.reports(), params] as const,
  summary: () => [...mapKeys.all, 'summary'] as const,
  summaryViewport: (params: MapSummaryQueryParams) => [...mapKeys.summary(), params] as const,
};

export const publicMapKeys = {
  all: ['public-map'] as const,
  reports: () => [...publicMapKeys.all, 'reports'] as const,
  reportViewport: (params: PublicMapReportsQueryParams) =>
    [...publicMapKeys.reports(), params] as const,
  summary: () => [...publicMapKeys.all, 'summary'] as const,
  summaryViewport: (params: PublicMapSummaryQueryParams) =>
    [...publicMapKeys.summary(), params] as const,
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

export function usePublicMapReports(params: PublicMapViewportParams | null) {
  const clamped = params
    ? clampMapViewportToVietnam({
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
      })
    : null;

  const mode = params ? (params.mode ?? publicMapModeForZoom(params.zoom)) : 'detail';
  const limit =
    params?.limit ??
    (mode === 'aggregate' ? PUBLIC_MAP_AGGREGATE_CELL_LIMIT : PUBLIC_MAP_DETAIL_PIN_LIMIT);

  const queryParams: PublicMapReportsQueryParams | null =
    clamped && params
      ? {
          ...clamped,
          zoom: params.zoom,
          presence: params.presence ?? 'active',
          mode,
          limit,
          categoryId: params.categoryId,
          severity: params.severity,
          provinceCode: params.provinceCode,
          from: params.from,
          to: params.to,
        }
      : null;

  return useQuery({
    queryKey: queryParams
      ? publicMapKeys.reportViewport(queryParams)
      : [...publicMapKeys.reports(), 'idle'],
    queryFn: () => {
      if (!queryParams) {
        throw new Error('Public map viewport params are missing');
      }
      return fetchPublicMapReports(queryParams);
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(queryParams),
    retry: false,
  });
}

export function usePublicMapSummary(params: PublicMapSummaryParams | null) {
  const days = params?.days ?? 30;
  const clamped = params
    ? clampMapViewportToVietnam({
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
      })
    : null;

  const queryParams: PublicMapSummaryQueryParams | null = clamped
    ? {
        ...clamped,
        days,
        presence: params!.presence ?? 'active',
        categoryId: params!.categoryId,
        provinceCode: params!.provinceCode,
      }
    : null;

  return useQuery({
    queryKey: queryParams
      ? publicMapKeys.summaryViewport(queryParams)
      : [...publicMapKeys.summary(), 'idle'],
    queryFn: () => {
      if (!queryParams) {
        throw new Error('Public map summary params are missing');
      }
      return fetchPublicMapSummary(queryParams);
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(queryParams),
    retry: false,
  });
}
