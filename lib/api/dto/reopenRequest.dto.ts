import type { ReportQueuePaginationDto } from '@/lib/api/dto/reportQueue.dto';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Swagger: Pending | Approved | Rejected */
export type ReopenRequestStatusDto = 'Pending' | 'Approved' | 'Rejected';

/** GET /v1/reports/reopen-requests — một yêu cầu mở lại báo cáo. */
export interface ReopenRequestItemDto {
  requestId: string;
  reportId: string;
  reportCode: string;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  reportStatus: ReportQueueStatus;
  reason: string;
  status: ReopenRequestStatusDto;
  requestedAt: string;
  firstEvidenceImageUrl: string | null;
  evidenceImageCount: number;
  hasVideo: boolean;
}

/** GET /v1/reports/reopen-requests — data envelope. */
export interface ReopenRequestsDataDto {
  items: ReopenRequestItemDto[];
  pagination: ReportQueuePaginationDto;
}

/**
 * GET /v1/reports/reopen-requests — query params
 * (all optional; BE defaults page=1, pageSize=20).
 */
export interface ReopenRequestsParamsDto {
  page?: number;
  pageSize?: number;
  status?: ReopenRequestStatusDto;
}

/** POST /v1/reports/{id}/reopen-requests/{requestId}/reject — body Swagger. */
export interface RejectReopenRequestBodyDto {
  reason: string;
}

/**
 * POST approve / reject reopen-request — envelope response
 * (cùng shape với VerifyReportResponseDto).
 */
export type ReopenRequestActionResponseDto = {
  code: string;
  message: string;
  status: number;
  data: string;
};
