import type { ReportSeverity } from '@/lib/api/models/adminReport';
import type { ReportStatus } from '@/lib/constants/reportStatus';

export type { ReportSeverity } from '@/lib/api/models/adminReport';
export type { ReportStatus } from '@/lib/constants/reportStatus';

export type SeveritySetBy = 'User' | 'AI' | 'Officer';

/** GET /v1/reports/{id} — `data.media[]` */
export interface ReportMedia {
  id: string;
  mediaType: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /v1/reports/{id} — `data.assignments[]` */
export interface ReportAssignment {
  id: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: string;
  note: string | null;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  progressNote: string | null;
  progressUpdatedAt: string | null;
}

/** GET /v1/reports/{id} — `data.wasteTags[]` */
export interface ReportWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string | null;
  iconUrl: string | null;
}

/** GET /v1/reports/{id} — `data.satisfaction` */
export interface ReportSatisfaction {
  isSatisfied: boolean;
  rating: number;
  comment: string;
  ratedAt: string;
}

/** GET /v1/reports/{id} — `data.pendingReopenRequest` */
export interface ReportPendingReopenRequest {
  requestId: string;
  reason: string;
  requestedAt: string;
  evidenceMedia: ReportMedia[];
}

/** GET /v1/reports/{id} — `data.mergedReports[]` */
export interface ReportMergedChild {
  id: string;
  code: string;
  imageUrl: string | null;
  createdAt: string;
  status: ReportStatus;
}

/** GET /v1/reports/{id} — `data.priorClosedReport` */
export interface ReportPriorClosedReport {
  id: string;
  code: string;
  closedAt: string;
  categoryCode: string;
  hadPriorInspection: boolean;
}

/** GET /v1/reports/{id} — domain model (khớp Swagger BE; `status` đã normalize). */
export interface ReportDetail {
  id: string;
  code: string;
  reporterId: string;
  reporterName: string | null;
  reporterAvatarUrl: string | null;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  severitySetBy: SeveritySetBy;
  status: ReportStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  provinceCode: string;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  aiClassifiedType: string | null;
  aiConfidence: number | null;
  verifiedBy: string | null;
  assignedByOfficerId: string | null;
  assignedOfficeId: string | null;
  media: ReportMedia[];
  assignments: ReportAssignment[];
  wasteTags: ReportWasteTag[];
  aiSuggestedWasteTagCodes: string | null;
  createdAt: string;
  verifiedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
  satisfaction: ReportSatisfaction | null;
  hasCurrentUserRated: boolean;
  hasPendingReopenRequest: boolean;
  pendingReopenRequest: ReportPendingReopenRequest | null;
  mergedIntoPrimaryReportId: string | null;
  mergedIntoPrimaryReportCode: string | null;
  mergedReports: ReportMergedChild[];
  isSuspectedViolationRecurrence: boolean;
  suspectedRecurrenceOfReportId: string | null;
  priorClosedReport: ReportPriorClosedReport | null;
  isSuspicious: boolean;
  suspiciousReasons: string[];
}
