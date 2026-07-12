'use client';

import {
  fetchAdminReportDetail,
  fetchAdminReports,
  hideAdminReport,
  unhideAdminReport,
} from '@/lib/api/services/fetchAdminReports';
import { fetchCatalogPollutionCategories } from '@/lib/api/services/fetchPollutionCategory';
import type {
  AdminReportDetail,
  AdminReportsList,
  AdminReportsListParams,
  HideAdminReportInput,
} from '@/lib/api/models/adminReport';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { markAdminReportHidden, markAdminReportVisible } from '@/lib/storage/adminHiddenReports';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminReportKeys = {
  all: ['admin', 'reports'] as const,
  list: (params: AdminReportsListParams) => [...adminReportKeys.all, 'list', params] as const,
  detail: (id: string) => [...adminReportKeys.all, 'detail', id] as const,
  count: () => [...adminReportKeys.all, 'count'] as const,
  categories: () => [...adminReportKeys.all, 'categories'] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;
const CATALOG_STALE_MS = 10 * 60 * 1000;

export function useAdminReportsList(params: AdminReportsListParams) {
  return useQuery({
    queryKey: adminReportKeys.list(params),
    queryFn: () => fetchAdminReports(params),
    select: (envelope: ApiEnvelope<AdminReportsList>) => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useAdminReportsTotal() {
  return useQuery({
    queryKey: adminReportKeys.count(),
    queryFn: () => fetchAdminReports({ page: 1, pageSize: 1 }),
    select: (envelope: ApiEnvelope<AdminReportsList>) => envelope.data.pagination.totalItems,
    staleTime: LIST_STALE_MS,
  });
}

export function useAdminReportDetail(id: string | null) {
  return useQuery({
    queryKey: adminReportKeys.detail(id ?? ''),
    queryFn: () => fetchAdminReportDetail(id!),
    select: envelope => envelope.data,
    enabled: Boolean(id),
    staleTime: DETAIL_STALE_MS,
    /** Giữ bản đã cache khi refetch lỗi (vd. BE 404 sau hide). */
    placeholderData: keepPreviousData,
  });
}

function patchReportHiddenInCache(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  isHidden: boolean
) {
  qc.setQueryData<ApiEnvelope<AdminReportDetail>>(adminReportKeys.detail(id), old => {
    if (!old?.data) return old;
    return { ...old, data: { ...old.data, isHidden } };
  });

  qc.setQueriesData<ApiEnvelope<AdminReportsList>>(
    { queryKey: [...adminReportKeys.all, 'list'] },
    old => {
      if (!old?.data?.items) return old;
      return {
        ...old,
        data: {
          ...old.data,
          items: old.data.items.map(item => (item.id === id ? { ...item, isHidden } : item)),
        },
      };
    }
  );
}

export function useHideAdminReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: HideAdminReportInput }) =>
      hideAdminReport(id, body),
    onSuccess: (_env, { id }) => {
      markAdminReportHidden(id);
      patchReportHiddenInCache(qc, id, true);
      // Chỉ làm mới list/count — không invalidate detail (tránh 404 → màn lỗi).
      void qc.invalidateQueries({ queryKey: [...adminReportKeys.all, 'list'] });
      void qc.invalidateQueries({ queryKey: adminReportKeys.count() });
    },
  });
}

export function useUnhideAdminReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unhideAdminReport(id),
    onSuccess: (_env, id) => {
      markAdminReportVisible(id);
      patchReportHiddenInCache(qc, id, false);
      void qc.invalidateQueries({ queryKey: [...adminReportKeys.all, 'list'] });
      void qc.invalidateQueries({ queryKey: adminReportKeys.count() });
      void qc.invalidateQueries({ queryKey: adminReportKeys.detail(id) });
    },
  });
}

/** @deprecated Dùng `useCatalogPollutionCategories` từ `@/hooks/usePollutionCategories` */
export function usePollutionCategories() {
  return useQuery({
    queryKey: adminReportKeys.categories(),
    queryFn: () => fetchCatalogPollutionCategories(),
    select: envelope =>
      envelope.data.items.map(item => ({
        id: item.id,
        code: item.code,
        nameVi: item.nameVi,
        nameEn: item.nameEn,
        iconUrl: item.iconUrl,
      })),
    staleTime: CATALOG_STALE_MS,
  });
}
