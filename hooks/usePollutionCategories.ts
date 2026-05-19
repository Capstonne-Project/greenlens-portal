'use client';

import { fetchAdminReports } from '@/lib/api/services/fetchAdminReports';
import {
  archivePollutionCategory,
  createPollutionCategory,
  deletePollutionCategory,
  fetchAdminPollutionCategories,
  fetchCatalogPollutionCategories,
  updatePollutionCategory,
  type AdminPollutionCategoriesParams,
} from '@/lib/api/services/fetchPollutionCategory';
import type {
  ArchivePollutionCategoryInput,
  CreatePollutionCategoryInput,
  UpdatePollutionCategoryInput,
} from '@/lib/api/models/pollutionCategory';
import { ADMIN_REPORTS_AGGREGATE_PAGE_SIZE } from '@/lib/constants/pollutionCategories';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export const pollutionCategoryKeys = {
  all: ['admin', 'pollution-categories'] as const,
  list: (params?: AdminPollutionCategoriesParams) =>
    [...pollutionCategoryKeys.all, 'list', params ?? {}] as const,
  catalog: () => [...pollutionCategoryKeys.all, 'catalog'] as const,
  reportCounts: () => [...pollutionCategoryKeys.all, 'report-counts'] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

export function useAdminPollutionCategoriesList(params?: AdminPollutionCategoriesParams) {
  return useQuery({
    queryKey: pollutionCategoryKeys.list(params),
    queryFn: () => fetchAdminPollutionCategories(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

/** Catalog công khai — dropdown báo cáo (chỉ active). */
export function useCatalogPollutionCategories(enabled = true) {
  return useQuery({
    queryKey: pollutionCategoryKeys.catalog(),
    queryFn: () => fetchCatalogPollutionCategories(),
    select: envelope => envelope.data.items,
    staleTime: CATALOG_STALE_MS,
    enabled,
  });
}

export function usePollutionCategoryReportCounts(enabled = true) {
  return useQuery({
    queryKey: pollutionCategoryKeys.reportCounts(),
    queryFn: async () => {
      const envelope = await fetchAdminReports({
        page: 1,
        pageSize: ADMIN_REPORTS_AGGREGATE_PAGE_SIZE,
      });
      const byCode: Record<string, number> = {};
      const byId: Record<string, number> = {};
      for (const report of envelope.data.items) {
        byCode[report.categoryCode] = (byCode[report.categoryCode] ?? 0) + 1;
      }
      return { byCode, byId, total: envelope.data.pagination.totalItems };
    },
    staleTime: LIST_STALE_MS,
    enabled,
  });
}

export function usePollutionCategoriesWithCounts(params?: AdminPollutionCategoriesParams) {
  const listQuery = useAdminPollutionCategoriesList(params);
  const countsQuery = usePollutionCategoryReportCounts(listQuery.isSuccess);

  const items = useMemo(() => {
    const base = listQuery.data?.items ?? [];
    const byCode = countsQuery.data?.byCode ?? {};
    return base.map(item => ({
      ...item,
      reportCount: item.reportCount ?? byCode[item.code] ?? 0,
    }));
  }, [listQuery.data, countsQuery.data]);

  return {
    items,
    isPending: listQuery.isPending,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: () => {
      void listQuery.refetch();
      void countsQuery.refetch();
    },
    totalReports: countsQuery.data?.total ?? null,
  };
}

function useInvalidatePollutionCategories() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: pollutionCategoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
  };
}

export function useCreatePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: (body: CreatePollutionCategoryInput) => createPollutionCategory(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePollutionCategoryInput }) =>
      updatePollutionCategory(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useArchivePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ArchivePollutionCategoryInput }) =>
      archivePollutionCategory(id, body),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePollutionCategory() {
  const invalidate = useInvalidatePollutionCategories();
  return useMutation({
    mutationFn: (id: string) => deletePollutionCategory(id),
    onSuccess: () => invalidate(),
  });
}
