'use client';

import {
  assignReport,
  confirmDuplicateReport,
  createInspectionReport,
  dismissDuplicateReport,
  dismissViolationRecurrence,
  dispatchReportToCompany,
  fetchDuplicateCandidates,
  fetchDuplicateCandidateDetail,
  fetchReportDetail,
  fetchReportQueue,
  fetchViolationRecurrenceCandidates,
  fetchViolationRecurrenceComparison,
  rejectReport,
  reassignReport,
  verifyReport,
} from '@/lib/api/services/fetchReport';
import type {
  AssignReportInput,
  ConfirmDuplicateInput,
  CreateInspectionReportInput,
  DispatchToCompanyInput,
  RejectReportInput,
  ReassignReportInput,
  VerifyReportInput,
} from '@/lib/api/services/fetchReport';
import type { DuplicateCandidatesParams } from '@/lib/api/models/duplicateCandidate';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import type { ViolationRecurrenceCandidatesParams } from '@/lib/api/models/violationRecurrenceCandidate';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

type IdempotentVars<TBody> = {
  reportId: string;
  body: TBody;
  idempotencyKey?: string;
};

// ── Query key factory ─────────────────────────────────────────────────────────

/**
 * Hash ngắn cho `search` — cache identity không chứa chuỗi tìm kiếm thô (PII risk).
 * `queryFn` vẫn nhận full `params.search`.
 */
function stableSearchKey(search: string | undefined): string | undefined {
  const s = search?.trim();
  if (!s) return undefined;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `s${(h >>> 0).toString(36)}_l${s.length}`;
}

/** Tách `search` khỏi key; phần còn lại serializable an toàn hơn. */
function queueListKeyParts(params: ReportQueueParams) {
  const { search, ...safe } = params;
  return [safe, stableSearchKey(search)] as const;
}

