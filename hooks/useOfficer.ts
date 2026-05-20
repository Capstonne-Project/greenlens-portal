'use client';

import {
  assignReport,
  fetchReportDetail,
  fetchReportQueue,
  rejectReport,
  verifyReport,
} from '@/lib/api/services/fetchReport';
import type {
  AssignReportInput,
  RejectReportInput,
  VerifyReportInput,
} from '@/lib/api/services/fetchReport';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Query key factory ─────────────────────────────────────────────────────────

export const officerKeys = {
  all: ['officer'] as const,
  queues: () => [...officerKeys.all, 'queue'] as const,
  queue: (page: number, pageSize: number) => [...officerKeys.queues(), { page, pageSize }] as const,
  details: () => [...officerKeys.all, 'detail'] as const,
  detail: (id: string) => [...officerKeys.details(), id] as const,
};

// ── Queries ───────────────────────────────────────────────────────────────────

interface UseReportQueueParams {
  page: number;
  pageSize: number;
}

/** Danh sách báo cáo chờ xác minh (Officer queue) — phân trang. */
export function useReportQueue({ page, pageSize }: UseReportQueueParams) {
  return useQuery({
    queryKey: officerKeys.queue(page, pageSize),
    queryFn: () => fetchReportQueue({ page, pageSize }),
    staleTime: 3 * 60 * 1000,
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

/** Xác minh báo cáo — Submitted → Verified. Officer quyết định cuối (BR-AI-005). */
export function useVerifyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: VerifyReportInput }) => verifyReport(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: officerKeys.queues() });
    },
  });
}

/** Từ chối báo cáo — Submitted → Rejected. Reason bắt buộc khớp BR-REP. */
export function useRejectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RejectReportInput }) => rejectReport(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: officerKeys.queues() });
    },
  });
}

/** Phân công đội xử lý — Verified → InProgress (BR-OFF). */
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
