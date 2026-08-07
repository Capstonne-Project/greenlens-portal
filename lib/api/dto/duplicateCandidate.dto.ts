import type { ReportSeverityDto } from '@/lib/api/dto/report.dto';
import type { ReportQueuePaginationDto } from '@/lib/api/dto/reportQueue.dto';
import type { ViolationRecurrenceMediaDto } from '@/lib/api/dto/violationRecurrence.dto';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Media so sánh trùng lặp — cùng shape với violation-recurrence media. */
export type DuplicateCandidateMediaDto = ViolationRecurrenceMediaDto;

/** GET /v1/reports/duplicate-candidates — báo cáo gốc (primary) mà item bị gắn cờ trùng. */
export interface DuplicateCandidatePrimaryDto {
  id: string;
  code: string;
  address: string;
  createdAt: string;
  media: DuplicateCandidateMediaDto[];
}

/**
 * GET /v1/reports/duplicate-candidates — một báo cáo bị gắn cờ possible_duplicate.
 * BR-REP-031: Tier 1 geo/time hoặc Tier 2 AI.
 */
export interface DuplicateCandidateItemDto {
  id: string;
  code: string;
  categoryName: string;
  severity: ReportSeverityDto;
  status: ReportQueueStatus;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  media: DuplicateCandidateMediaDto[];
  primary: DuplicateCandidatePrimaryDto | null;
}

/** GET /v1/reports/duplicate-candidates — data envelope. */
export interface DuplicateCandidatesDataDto {
  items: DuplicateCandidateItemDto[];
  pagination: ReportQueuePaginationDto;
}

/** Swagger: CreatedAt | Severity | AiSimilarityScore | PriorityScore */
export type DuplicateCandidatesSortByDto =
  | 'CreatedAt'
  | 'Severity'
  | 'AiSimilarityScore'
  | 'PriorityScore';

/** Swagger: Asc | Desc */
export type DuplicateCandidatesSortDirDto = 'Asc' | 'Desc';

/**
 * GET /v1/reports/duplicate-candidates — query params (all optional; BE defaults page=1, pageSize=20).
 */
export interface DuplicateCandidatesParamsDto {
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
  duplicateDetectionSource?: string;
  /** Swagger: `minAiSimilarityScore` (capital A in Ai). */
  minAiSimilarityScore?: number;
  sortBy?: DuplicateCandidatesSortByDto;
  sortDir?: DuplicateCandidatesSortDirDto;
}
