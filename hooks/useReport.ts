'use client';

import { fetchReportProgress } from '@/lib/api/services/fetchReport';
import { useQuery } from '@tanstack/react-query';

/** Query keys — GET /v1/reports/{id}/progress (LEO tracking detail). */
export const reportKeys = {
  all: ['reports'] as const,
  progress: (id: string) => [...reportKeys.all, 'progress', id] as const,
};

const PROGRESS_STALE_MS = 3 * 60 * 1000;

/** GET /v1/reports/{id}/progress — tiến trình xử lý báo cáo [LEO]. */
export function useReportProgress(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.progress(id),
    queryFn: () => fetchReportProgress(id),
    staleTime: PROGRESS_STALE_MS,
    enabled: options?.enabled ?? Boolean(id),
  });
}
