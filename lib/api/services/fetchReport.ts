import {
  adaptFetchReportDetail,
  adaptFetchReportProgress,
} from '@/lib/api/adapters/report.adapter';
import { adaptFetchDuplicateCandidates } from '@/lib/api/adapters/duplicateCandidate.adapter';
import { adaptFetchReportQueue } from '@/lib/api/adapters/reportQueue.adapter';
import {
  adaptAssignReport,
  adaptConfirmDuplicate,
  adaptDismissDuplicate,
  adaptDispatchToCompany,
  adaptRejectReport,
  adaptReassignReport,
  adaptVerifyReport,
} from '@/lib/api/adapters/reportActions.adapter';
import {
  adaptDismissViolationRecurrence,
  adaptFetchViolationRecurrenceComparison,
} from '@/lib/api/adapters/violationRecurrence.adapter';
import type {
  DuplicateCandidatesData,
  DuplicateCandidatesParams,
} from '@/lib/api/models/duplicateCandidate';
import type { ReportDetail } from '@/lib/api/models/report';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import type { ReportProgress } from '@/lib/api/models/reportProgress';
import type {
  AssignReportInput,
  ConfirmDuplicateInput,
  DispatchToCompanyInput,
  DuplicateActionResult,
  RejectReportInput,
  ReassignReportInput,
  VerifyReportInput,
  VerifyReportResult,
} from '@/lib/api/models/reportAction';
import type {
  DismissViolationRecurrenceResult,
  ViolationRecurrenceComparison,
} from '@/lib/api/models/violationRecurrence';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  DuplicateCandidateItem,
  DuplicateCandidatePrimary,
  DuplicateCandidatesData,
  DuplicateCandidatesParams,
} from '@/lib/api/models/duplicateCandidate';
export type {
  ReportAssignment,
  ReportDetail,
  ReportMedia,
  ReportMergedChild,
  ReportPendingReopenRequest,
  ReportPriorClosedReport,
  ReportSatisfaction,
  ReportSeverity,
  ReportStatus,
  ReportWasteTag,
  SeveritySetBy,
} from '@/lib/api/models/report';
export type {
  ReportAssignmentDto,
  ReportDetailDto,
  ReportDetailResponseDto,
  ReportMediaDto,
  ReportMergedChildDto,
  ReportPendingReopenRequestDto,
  ReportPriorClosedReportDto,
  ReportSatisfactionDto,
  ReportWasteTagDto,
} from '@/lib/api/dto/report.dto';
export type {
  ReportProgress,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressMedia,
  ReportProgressSla,
  ReportProgressStatusHistory,
  ReportProgressSummary,
} from '@/lib/api/models/reportProgress';
export type {
  AssignReportInput,
  AssignTeamEntry,
  ConfirmDuplicateInput,
  DispatchToCompanyInput,
  DuplicateActionResult,
  RejectReportInput,
  ReassignReportInput,
  VerifyReportInput,
  VerifyReportResult,
} from '@/lib/api/models/reportAction';
export type {
  ReportQueueData,
  ReportQueueItem,
  ReportQueueParams,
  ReportQueueSortBy,
  ReportQueueSortDir,
} from '@/lib/api/models/reportQueue';
export type {
  DismissViolationRecurrenceResult,
  ViolationRecurrenceComparison,
  ViolationRecurrenceMedia,
  ViolationRecurrenceReport,
} from '@/lib/api/models/violationRecurrence';

/** GET /v1/reports/{id} — chi tiết một báo cáo */
export async function fetchReportDetail(id: string): Promise<ReportDetail> {
  return adaptFetchReportDetail(id);
}

/** GET /v1/reports/queue — [LEO/DEO] hàng đợi báo cáo. */
export async function fetchReportQueue(
  params?: ReportQueueParams
): Promise<ApiEnvelope<ReportQueueData>> {
  return adaptFetchReportQueue(params);
}

/**
 * GET /v1/reports/duplicate-candidates — [LEO/DEO] danh sách báo cáo nghi ngờ trùng lặp.
 * BR-REP-031: kèm báo cáo gốc (`primary`) để LEO so sánh và quyết định gộp/bác bỏ.
 */
export async function fetchDuplicateCandidates(
  params?: DuplicateCandidatesParams
): Promise<ApiEnvelope<DuplicateCandidatesData>> {
  return adaptFetchDuplicateCandidates(params);
}

/** GET /v1/reports/{id}/progress — [LEO] tiến trình xử lý báo cáo. */
export async function fetchReportProgress(id: string): Promise<ReportProgress> {
  return adaptFetchReportProgress(id);
}

/**
 * POST /v1/reports/{reportId}/assign — [LEO] gán community team.
 * Company Manager dùng `assignCompanyTeam` → POST .../assign-company-team.
 */
export async function assignReport(reportId: string, body: AssignReportInput): Promise<void> {
  return adaptAssignReport(reportId, body);
}

/** POST /v1/reports/{id}/dispatch-to-company — LEO điều phối task đến công ty DVMT. */
export async function dispatchReportToCompany(
  reportId: string,
  body: DispatchToCompanyInput
): Promise<void> {
  return adaptDispatchToCompany(reportId, body);
}

/** PUT /v1/reports/{reportId}/reassign — chuyển giao đội (Assigned/Declined). */
export async function reassignReport(reportId: string, body: ReassignReportInput): Promise<void> {
  return adaptReassignReport(reportId, body);
}

/** PUT /v1/reports/{id}/verify — LEO xác minh báo cáo (Submitted → Verified). */
export async function verifyReport(
  reportId: string,
  body: VerifyReportInput
): Promise<VerifyReportResult> {
  return adaptVerifyReport(reportId, body);
}

/** PUT /v1/reports/{id}/reject — LEO từ chối báo cáo (Submitted → Rejected). */
export async function rejectReport(
  reportId: string,
  body: RejectReportInput
): Promise<VerifyReportResult> {
  return adaptRejectReport(reportId, body);
}

/** POST /v1/reports/{id}/confirm-duplicate — BR-REP-032 xác nhận & gộp trùng. */
export async function confirmDuplicateReport(
  reportId: string,
  body: ConfirmDuplicateInput
): Promise<DuplicateActionResult> {
  return adaptConfirmDuplicate(reportId, body);
}

/** POST /v1/reports/{id}/dismiss-duplicate — BR-REP-031 bác bỏ nghi trùng. */
export async function dismissDuplicateReport(reportId: string): Promise<DuplicateActionResult> {
  return adaptDismissDuplicate(reportId);
}

/**
 * GET /v1/reports/{id}/violation-recurrence-comparison — BR-REP-034.
 * `reportId` = báo cáo hiện tại đang gắn cờ tái phát.
 */
export async function fetchViolationRecurrenceComparison(
  reportId: string
): Promise<ViolationRecurrenceComparison> {
  return adaptFetchViolationRecurrenceComparison(reportId);
}

/** POST /v1/reports/{id}/dismiss-violation-recurrence — BR-REP-034 bác bỏ nghi tái phát. */
export async function dismissViolationRecurrence(
  reportId: string
): Promise<DismissViolationRecurrenceResult> {
  return adaptDismissViolationRecurrence(reportId);
}

const reportService = {
  fetchReportDetail,
  fetchReportQueue,
  fetchDuplicateCandidates,
  fetchReportProgress,
  assignReport,
  dispatchReportToCompany,
  reassignReport,
  verifyReport,
  rejectReport,
  confirmDuplicateReport,
  dismissDuplicateReport,
  fetchViolationRecurrenceComparison,
  dismissViolationRecurrence,
};
export default reportService;
