'use client';

import {
  approveReopenRequest,
  assignInspectionTeam,
  assignReport,
  confirmDuplicateReport,
  createInspectionReport,
  dismissDuplicateReport,
  dismissViolationRecurrence,
  dispatchReportToCompany,
  fetchDuplicateCandidates,
  fetchDuplicateCandidateDetail,
  fetchInspectionDetail,
  fetchInspectionOfficerQueue,
  fetchInspectionPayments,
  fetchReportDetail,
  fetchReportInspections,
  fetchReopenRequests,
  fetchReportQueue,
  fetchViolationRecurrenceCandidates,
  fetchViolationRecurrenceComparison,
  recordInspectionPayment,
  rejectReport,
  rejectReopenRequest,
  reassignReport,
  verifyReport,
} from '@/lib/api/services/fetchReport';
import type {
  AssignInspectionTeamInput,
  AssignReportInput,
  ConfirmDuplicateInput,
  CreateInspectionReportInput,
  DispatchToCompanyInput,
  RecordInspectionPaymentInput,
  RejectReportInput,
  RejectReopenRequestInput,
  ReassignReportInput,
  ReopenRequestsParams,
  VerifyReportInput,
} from '@/lib/api/services/fetchReport';
import type { DuplicateCandidatesParams } from '@/lib/api/models/duplicateCandidate';
import type { InspectionOfficerQueueParams } from '@/lib/api/models/inspectionReport';
import type { ReportQueueParams } from '@/lib/api/models/reportQueue';
import type { ViolationRecurrenceCandidatesParams } from '@/lib/api/models/violationRecurrenceCandidate';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';
import { isAbortError } from '@/lib/utils/abortError';
import { useProtectedQueryEnabled } from '@/hooks/useAuthSession';
import { leoOfficesKeys } from '@/hooks/useLeoOffices';
import { reportKeys } from '@/hooks/useReport';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

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
  const { search, status, ...safe } = params;
  const statusKey = status == null ? null : Array.isArray(status) ? [...status].sort() : status;
  return [{ ...safe, status: statusKey }, stableSearchKey(search)] as const;
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
    [...officerKeys.duplicateCandidates(), ...duplicateCandidatesListKeyParts(params)] as const,
  /** Chi tiết so sánh nghi trùng vs gốc — BR-REP-031/032 */
  duplicateCandidateDetail: (id: string) =>
    [...officerKeys.all, 'duplicate-candidate-detail', id] as const,
  /** Danh sách nghi tái phạm — BR-REP-034 */
  violationRecurrenceCandidates: () =>
    [...officerKeys.all, 'violation-recurrence-candidates'] as const,
  violationRecurrenceCandidatesList: (params: ViolationRecurrenceCandidatesParams) =>
    [
      ...officerKeys.violationRecurrenceCandidates(),
      ...violationRecurrenceCandidatesListKeyParts(params),
    ] as const,
  /** So sánh tái phát — BR-REP-034 */
  violationRecurrenceComparison: (id: string) =>
    [...officerKeys.all, 'violation-recurrence-comparison', id] as const,
  /** GET /v1/reports/{id}/inspections — hồ sơ xử phạt theo báo cáo */
  reportInspections: (reportId: string) =>
    [...officerKeys.all, 'report-inspections', reportId] as const,
  /** GET /v1/inspections/{id} — chi tiết hồ sơ xử phạt */
  inspectionDetail: (id: string) => [...officerKeys.all, 'inspection-detail', id] as const,
  /** GET /v1/inspections/{id}/payments — lịch sử nộp phạt */
  inspectionPayments: (id: string) => [...officerKeys.all, 'inspection-payments', id] as const,
  /** GET /v1/inspections/officer-queue — hàng đợi hồ sơ xử phạt [LEO/DEO] */
  inspectionOfficerQueue: () => [...officerKeys.all, 'inspection-officer-queue'] as const,
  inspectionOfficerQueueList: (params: InspectionOfficerQueueParams) =>
    [...officerKeys.inspectionOfficerQueue(), ...inspectionQueueListKeyParts(params)] as const,
  /** GET /v1/reports/reopen-requests — yêu cầu mở lại báo cáo [LEO/DEO] */
  reopenRequests: () => [...officerKeys.all, 'reopen-requests'] as const,
  reopenRequestsList: (params: ReopenRequestsParams) =>
    [...officerKeys.reopenRequests(), params] as const,
};

