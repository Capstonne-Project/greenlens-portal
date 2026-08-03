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

export interface DuplicateCandidatesParamsDto {
  page?: number;
  pageSize?: number;
}
