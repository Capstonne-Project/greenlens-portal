import {
  adaptFetchReportDetail,
  // adaptFetchReportProgress,
  adaptFetchReportQueue,
} from '@/lib/api/adapters/report.adapter';
import { adaptAssignReport, adaptReassignReport } from '@/lib/api/adapters/reportActions.adapter';
import type { ReportDetail, ReportQueueData, ReportQueueParams } from '@/lib/api/models/report';
// import type { ReportProgress } from '@/lib/api/models/reportProgress';
import type { AssignReportInput, ReassignReportInput } from '@/lib/api/models/reportAction';

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
  // ReportWasteTag,
  SeveritySetBy,
} from '@/lib/api/models/report';
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
  ReassignReportInput,
} from '@/lib/api/models/reportAction';

/** GET /v1/reports/queue — danh sách báo cáo phân trang cho officer */
export async function fetchReportQueue(params: ReportQueueParams): Promise<ReportQueueData> {
  return adaptFetchReportQueue(params);
}

/** GET /v1/reports/{id} — chi tiết một báo cáo */
export async function fetchReportDetail(id: string): Promise<ReportDetail> {
  return adaptFetchReportDetail(id);
}

/** GET /v1/reports/{id}/progress — [LEO] tiến trình xử lý báo cáo. */
// export async function fetchReportProgress(id: string): Promise<ReportProgress> {
//   return adaptFetchReportProgress(id);
// }

/** POST /v1/reports/{reportId}/assign — gán đội xử lý, Dispatched → Assigned / InProgress */
export async function assignReport(reportId: string, body: AssignReportInput): Promise<void> {
  return adaptAssignReport(reportId, body);
}

/** PUT /v1/reports/{reportId}/reassign — chuyển giao đội (Assigned/Declined). */
export async function reassignReport(reportId: string, body: ReassignReportInput): Promise<void> {
  return adaptReassignReport(reportId, body);
}

const reportService = {
  fetchReportQueue,
  fetchReportDetail,
  // fetchReportProgress,
  assignReport,
  reassignReport,
};
export default reportService;