export const officerKeys = {
  all: ['officer'] as const,
  details: () => [...officerKeys.all, 'detail'] as const,
  detail: (id: string) => [...officerKeys.details(), id] as const,
  queue: () => [...officerKeys.all, 'queue'] as const,
  queueList: (params: ReportQueueParams) =>
    [...officerKeys.queue(), ...queueListKeyParts(params)] as const,
  /** Danh sách nghi trùng lặp — BR-REP-031 */
  duplicateCandidates: () => [...officerKeys.all, 'duplicate-candidates'] as const,
  duplicateCandidatesList: (params: DuplicateCandidatesParams) =>
    [...officerKeys.duplicateCandidates(), params] as const,
  /** Chi tiết so sánh nghi trùng vs gốc — BR-REP-031/032 */
  duplicateCandidateDetail: (id: string) =>
    [...officerKeys.all, 'duplicate-candidate-detail', id] as const,
  /** Danh sách nghi tái phạm — BR-REP-034 */
  violationRecurrenceCandidates: () =>
    [...officerKeys.all, 'violation-recurrence-candidates'] as const,
  violationRecurrenceCandidatesList: (params: ViolationRecurrenceCandidatesParams) =>
    [...officerKeys.violationRecurrenceCandidates(), params] as const,
  /** So sánh tái phát — BR-REP-034 */
  violationRecurrenceComparison: (id: string) =>
    [...officerKeys.all, 'violation-recurrence-comparison', id] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

/** Tab Phân công — BE chỉ nhận một `status`/request nên gọi song song rồi gộp. */
const ASSIGN_QUEUE_STATUSES = [
  'Verified',
  'Rejected',
] as const satisfies readonly ReportQueueStatus[];

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
 * GET /v1/reports/duplicate-candidates — [LEO/DEO] báo cáo nghi trùng lặp (BR-REP-031).
 * Kèm báo cáo gốc (`primary`) để so sánh gộp/bác bỏ.
 */
export function useDuplicateCandidates(
  params: DuplicateCandidatesParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: officerKeys.duplicateCandidatesList(params),
    queryFn: () => fetchDuplicateCandidates(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * GET /v1/reports/{id}/duplicate-candidate-detail — BR-REP-031/032.
 * `id` = báo cáo nghi trùng; kết quả gồm `report` + `primaryReport` (gốc).
 */
export function useDuplicateCandidateDetail(reportId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: officerKeys.duplicateCandidateDetail(reportId),
    queryFn: () => fetchDuplicateCandidateDetail(reportId),
    staleTime: LIST_STALE_MS,
    enabled: (options?.enabled ?? true) && Boolean(reportId),
  });
}

/**
 * GET /v1/reports/violation-recurrence-candidates — [LEO/DEO] báo cáo nghi tái phạm (BR-REP-034).
 * Kèm prior Closed (+ media 2 bên) để so sánh mở thanh tra / bác bỏ.
 */
export function useViolationRecurrenceCandidates(
  params: ViolationRecurrenceCandidatesParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: officerKeys.violationRecurrenceCandidatesList(params),
    queryFn: () => fetchViolationRecurrenceCandidates(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

const LOCATE_QUEUE_PAGE_BATCH = 5;

/**
 * Tìm `page` chứa `reportId` trong GET /v1/reports/queue (cùng filter/sort).
 * Dùng `queryClient.fetchQuery` để share cache với `useReportQueue`.
 */
export async function locateReportInQueuePage(
  queryClient: QueryClient,
  reportId: string,
  params: Omit<ReportQueueParams, 'page'>
): Promise<number | null> {
  const pageSize = params.pageSize ?? 10;

  const fetchPage = (page: number) => {
    const pageParams = { ...params, page, pageSize };
    return queryClient.fetchQuery({
      queryKey: officerKeys.queueList(pageParams),
      queryFn: () => fetchReportQueue(pageParams),
      staleTime: LIST_STALE_MS,
    });
  };

  const firstEnv = await fetchPage(1);
  const first = firstEnv.data;
  if (!first) return null;
  if (first.items.some(item => item.id === reportId)) return 1;

  const totalPages = Math.max(1, first.pagination.totalPages);
  for (let start = 2; start <= totalPages; start += LOCATE_QUEUE_PAGE_BATCH) {
    const pages = Array.from(
      { length: Math.min(LOCATE_QUEUE_PAGE_BATCH, totalPages - start + 1) },
      (_, i) => start + i
    );
    const results = await Promise.all(pages.map(page => fetchPage(page)));
    for (let i = 0; i < results.length; i++) {
      const items = results[i]?.data?.items;
      if (items?.some(item => item.id === reportId)) return pages[i] ?? null;
    }
  }
  return null;
}

/**
 * Phân công — gộp báo cáo `Verified` + `Rejected` từ GET /v1/reports/queue.
 * Gọi 2 request song song, merge và sort `createdAt` mới nhất trước (khớp BE sortDir Desc).
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
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
    mutationFn: ({ reportId, body, idempotencyKey }: IdempotentVars<DispatchToCompanyInput>) =>
      dispatchReportToCompany(reportId, body, { idempotencyKey }),
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
    mutationFn: ({ reportId, body, idempotencyKey }: IdempotentVars<AssignReportInput>) =>
      assignReport(reportId, body, { idempotencyKey }),
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
    mutationFn: ({ reportId, body, idempotencyKey }: IdempotentVars<VerifyReportInput>) =>
      verifyReport(reportId, body, { idempotencyKey }),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/** PUT /v1/reports/{id}/reject — LEO từ chối báo cáo (Submitted → Rejected). */
export function useRejectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: RejectReportInput }) =>
      rejectReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/** POST /v1/reports/{id}/confirm-duplicate — BR-REP-032 xác nhận & gộp trùng. */
export function useConfirmDuplicateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: ConfirmDuplicateInput }) =>
      confirmDuplicateReport(reportId, body),
    onSuccess: (_data, { reportId, body }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(body.primaryReportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidateDetail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidates() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/** POST /v1/reports/{id}/dismiss-duplicate — BR-REP-031 bác bỏ nghi trùng. */
export function useDismissDuplicateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId }: { reportId: string }) => dismissDuplicateReport(reportId),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidateDetail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.duplicateCandidates() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/**
 * GET /v1/reports/{id}/violation-recurrence-comparison — BR-REP-034.
 * `id` = báo cáo hiện tại (cờ `isSuspectedViolationRecurrence`).
 */
export function useViolationRecurrenceComparison(
  reportId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: officerKeys.violationRecurrenceComparison(reportId),
    queryFn: () => fetchViolationRecurrenceComparison(reportId),
    staleTime: LIST_STALE_MS,
    enabled: (options?.enabled ?? true) && Boolean(reportId),
  });
}

/** POST /v1/reports/{id}/dismiss-violation-recurrence — BR-REP-034 bác bỏ nghi tái phát. */
export function useDismissViolationRecurrence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId }: { reportId: string }) => dismissViolationRecurrence(reportId),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({
        queryKey: officerKeys.violationRecurrenceComparison(reportId),
      });
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceCandidates() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/**
 * POST /v1/reports/{id}/inspections — [LEO] lập hồ sơ xử phạt nháp
 * (BR-INS-001, BR-OFF-005). `assignedTeamId` bắt buộc.
 */
export function useCreateInspectionReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: CreateInspectionReportInput }) =>
      createInspectionReport(reportId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({
        queryKey: officerKeys.violationRecurrenceComparison(reportId),
      });
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceCandidates() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}
