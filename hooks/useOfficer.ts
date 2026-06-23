'use client';

import {
  assignReport,
  fetchReportDetail,
  fetchReportQueue,
  reassignReport,
} from '@/lib/api/services/fetchReport';
import type { AssignReportInput, ReassignReportInput } from '@/lib/api/services/fetchReport';
import type { ReportQueueParams } from '@/lib/api/models/report';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Query key factory ─────────────────────────────────────────────────────────

export const officerKeys = {
  all: ['officer'] as const,
  queues: () => [...officerKeys.all, 'queue'] as const,
  queue: (params: ReportQueueParams) => [...officerKeys.queues(), params] as const,
  details: () => [...officerKeys.all, 'detail'] as const,
  detail: (id: string) => [...officerKeys.details(), id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** Officer queue — phân trang; truyền `status` / `excludeStatuses` theo từng màn. */
export function useReportQueue(params: ReportQueueParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: officerKeys.queue(params),
    queryFn: () => fetchReportQueue(params),
    staleTime: 3 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/** Chi tiết một báo cáo — không fetch khi id rỗng. */
export function useReportDetail(id: string) {
  return useQuery({
    queryKey: officerKeys.detail(id),
    queryFn: () => fetchReportDetail(id),
    staleTime: 3 * 60 * 1000,
    enabled: Boolean(id),
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Phân công đội xử lý — Dispatched → Assigned / InProgress (BR-OFF). */
export function useAssignReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: AssignReportInput }) =>
      assignReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.queues() });
    },
  });
}

/** Chuyển giao đội — PUT /reassign (Assigned hoặc thay slot Declined). */
export function useReassignReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: ReassignReportInput }) =>
      reassignReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.queues() });
    },
  });
}
