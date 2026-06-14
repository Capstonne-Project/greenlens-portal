'use client';

import {
  assignReport,
  dispatchReport,
  fetchReportDetail,
  fetchReportQueue,
  reassignReport,
  rejectReport,
  verifyReport,
} from '@/lib/api/services/fetchReport';
import type {
  AssignReportInput,
  DispatchReportInput,
  ReassignReportInput,
  RejectReportInput,
  VerifyReportInput,
} from '@/lib/api/services/fetchReport';
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

/** DEO phân công xuống VP — Verified → Dispatched. */
export function useDispatchReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: DispatchReportInput }) =>
      dispatchReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.queues() });
    },
  });
}

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
