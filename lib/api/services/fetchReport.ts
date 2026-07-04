import { adaptFetchReportDetail, adaptFetchReportQueue } from '@/lib/api/adapters/report.adapter';
import {
  adaptAssignReport,
  adaptRejectReport,
  adaptVerifyReport,
} from '@/lib/api/adapters/reportActions.adapter';
import type { ReportDetail, ReportQueueData, ReportQueueParams } from '@/lib/api/models/report';
import type {
  AssignReportInput,
  RejectReportInput,
  VerifyReportInput,
} from '@/lib/api/models/reportAction';

export type {
  MediaType,
  ReportAssignment,
  ReportDetail,
  ReportMedia,
  ReportQueueData,
  ReportQueueItem,
  ReportQueueParams,
  ReportSeverity,
  ReportStatus,
  SeveritySetBy,
} from '@/lib/api/models/report';
export type {
  AssignReportInput,
  AssignTeamEntry,
  RejectReportInput,
  VerifyReportInput,
} from '@/lib/api/models/reportAction';

/** GET /v1/reports/queue — danh sách báo cáo phân trang cho officer */
export async function fetchReportQueue(params: ReportQueueParams): Promise<ReportQueueData> {
  return adaptFetchReportQueue(params);
}

/** GET /v1/reports/{id} — chi tiết một báo cáo */
export async function fetchReportDetail(id: string): Promise<ReportDetail> {
  return adaptFetchReportDetail(id);
}

export async function verifyReport(id: string, body: VerifyReportInput = {}): Promise<void> {
  return adaptVerifyReport(id, body);
}

export async function rejectReport(id: string, body: RejectReportInput): Promise<void> {
  return adaptRejectReport(id, body);
}

/** POST /v1/reports/{reportId}/assign — gán đội xử lý, Verified → InProgress */
export async function assignReport(reportId: string, body: AssignReportInput): Promise<void> {
  return adaptAssignReport(reportId, body);
}

const reportService = {
  fetchReportQueue,
  fetchReportDetail,
  verifyReport,
  rejectReport,
  assignReport,
};
export default reportService;
