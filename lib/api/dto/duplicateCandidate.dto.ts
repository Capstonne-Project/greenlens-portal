import type { ReportSeverityDto } from '@/lib/api/dto/report.dto';
import type { ReportQueuePaginationDto } from '@/lib/api/dto/reportQueue.dto';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** GET /v1/reports/duplicate-candidates — báo cáo gốc (primary) mà item bị gắn cờ trùng. */
export interface DuplicateCandidatePrimaryDto {
  id: string;
  code: string;
  address: string;
  createdAt: string;
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
