import type { ReportSeverityDto, ReportStatusDto } from '@/lib/api/dto/report.dto';

/** GET /v1/reports/{id}/violation-recurrence-comparison — `data.*.media[]` */
export interface ViolationRecurrenceMediaDto {
  id: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  uploadedAt: string;
}

/**
 * GET /v1/reports/{id}/violation-recurrence-comparison —
 * `data.currentReport` | `data.priorClosedReport`
 */
export interface ViolationRecurrenceReportDto {
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
  closedAt: string | null;
  media: ViolationRecurrenceMediaDto[];
  hadPriorInspection: boolean;
  priorInspectionId: string | null;
  priorInspectionFinalStatus: string | null;
  hasInspection: boolean;
}

/** GET /v1/reports/{id}/violation-recurrence-comparison — `data` */
export interface ViolationRecurrenceComparisonDto {
  currentReport: ViolationRecurrenceReportDto;
  priorClosedReport: ViolationRecurrenceReportDto;
  daysSincePriorClosed: number;
  distanceMeters: number;
  hasInspection: boolean;
}

/** GET /v1/reports/{id}/violation-recurrence-comparison — envelope */
export interface ViolationRecurrenceComparisonResponseDto {
  code: string;
  message: string;
  status: number;
  data: ViolationRecurrenceComparisonDto;
}

/**
 * POST /v1/reports/{id}/dismiss-violation-recurrence — envelope (BR-REP-034).
 * `data` là string theo Swagger.
 */
export interface DismissViolationRecurrenceResponseDto {
  code: string;
  message: string;
  status: number;
  data: string;
}
