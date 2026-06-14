'use client';

// // import { fetchReportProgress } from '@/lib/api/services/fetchReport';
// import { useQuery } from '@tanstack/react-query';

// const REPORT_STALE_MS = 3 * 60 * 1000;

/** Query keys — GET /v1/reports/{id}/progress (LEO tracking detail). */
export const reportKeys = {
  all: ['reports'] as const,
  progress: (id: string) => [...reportKeys.all, 'progress', id] as const,
};

/**
 * GET /v1/reports/{id}/progress — [LEO] tiến trình xử lý báo cáo.
 * Chi tiết / verify / reject dùng `hooks/useOfficer.ts`.
 */
// export function useReportProgress(reportId: string, options?: { enabled?: boolean }) {
//   return useQuery({
//     queryKey: reportKeys.progress(reportId),
//     queryFn: () => fetchReportProgress(reportId),
//     staleTime: REPORT_STALE_MS,
//     enabled: (options?.enabled ?? true) && Boolean(reportId),
//   });
// }
