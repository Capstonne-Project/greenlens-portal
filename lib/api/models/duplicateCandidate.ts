import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportSeverity } from '@/lib/api/models/report';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Media so sánh trùng lặp — cùng shape với violation-recurrence media. */
export type DuplicateCandidateMedia = ViolationRecurrenceMedia;

/** Báo cáo gốc (primary) mà báo cáo nghi trùng trỏ tới — BR-REP-031. */
export interface DuplicateCandidatePrimary {
  id: string;
  code: string;
  address: string;
  createdAt: string;
  media: DuplicateCandidateMedia[];
}

/** GET /v1/reports/duplicate-candidates — một báo cáo bị gắn cờ possible_duplicate [LEO/DEO]. */
export interface DuplicateCandidateItem {
  id: string;
  code: string;
  categoryName: string;
  severity: ReportSeverity;
  status: ReportQueueStatus;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  /** Nguồn phát hiện — Tier 1 geo/time hoặc Tier 2 AI. */
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  media: DuplicateCandidateMedia[];
  /** Null khi BE chưa gắn được báo cáo gốc. */
  primary: DuplicateCandidatePrimary | null;
}

/** GET /v1/reports/duplicate-candidates — data envelope. */
export interface DuplicateCandidatesData {
  items: DuplicateCandidateItem[];
  pagination: PaginationMeta;
}

/** Swagger: CreatedAt | Severity | AiSimilarityScore | PriorityScore */
export type DuplicateCandidatesSortBy =
  | 'CreatedAt'
  | 'Severity'
  | 'AiSimilarityScore'
  | 'PriorityScore';

/** Swagger: Asc | Desc */
export type DuplicateCandidatesSortDir = 'Asc' | 'Desc';

/**
 * GET /v1/reports/duplicate-candidates — query params (all optional; BE defaults page=1, pageSize=20).
 */
export interface DuplicateCandidatesParams {
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
  duplicateDetectionSource?: string;
  /** Swagger: `minAiSimilarityScore` (capital A in Ai). */
  minAiSimilarityScore?: number;
  sortBy?: DuplicateCandidatesSortBy;
  sortDir?: DuplicateCandidatesSortDir;
}
