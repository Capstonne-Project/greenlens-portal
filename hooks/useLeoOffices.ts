'use client';

import { fetchLeoMyReports } from '@/lib/api/services/fetchOffice';
import type { LeoMyReportsParams } from '@/lib/api/models/office';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const leoOfficesKeys = {
  all: ['officer', 'leo'] as const,
  myReports: () => [...leoOfficesKeys.all, 'my-reports'] as const,
  reportsList: (params: LeoMyReportsParams) => [...leoOfficesKeys.myReports(), params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

/**
 * GET /v1/offices/my/reports — LEO màn theo dõi báo cáo trong LocalOffice.
 * Trả về `LeoMyReportsData` (kèm `localOfficeName`, `wardName`, `assignments[]`).
 */
export function useLeoMyReports(params: LeoMyReportsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: leoOfficesKeys.reportsList(params),
    queryFn: () => fetchLeoMyReports(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}
