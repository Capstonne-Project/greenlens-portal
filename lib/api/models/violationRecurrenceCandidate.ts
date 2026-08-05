import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportSeverity } from '@/lib/api/models/report';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportQueueStatus, ReportStatus } from '@/lib/constants/reportStatus';

/** Báo cáo Closed trước đó mà báo cáo hiện tại bị gắn cờ tái phát — BR-REP-034. */
export interface ViolationRecurrenceCandidatePrior {
  id: string;
  code: string;
  address: string;
  status: ReportStatus;
  closedAt: string;
  /** Số ngày từ lúc đóng prior đến lúc tạo báo cáo hiện tại. */
  daysSinceClosed: number;
  media: ViolationRecurrenceMedia[];
}

/**
 * GET /v1/reports/violation-recurrence-candidates — một báo cáo nghi tái phạm
 * (cùng category, ≤25m, prior Closed trong 30 ngày) [LEO/DEO].
 */
export interface ViolationRecurrenceCandidateItem {
  id: string;
  code: string;
  categoryName: string;
  severity: ReportSeverity;
  status: ReportQueueStatus;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  media: ViolationRecurrenceMedia[];
  /** Null khi BE chưa gắn được prior Closed. */
  priorClosedReport: ViolationRecurrenceCandidatePrior | null;
}

/** GET /v1/reports/violation-recurrence-candidates — data envelope. */
export interface ViolationRecurrenceCandidatesData {
  items: ViolationRecurrenceCandidateItem[];
  pagination: PaginationMeta;
}

/** Swagger: CreatedAt | Severity | PriorClosedAt | PriorityScore */
export type ViolationRecurrenceCandidatesSortBy =
  | 'CreatedAt'
  | 'Severity'
  | 'PriorClosedAt'
  | 'PriorityScore';

/** Swagger: Asc | Desc */
export type ViolationRecurrenceCandidatesSortDir = 'Asc' | 'Desc';

/**
 * GET /v1/reports/violation-recurrence-candidates — query params (all optional; BE defaults page=1, pageSize=20).
 */
export interface ViolationRecurrenceCandidatesParams {
  page?: number;
  pageSize?: number;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  status?: ReportQueueStatus;
  severity?: ReportSeverity;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  minDaysSincePriorClosed?: number;
  maxDaysSincePriorClosed?: number;
  sortBy?: ViolationRecurrenceCandidatesSortBy;
  sortDir?: ViolationRecurrenceCandidatesSortDir;
}
