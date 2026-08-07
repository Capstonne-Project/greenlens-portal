import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Swagger: Pending | Approved | Rejected */
export type ReopenRequestStatus = 'Pending' | 'Approved' | 'Rejected';

/** GET /v1/reports/reopen-requests — một yêu cầu mở lại báo cáo [LEO/DEO]. */
export interface ReopenRequestItem {
  requestId: string;
  reportId: string;
  reportCode: string;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  reportStatus: ReportQueueStatus;
  reason: string;
  status: ReopenRequestStatus;
  requestedAt: string;
  firstEvidenceImageUrl: string | null;
  evidenceImageCount: number;
  hasVideo: boolean;
}

/** GET /v1/reports/reopen-requests — data envelope. */
export interface ReopenRequestsData {
  items: ReopenRequestItem[];
  pagination: PaginationMeta;
}

/**
 * GET /v1/reports/reopen-requests — query params
 * (all optional; BE defaults page=1, pageSize=20).
 */
export interface ReopenRequestsParams {
  page?: number;
  pageSize?: number;
  status?: ReopenRequestStatus;
}

/** POST /v1/reports/{id}/reopen-requests/{requestId}/reject — body. */
export interface RejectReopenRequestInput {
  reason: string;
}

/** Envelope cho approve / reject reopen-request. */
export interface ReopenRequestActionResult {
  code: string;
  message: string;
  status: number;
  data: string;
}
