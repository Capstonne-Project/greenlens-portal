import type { ReportSeverity } from '@/lib/api/models/report';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportStatus } from '@/lib/constants/reportStatus';

/** Media trong chi tiết so sánh trùng lặp. */
export type DuplicateCandidateDetailMedia = ViolationRecurrenceMedia;

/** Một phía so sánh: nghi trùng (`report`) hoặc gốc (`primaryReport`). */
export interface DuplicateCandidateDetailSide {
  id: string;
  code: string;
  status: ReportStatus;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  media: DuplicateCandidateDetailMedia[];
}

/**
 * GET /v1/reports/{id}/duplicate-candidate-detail — domain model (BR-REP-031/032).
 * `id` path = báo cáo nghi trùng; `primaryReport` = báo cáo gốc.
 */
export interface DuplicateCandidateDetail {
  report: DuplicateCandidateDetailSide;
  primaryReport: DuplicateCandidateDetailSide | null;
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  distanceMeters: number;
  hoursSincePrimaryCreated: number;
}
