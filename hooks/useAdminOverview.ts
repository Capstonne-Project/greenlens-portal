'use client';

import { fetchPollutionCategories } from '@/lib/api/services/fetchCatalog';
import { fetchAdminAllUsers } from '@/lib/api/services/fetchAdmin';
import { fetchMapReports } from '@/lib/api/services/fetchMap';
import { getAdminOverviewMapBounds } from '@/lib/constants/vietnamMapBounds';
import { buildAdminOverviewSnapshot, type OverviewGrowthRange } from '@/utils/adminOverview';
import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export const adminOverviewKeys = {
  all: ['admin', 'overview'] as const,
  users: () => [...adminOverviewKeys.all, 'users'] as const,
  map: () => [...adminOverviewKeys.all, 'map'] as const,
  catalog: () => [...adminOverviewKeys.all, 'catalog'] as const,
};

const OVERVIEW_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

export function useAdminOverview() {
  const [growthRange, setGrowthRange] = useState<OverviewGrowthRange>('month');

  const [usersQuery, mapQuery, catalogQuery] = useQueries({
    queries: [
      {
        queryKey: adminOverviewKeys.users(),
        queryFn: async () => {
          const started = performance.now();
          const envelope = await fetchAdminAllUsers();
          return {
            items: envelope.data,
            latencyMs: Math.round(performance.now() - started),
          };
        },
        staleTime: OVERVIEW_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.map(),
        queryFn: async () => {
          const started = performance.now();
          const bounds = getAdminOverviewMapBounds();
          const envelope = await fetchMapReports({
            minLat: bounds.minLat,
            maxLat: bounds.maxLat,
            minLng: bounds.minLng,
            maxLng: bounds.maxLng,
            mode: 'detail',
            limit: 500,
          });
          return {
            items: envelope.data.items,
            latencyMs: Math.round(performance.now() - started),
          };
        },
        staleTime: OVERVIEW_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.catalog(),
        queryFn: async () => {
          const started = performance.now();
          const envelope = await fetchPollutionCategories();
          return {
            count: envelope.data.items.length,
            latencyMs: Math.round(performance.now() - started),
          };
        },
        staleTime: CATALOG_STALE_MS,
      },
    ],
  });

  const snapshot = useMemo(() => {
    if (!usersQuery.data || !mapQuery.data || !catalogQuery.data) return null;
    return buildAdminOverviewSnapshot({
      users: usersQuery.data.items,
      reports: mapQuery.data.items,
      categoryCount: catalogQuery.data.count,
      growthRange,
      integrationLatencies: {
        mapMs: mapQuery.data.latencyMs,
        catalogMs: catalogQuery.data.latencyMs,
        usersMs: usersQuery.data.latencyMs,
      },
    });
  }, [usersQuery.data, mapQuery.data, catalogQuery.data, growthRange]);

  const refetch = () => {
    void usersQuery.refetch();
    void mapQuery.refetch();
    void catalogQuery.refetch();
  };

  return {
    growthRange,
    setGrowthRange,
    snapshot,
    isPending: usersQuery.isPending || mapQuery.isPending || catalogQuery.isPending,
    isError: usersQuery.isError || mapQuery.isError || catalogQuery.isError,
    error: usersQuery.error ?? mapQuery.error ?? catalogQuery.error,
    refetch,
  };
}
