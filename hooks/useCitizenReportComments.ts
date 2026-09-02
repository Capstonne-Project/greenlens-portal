'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCitizenReportComments } from '@/lib/api/services/fetchCitizenReportComment';

export const citizenReportCommentKeys = {
  all: ['citizen-report-comments'] as const,
  list: (reportId: string) => [...citizenReportCommentKeys.all, reportId] as const,
};

const STALE_MS = 60 * 1000;

/** Danh sách bình luận công khai của 1 report — chỉ gọi khi dialog chi tiết đang mở (`enabled`). */
export function useCitizenReportComments(reportId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: citizenReportCommentKeys.list(reportId ?? ''),
    queryFn: () => fetchCitizenReportComments({ reportId: reportId!, page: 1, pageSize: 20 }),
    select: envelope => envelope.data,
    staleTime: STALE_MS,
    enabled: Boolean(reportId) && (options?.enabled ?? true),
    retry: false,
  });
}
