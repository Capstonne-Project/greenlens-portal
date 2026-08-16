import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportSeverity } from '@/lib/api/models/report';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

export type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** GET /v1/reports/queue — một item trong hàng đợi [LEO/DEO]. */
export interface ReportQueueItem {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  status: ReportQueueStatus;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  priorityScore: number;
  createdAt: string;
  /** Thời điểm xác minh; null nếu chưa verify. */
  verifiedAt: string | null;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
  /** Thumbnail ảnh đầu tiên của báo cáo (có thể null nếu chưa có media). */
  firstImageUrl: string | null;
  isPossibleDuplicate: boolean;
  possibleDuplicateOfReportId: string | null;
  possibleDuplicateOfReportCode: string | null;
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  duplicateCandidateCount: number;
  isSuspectedViolationRecurrence: boolean;
  suspectedRecurrenceOfReportId: string | null;
  suspectedRecurrenceOfReportCode: string | null;
}

/** GET /v1/reports/queue — data envelope. */
export interface ReportQueueData {
  items: ReportQueueItem[];
  pagination: PaginationMeta;
}

/** GET /v1/reports/queue — Swagger `sortBy`. */
export type ReportQueueSortBy =
  | 'PriorityScore'
  | 'CreatedAt'
  | 'Severity'
  | 'VerifiedAt'
  | 'SlaVerifyDueAt'
  | 'SlaResolveDueAt';

export type ReportQueueSortDir = 'Asc' | 'Desc';

export interface ReportQueueParams {
  page?: number;
  pageSize?: number;
  /**
   * Filter status — BE hỗ trợ multi: `?status=Verified&status=Reopened`.
   * Truyền 1 giá trị hoặc mảng.
   */
  status?: ReportQueueStatus | readonly ReportQueueStatus[];
  severity?: ReportSeverity;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  slaBreached?: boolean;
  isPossibleDuplicate?: boolean;
  isSuspectedViolationRecurrence?: boolean;
  hasPendingReopenRequest?: boolean;
  search?: string;
  sortBy?: ReportQueueSortBy;
  sortDir?: ReportQueueSortDir;
}
