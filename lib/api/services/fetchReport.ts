import {
  adaptFetchReportDetail,
  adaptFetchReportProgress,
} from '@/lib/api/adapters/report.adapter';
import { adaptFetchReportQueue } from '@/lib/api/adapters/reportQueue.adapter';
import {
  adaptAssignReport,
  adaptConfirmDuplicate,
  adaptDismissDuplicate,
  adaptDispatchToCompany,
  adaptReassignReport,
  adaptVerifyReport,
} from '@/lib/api/adapters/reportActions.adapter';
import type { ReportDetail } from '@/lib/api/models/report';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import type { ReportProgress } from '@/lib/api/models/reportProgress';
import type {
  AssignReportInput,
  ConfirmDuplicateInput,
  DispatchToCompanyInput,
  DuplicateActionResult,
  ReassignReportInput,
  VerifyReportInput,
  VerifyReportResult,
} from '@/lib/api/models/reportAction';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  ReportAssignment,
  ReportDetail,
  ReportMedia,
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

const reportService = {
  fetchReportDetail,
  fetchReportQueue,
  fetchReportProgress,
  assignReport,
  dispatchReportToCompany,
  reassignReport,
  verifyReport,
  confirmDuplicateReport,
  dismissDuplicateReport,
};
export default reportService;
