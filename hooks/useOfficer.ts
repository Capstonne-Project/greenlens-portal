'use client';

import {
  assignReport,
  dispatchReportToCompany,
  fetchReportDetail,
  fetchReportQueue,
  reassignReport,
  verifyReport,
} from '@/lib/api/services/fetchReport';
import type {
  AssignReportInput,
  DispatchToCompanyInput,
  ReassignReportInput,
  VerifyReportInput,
} from '@/lib/api/services/fetchReport';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import type { ReportStatus } from '@/lib/constants/reportStatus';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

// ── Query key factory ─────────────────────────────────────────────────────────

export const officerKeys = {
  all: ['officer'] as const,
  details: () => [...officerKeys.all, 'detail'] as const,
  detail: (id: string) => [...officerKeys.details(), id] as const,
  queue: () => [...officerKeys.all, 'queue'] as const,
  queueList: (params: ReportQueueParams) => [...officerKeys.queue(), params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

/** Tab Phân công — BE chỉ nhận một `status`/request nên gọi song song rồi gộp. */
const ASSIGN_QUEUE_STATUSES = ['Verified', 'Rejected'] as const satisfies readonly ReportStatus[];

type AssignReportQueueParams = Omit<ReportQueueParams, 'status'>;

/** Chi tiết một báo cáo — không fetch khi id rỗng. */
export function useReportDetail(id: string) {
  return useQuery({
    queryKey: officerKeys.detail(id),
    queryFn: () => fetchReportDetail(id),
    staleTime: 3 * 60 * 1000,
    enabled: Boolean(id),
  });
}

/** GET /v1/reports/queue — hàng đợi báo cáo [LEO/DEO]. */
export function useReportQueue(params: ReportQueueParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: officerKeys.queueList(params),
    queryFn: () => fetchReportQueue(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Phân công — gộp báo cáo `Verified` + `Rejected` từ GET /v1/reports/queue.
 * Gọi 2 request song song, merge và sort `priorityScore` giảm dần.
 */
export function useAssignReportQueue(
  params: AssignReportQueueParams,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  const queries = useQueries({
    queries: ASSIGN_QUEUE_STATUSES.map(status => ({
      queryKey: officerKeys.queueList({ ...params, status }),
      queryFn: () => fetchReportQueue({ ...params, status }),
      staleTime: LIST_STALE_MS,
      placeholderData: keepPreviousData,
      enabled,
    })),
  });

  const data = useMemo((): ReportQueueData | undefined => {
    const payloads = queries.map(q => q.data?.data).filter(Boolean) as ReportQueueData[];
    if (payloads.length === 0) return undefined;

    const items = payloads
      .flatMap(p => p.items)
      .sort((a, b) => b.priorityScore - a.priorityScore || b.createdAt.localeCompare(a.createdAt));

    const totalItems = payloads.reduce((sum, p) => sum + p.pagination.totalItems, 0);
    const totalPages = Math.max(1, ...payloads.map(p => p.pagination.totalPages));
    const page = params.page ?? 1;

    return {
      items,
      pagination: {
        page,
        pageSize: params.pageSize ?? 10,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }, [queries, params.page, params.pageSize]);

  return {
    data,
    isPending: queries.some(q => q.isPending),
    isFetching: queries.some(q => q.isFetching),
    isError: queries.some(q => q.isError),
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/** POST /v1/reports/{id}/dispatch-to-company — LEO điều phối task đến công ty DVMT. */
export function useDispatchReportToCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: DispatchToCompanyInput }) =>
      dispatchReportToCompany(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/** Phân công đội xử lý — POST /assign (Verified → InProgress). */
export function useAssignReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: AssignReportInput }) =>
      assignReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
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
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/** PUT /v1/reports/{id}/verify — LEO xác minh báo cáo (Submitted → Verified). */
export function useVerifyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: VerifyReportInput }) =>
      verifyReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}
