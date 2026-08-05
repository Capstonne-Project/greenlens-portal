import type { ReportSeverityDto, ReportStatusDto } from '@/lib/api/dto/report.dto';
import type { ViolationRecurrenceMediaDto } from '@/lib/api/dto/violationRecurrence.dto';

/** GET /v1/reports/{id}/duplicate-candidate-detail — media (cùng shape recurrence). */
export type DuplicateCandidateDetailMediaDto = ViolationRecurrenceMediaDto;

/**
 * GET /v1/reports/{id}/duplicate-candidate-detail —
 * `data.report` | `data.primaryReport` (BR-REP-031/032).
 */
export interface DuplicateCandidateDetailSideDto {
  id: string;
  code: string;
  status: ReportStatusDto | string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto | string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  media: DuplicateCandidateDetailMediaDto[];
}

/** GET /v1/reports/{id}/duplicate-candidate-detail — `data` */
export interface DuplicateCandidateDetailDto {
  report: DuplicateCandidateDetailSideDto;
  primaryReport: DuplicateCandidateDetailSideDto | null;
  duplicateDetectionSource: string | null;
  aiSimilarityScore: number | null;
  distanceMeters: number;
  hoursSincePrimaryCreated: number;
}

/** GET /v1/reports/{id}/duplicate-candidate-detail — envelope */
export interface DuplicateCandidateDetailResponseDto {
  code: string;
  message: string;
  status: number;
  data: DuplicateCandidateDetailDto;
}