/** Tách `search` khỏi key hàng đợi hồ sơ — tránh PII thô trên queryKey. */
function inspectionQueueListKeyParts(params: InspectionOfficerQueueParams) {
  const { search, ...safe } = params;
  return [safe, stableSearchKey(search)] as const;
}

/** Tách `search` khỏi key nghi trùng lặp — tránh PII thô trên queryKey. */
function duplicateCandidatesListKeyParts(params: DuplicateCandidatesParams) {
  const { search, ...safe } = params;
  return [safe, stableSearchKey(search)] as const;
}

/** Tách `search` khỏi key nghi tái phạm — tránh PII thô trên queryKey. */
function violationRecurrenceCandidatesListKeyParts(params: ViolationRecurrenceCandidatesParams) {
  const { search, ...safe } = params;
  return [safe, stableSearchKey(search)] as const;
}

const LIST_STALE_MS = 3 * 60 * 1000;
/** Chi tiết inspection có thể bị Inspector đổi status ở app mobile bất kỳ lúc nào — cần stale ngắn hơn query dạng list. */
const INSPECTION_DETAIL_STALE_MS = 15 * 1000;

/**
 * Tab Phân công — GET /v1/reports/queue multi-status:
 * `?status=Verified&status=Reopened` (sau duyệt mở lại vẫn vào hàng đợi phân công).
 * Không gồm `Rejected` — từ chối không vào hàng đợi phân công.
 */
export const ASSIGN_QUEUE_STATUSES = [
  'Verified',
  'Reopened',
] as const satisfies readonly ReportQueueStatus[];

/** Tra cứu `/officer/reports` — Closed / Rejected (không gồm Resolved). */
export const LOOKUP_QUEUE_STATUSES = [
  'Closed',
  'Rejected',
] as const satisfies readonly ReportQueueStatus[];

export type LookupQueueStatus = (typeof LOOKUP_QUEUE_STATUSES)[number];

type AssignReportQueueParams = Omit<ReportQueueParams, 'status'>;
type LookupReportQueueParams = Omit<ReportQueueParams, 'status'> & {
  /** `all` = multi Closed+Rejected một request; hoặc 1 status. */
  status?: LookupQueueStatus | 'all';
};

/** Chi tiết một báo cáo — không fetch khi id rỗng. */
export function useReportDetail(id: string) {
  const canFetch = useProtectedQueryEnabled(Boolean(id));
  return useQuery({
    queryKey: officerKeys.detail(id),
    queryFn: () => fetchReportDetail(id),
    staleTime: 3 * 60 * 1000,
    enabled: canFetch,
  });
}

/** GET /v1/reports/queue — hàng đợi báo cáo [LEO/DEO]. */
export function useReportQueue(params: ReportQueueParams, options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerKeys.queueList(params),
    queryFn: () => fetchReportQueue(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
  });
}

/** GET /v1/reports/reopen-requests — [LEO/DEO] danh sách yêu cầu mở lại báo cáo. */
export function useReopenRequests(params: ReopenRequestsParams, options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerKeys.reopenRequestsList(params),
    queryFn: () => fetchReopenRequests(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
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
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerKeys.duplicateCandidatesList(params),
    queryFn: () => fetchDuplicateCandidates(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
  });
}

/**
 * GET /v1/reports/{id}/duplicate-candidate-detail — BR-REP-031/032.
 * `id` = báo cáo nghi trùng; kết quả gồm `report` + `primaryReport` (gốc).
 */
