import type { PaginationMeta } from '@/lib/api/models/office';
import type { ReportSeverity } from '@/lib/api/models/report';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Báo cáo gốc (primary) mà báo cáo nghi trùng trỏ tới — BR-REP-031. */
export interface DuplicateCandidatePrimary {
  id: string;
  code: string;
  address: string;
  createdAt: string;
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
  /** Null khi BE chưa gắn được báo cáo gốc. */
  primary: DuplicateCandidatePrimary | null;
}

/** GET /v1/reports/duplicate-candidates — data envelope. */
export interface DuplicateCandidatesData {
  items: DuplicateCandidateItem[];
  pagination: PaginationMeta;
}

export interface DuplicateCandidatesParams {
  page?: number;
  pageSize?: number;
}
