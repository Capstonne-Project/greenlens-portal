'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchMapReports,
  type MapReportsMode,
  type MapReportsQueryParams,
} from '@/lib/api/services/fetchMap';

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

export const mapKeys = {
  all: ['map'] as const,
  reports: () => [...mapKeys.all, 'reports'] as const,
  reportViewport: (params: MapReportsQueryParams) => [...mapKeys.reports(), params] as const,
};

export function useMapReports(params: MapViewportParams | null) {
  return useQuery({
    queryKey: params
      ? mapKeys.reportViewport({
          minLat: params.minLat,
          maxLat: params.maxLat,
          minLng: params.minLng,
          maxLng: params.maxLng,
          limit: params.limit,
          mode: params.mode,
          gridLevel: params.gridLevel,
          categoryId: params.categoryId,
        })
      : [...mapKeys.reports(), 'idle'],
    queryFn: () => {
      if (!params) {
        throw new Error('Map viewport params are missing');
      }
      return fetchMapReports({
        minLat: params.minLat,
        maxLat: params.maxLat,
        minLng: params.minLng,
        maxLng: params.maxLng,
        limit: params.limit ?? 1000,
        mode: params.mode ?? 'detail',
        gridLevel: params.gridLevel,
        categoryId: params.categoryId,
      });
    },
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(params),
    retry: false,
  });
}