export function useDuplicateCandidateDetail(reportId: string, options?: { enabled?: boolean }) {
  const canFetch = useProtectedQueryEnabled((options?.enabled ?? true) && Boolean(reportId));
  return useQuery({
    queryKey: officerKeys.duplicateCandidateDetail(reportId),
    queryFn: () => fetchDuplicateCandidateDetail(reportId),
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
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
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerKeys.violationRecurrenceCandidatesList(params),
    queryFn: () => fetchViolationRecurrenceCandidates(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
  });
}

/**
 * GET /v1/inspections/officer-queue — [LEO/DEO] hàng đợi hồ sơ xử phạt.
 * Filter: status, team, unassigned, SLA, date range, search.
 */
export function useInspectionOfficerQueue(
  params: InspectionOfficerQueueParams,
  options?: { enabled?: boolean }
) {
  const canFetch = useProtectedQueryEnabled(options?.enabled ?? true);
  return useQuery({
    queryKey: officerKeys.inspectionOfficerQueueList(params),
    queryFn: () => fetchInspectionOfficerQueue(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    enabled: canFetch,
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

  const fetchPage = async (page: number) => {
    try {
      const pageParams = { ...params, page, pageSize };
      return await queryClient.fetchQuery({
        queryKey: officerKeys.queueList(pageParams),
        queryFn: () => fetchReportQueue(pageParams),
        staleTime: LIST_STALE_MS,
      });
    } catch (error) {
      if (isAbortError(error)) return null;
      throw error;
    }
  };

  const firstEnv = await fetchPage(1);
  if (!firstEnv) return null;
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
      const env = results[i];
      if (!env) continue;
      const items = env.data?.items;
      if (items?.some(item => item.id === reportId)) return pages[i] ?? null;
    }
  }
  return null;
}

/**
 * Phân công — GET /v1/reports/queue với multi-status `Verified` + `Reopened`
 * (`?status=Verified&status=Reopened`). Pagination lấy trực tiếp từ BE.
 */
export function useAssignReportQueue(
  params: AssignReportQueueParams,
  options?: { enabled?: boolean }
) {
  return useReportQueue(
    { ...params, status: ASSIGN_QUEUE_STATUSES },
    { enabled: options?.enabled ?? true }
  );
}

/**
 * Tra cứu báo cáo kết thúc — `Closed` | `Rejected` từ GET /v1/reports/queue.
 * `status: 'all'` (mặc định): multi `?status=Closed&status=Rejected`.
 * Một status cụ thể: một request (reuse cache `officerKeys.queueList`).
 */
export function useLookupReportQueue(
  params: LookupReportQueueParams,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const { status = 'all', ...rest } = params;
  const singleStatus = status !== 'all' ? status : null;

  const singleQuery = useReportQueue(
    { ...rest, status: singleStatus ?? 'Closed' },
    { enabled: enabled && Boolean(singleStatus) }
  );

  const multiQuery = useReportQueue(
    { ...rest, status: LOOKUP_QUEUE_STATUSES },
    { enabled: enabled && !singleStatus }
  );

  if (singleStatus) {
    return {
      data: singleQuery.data,
      isPending: singleQuery.isPending,
      isFetching: singleQuery.isFetching,
      isError: singleQuery.isError,
      refetch: () => void singleQuery.refetch(),
    };
  }

  return {
    data: multiQuery.data,
    isPending: multiQuery.isPending,
    isFetching: multiQuery.isFetching,
    isError: multiQuery.isError,
    refetch: () => void multiQuery.refetch(),
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
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: reportKeys.progress(reportId) });
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

/** POST /v1/reports/{id}/reopen-requests/{requestId}/approve — duyệt yêu cầu mở lại. */
export function useApproveReopenRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, requestId }: { reportId: string; requestId: string }) =>
      approveReopenRequest(reportId, requestId),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.reopenRequests() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
    },
  });
}

