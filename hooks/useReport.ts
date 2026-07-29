'use client';

import { fetchReportDetail, fetchReportProgress } from '@/lib/api/services/fetchReport';
import { useQuery } from '@tanstack/react-query';

/** Query keys — report detail + progress (LEO tracking). */
export const reportKeys = {
  all: ['reports'] as const,
  detail: (id: string) => [...reportKeys.all, 'detail', id] as const,
  progress: (id: string) => [...reportKeys.all, 'progress', id] as const,
};

const DETAIL_STALE_MS = 3 * 60 * 1000;
const PROGRESS_STALE_MS = 3 * 60 * 1000;

/** GET /v1/reports/{id} — chi tiết báo cáo (lat/lng, media gốc, …). */
export function useReportDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => fetchReportDetail(id),
    staleTime: DETAIL_STALE_MS,
    enabled: options?.enabled ?? Boolean(id),
  });
}

/** GET /v1/reports/{id}/progress — tiến trình xử lý báo cáo [LEO]. */
export function useReportProgress(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.progress(id),
    queryFn: () => fetchReportProgress(id),
    staleTime: PROGRESS_STALE_MS,
    enabled: options?.enabled ?? Boolean(id),
  });
}
