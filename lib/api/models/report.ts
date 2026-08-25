import type { ReportSeverity } from '@/lib/api/models/adminReport';
import type { ReportStatus } from '@/lib/constants/reportStatus';

export type { ReportSeverity } from '@/lib/api/models/adminReport';
export type { ReportStatus } from '@/lib/constants/reportStatus';

export type SeveritySetBy = 'User' | 'AI' | 'Officer';

export type ReopenHistoryStatus = 'Pending' | 'Approved' | 'Rejected';

/** GET /v1/reports/{id} — `data.media[]` */
export interface ReportMedia {
  id: string;
  mediaType: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /v1/reports/{id} — `data.assignments[]` & `data.currentAssignment` */
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
  /** Waste tags của team được gán — Cleanup teams only. */
  teamWasteTags: ReportWasteTag[];
}

/** GET /v1/reports/{id} — `data.assignmentHistory[]` */
export interface ReportAssignmentHistoryItem {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: string;
  note: string | null;
  declineReason: string | null;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  progressPercent: number;
  progressNote: string | null;
  progressUpdatedAt: string | null;
  isCurrent: boolean;
  teamWasteTags: ReportWasteTag[];
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

/** GET /v1/reports/{id} — `data.reopenHistory[]` (newest first). */
export interface ReportReopenHistoryItem {
  requestId: string;
  reason: string;
  /** Pending | Approved | Rejected — keep as string; FE can narrow to `ReopenHistoryStatus`. */
  status: string;
  requestedAt: string;
  requestedById: string;
  requestedByName: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
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
  currentAssignment: ReportAssignment | null;
  assignmentHistory: ReportAssignmentHistoryItem[];
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
  reopenHistory: ReportReopenHistoryItem[];
  mergedIntoPrimaryReportId: string | null;
  mergedIntoPrimaryReportCode: string | null;
  mergedReports: ReportMergedChild[];
  isSuspectedViolationRecurrence: boolean;
  suspectedRecurrenceOfReportId: string | null;
  priorClosedReport: ReportPriorClosedReport | null;
  isSuspicious: boolean;
  suspiciousReasons: string[];
}
