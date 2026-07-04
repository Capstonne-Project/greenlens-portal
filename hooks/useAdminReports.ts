'use client';

import { fetchAdminReportDetail, fetchAdminReports } from '@/lib/api/services/fetchAdminReports';
import { fetchCatalogPollutionCategories } from '@/lib/api/services/fetchPollutionCategory';
import type { AdminReportsList, AdminReportsListParams } from '@/lib/api/models/adminReport';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQuery } from '@tanstack/react-query';

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
