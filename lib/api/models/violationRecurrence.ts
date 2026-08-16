import type { ReportSeverity } from '@/lib/api/models/report';
import type { ReportStatus } from '@/lib/constants/reportStatus';

/** Media trong so sánh tái phát (BR-REP-034). */
export interface ViolationRecurrenceMedia {
  id: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  uploadedAt: string;
}

/** Một phía so sánh: báo cáo hiện tại hoặc Closed trước đó. */
export interface ViolationRecurrenceReport {
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
  closedAt: string | null;
  media: ViolationRecurrenceMedia[];
  hadPriorInspection: boolean;
  priorInspectionId: string | null;
  priorInspectionFinalStatus: string | null;
  hasInspection: boolean;
}

/** GET /v1/reports/{id}/violation-recurrence-comparison — domain model. */
export interface ViolationRecurrenceComparison {
  currentReport: ViolationRecurrenceReport;
  priorClosedReport: ViolationRecurrenceReport;
  daysSincePriorClosed: number;
  distanceMeters: number;
  hasInspection: boolean;
}

/** POST /v1/reports/{id}/dismiss-violation-recurrence — kết quả. */
export interface DismissViolationRecurrenceResult {
  code: string;
  message: string;
  status: number;
  data: string;
}