/** POST /v1/reports/{id}/reopen-requests/{requestId}/reject — từ chối yêu cầu mở lại. */
export function useRejectReopenRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      requestId,
      body,
    }: {
      reportId: string;
      requestId: string;
      body: RejectReopenRequestInput;
    }) => rejectReopenRequest(reportId, requestId, body),
    onSuccess: (_data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.detail(reportId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.reopenRequests() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
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
  const canFetch = useProtectedQueryEnabled((options?.enabled ?? true) && Boolean(reportId));
  return useQuery({
    queryKey: officerKeys.violationRecurrenceComparison(reportId),
    queryFn: () => fetchViolationRecurrenceComparison(reportId),
    staleTime: LIST_STALE_MS,
    enabled: canFetch,
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
 * GET /v1/reports/{id}/inspections — hồ sơ xử phạt gắn báo cáo.
 * `enabled` = false cho đến khi user expand row (tránh N+1 lúc load list).
 */
export function useReportInspections(reportId: string, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(reportId) && enabled);
  return useQuery({
    queryKey: officerKeys.reportInspections(reportId),
    queryFn: () => fetchReportInspections(reportId),
    enabled: canFetch,
    staleTime: LIST_STALE_MS,
  });
}

/**
 * GET /v1/inspections/{id} — [InspectionLEO] chi tiết hồ sơ xử phạt.
 */
export function useInspectionDetail(id: string, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(id) && enabled);
  return useQuery({
    queryKey: officerKeys.inspectionDetail(id),
    queryFn: () => fetchInspectionDetail(id),
    enabled: canFetch,
    staleTime: INSPECTION_DETAIL_STALE_MS,
  });
}

/**
 * GET /v1/inspections/{id}/payments — [Inspector/LEO] lịch sử nộp phạt (BR-INS-020).
 */
export function useInspectionPayments(id: string, enabled = true) {
  const canFetch = useProtectedQueryEnabled(Boolean(id) && enabled);
  return useQuery({
    queryKey: officerKeys.inspectionPayments(id),
    queryFn: () => fetchInspectionPayments(id),
    enabled: canFetch,
    staleTime: LIST_STALE_MS,
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
      queryClient.invalidateQueries({ queryKey: officerKeys.reportInspections(reportId) });
      queryClient.invalidateQueries({
        queryKey: [...officerKeys.all, 'inspection-detail'],
      });
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceCandidates() });
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionOfficerQueue() });
      queryClient.invalidateQueries({ queryKey: leoOfficesKeys.myReports() });
      queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
    },
  });
}

/**
 * PUT /v1/inspections/{id}/assign-team — gán / đổi đội kiểm tra.
 */
export function useAssignInspectionTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inspectionId,
      body,
    }: {
      inspectionId: string;
      body: AssignInspectionTeamInput;
    }) => assignInspectionTeam(inspectionId, body),
    onSuccess: (_data, { inspectionId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionDetail(inspectionId) });
      queryClient.invalidateQueries({ queryKey: [...officerKeys.all, 'report-inspections'] });
      queryClient.invalidateQueries({ queryKey: officerKeys.violationRecurrenceCandidates() });
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionOfficerQueue() });
    },
  });
}

/**
 * PUT /v1/inspections/{id}/record-payment — [LEO] ghi nhận nộp phạt (BR-INS-020, BR-ORG-012).
 */
export function useRecordInspectionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      inspectionId,
      body,
    }: {
      inspectionId: string;
      body: RecordInspectionPaymentInput;
    }) => recordInspectionPayment(inspectionId, body),
    // onSettled (không phải onSuccess): endpoint không idempotent và BE có thể đã commit
    // xong rồi mới lỗi ở bước side-effect (409 CONCURRENCY_CONFLICT) hoặc client timeout.
    // Lỗi vẫn phải refetch để `canRecordPayment` / `paidAmount` phản ánh trạng thái thật,
    // tránh LEO ghi nhận lần 2 dựa trên cache cũ.
    onSettled: (_data, _error, { inspectionId }) => {
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionDetail(inspectionId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionPayments(inspectionId) });
      queryClient.invalidateQueries({ queryKey: officerKeys.inspectionOfficerQueue() });
    },
  });
}
