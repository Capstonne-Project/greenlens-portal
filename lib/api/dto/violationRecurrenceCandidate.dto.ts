import type { ReportSeverityDto } from '@/lib/api/dto/report.dto';
import type { ReportQueuePaginationDto } from '@/lib/api/dto/reportQueue.dto';
import type { ViolationRecurrenceMediaDto } from '@/lib/api/dto/violationRecurrence.dto';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/**
 * GET /v1/reports/violation-recurrence-candidates — báo cáo Closed trước đó trong bán kính ≤25m
 * cùng category trong 30 ngày (BR-REP-034).
 */
export interface ViolationRecurrenceCandidatePriorDto {
  id: string;
  code: string;
  address: string;
  status: string;
  closedAt: string;
  daysSinceClosed: number;
  media: ViolationRecurrenceMediaDto[];
}

/**
 * GET /v1/reports/violation-recurrence-candidates — một báo cáo bị gắn cờ
 * `isSuspectedViolationRecurrence` [LEO/DEO].
 */
export interface ViolationRecurrenceCandidateItemDto {
  id: string;
  code: string;
  categoryName: string;
  severity: ReportSeverityDto;
  status: ReportQueueStatus;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  media: ViolationRecurrenceMediaDto[];
  priorClosedReport: ViolationRecurrenceCandidatePriorDto | null;
}

/** GET /v1/reports/violation-recurrence-candidates — data envelope. */
export interface ViolationRecurrenceCandidatesDataDto {
  items: ViolationRecurrenceCandidateItemDto[];
  pagination: ReportQueuePaginationDto;
}

/** Swagger: CreatedAt | Severity | PriorClosedAt | PriorityScore */
export type ViolationRecurrenceCandidatesSortByDto =
  | 'CreatedAt'
  | 'Severity'
  | 'PriorClosedAt'
  | 'PriorityScore';

/** Swagger: Asc | Desc */
export type ViolationRecurrenceCandidatesSortDirDto = 'Asc' | 'Desc';

/**
 * GET /v1/reports/violation-recurrence-candidates — query params (all optional; BE defaults page=1, pageSize=20).
 */
export interface ViolationRecurrenceCandidatesParamsDto {
  page?: number;
  pageSize?: number;
  /** Swagger: Submitted | Verified | InProgress | Resolved | Reopened | Closed | Rejected | Duplicate */
  status?: ReportQueueStatus;
  severity?: ReportSeverityDto;
  categoryId?: string;
  wardCode?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  minDaysSincePriorClosed?: number;
  maxDaysSincePriorClosed?: number;
  sortBy?: ViolationRecurrenceCandidatesSortByDto;
  sortDir?: ViolationRecurrenceCandidatesSortDirDto;
}
