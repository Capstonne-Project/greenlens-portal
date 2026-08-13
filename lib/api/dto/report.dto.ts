import type { ReportStatus } from '@/lib/constants/reportStatus';

export type ReportStatusDto = ReportStatus;

export type ReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';
export type SeveritySetByDto = 'User' | 'AI' | 'Officer';

/** GET /v1/reports/{id} — `data.media[]` */
export interface ReportMediaDto {
  id: string;
  mediaType: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /v1/reports/{id} — `data.assignments[]` */
export interface ReportAssignmentDto {
  id: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: string;
  note?: string | null;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  progressPercent?: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
}

/** GET /v1/reports/{id} — `data.wasteTags[]` */
export interface ReportWasteTagDto {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  iconUrl?: string | null;
}

/** GET /v1/reports/{id} — `data.satisfaction` */
export interface ReportSatisfactionDto {
  isSatisfied: boolean;
  rating: number;
  comment: string;
  ratedAt: string;
}

/** GET /v1/reports/{id} — `data.pendingReopenRequest` */
export interface ReportPendingReopenRequestDto {
  requestId: string;
  reason: string;
  requestedAt: string;
  evidenceMedia: ReportMediaDto[];
}

/** GET /v1/reports/{id} — `data.reopenHistory[]` (newest first). */
export interface ReportReopenHistoryItemDto {
  requestId: string;
  reason: string;
  /** Pending | Approved | Rejected — keep as string; FE can narrow. */
  status: string;
  requestedAt: string;
  requestedById: string;
  requestedByName?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  rejectionReason?: string | null;
  evidenceMedia?: ReportMediaDto[];
}

/** GET /v1/reports/{id} — `data.mergedReports[]` */
export interface ReportMergedChildDto {
  id: string;
  code: string;
  imageUrl: string | null;
  createdAt: string;
  status: ReportStatusDto;
}

/** GET /v1/reports/{id} — `data.priorClosedReport` */
export interface ReportPriorClosedReportDto {
  id: string;
  code: string;
  closedAt: string;
  categoryCode: string;
  hadPriorInspection: boolean;
}

/** GET /v1/reports/{id} — `data` (Swagger BE). */
export interface ReportDetailDto {
  id: string;
  code: string;
  reporterId: string;
  /** Tên người gửi — BE có thể null (report ẩn danh / thiếu profile). */
  reporterName?: string | null;
  reporterAvatarUrl?: string | null;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  /** BE có thể trả `Ai` (không đúng casing `AI`). */
  severitySetBy: SeveritySetByDto | string;
  status: ReportStatusDto;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  provinceCode: string;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  /** BE có thể bỏ qua khi chưa chạy AI. */
  aiClassifiedType?: string | null;
  aiConfidence?: number | null;
  verifiedBy?: string | null;
  assignedByOfficerId?: string | null;
  assignedOfficeId?: string | null;
  media?: ReportMediaDto[];
  assignments?: ReportAssignmentDto[];
  wasteTags?: ReportWasteTagDto[];
  aiSuggestedWasteTagCodes?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  slaVerifyDueAt?: string | null;
  slaResolveDueAt?: string | null;
  satisfaction?: ReportSatisfactionDto | null;
  hasCurrentUserRated?: boolean;
  hasPendingReopenRequest?: boolean;
  pendingReopenRequest?: ReportPendingReopenRequestDto | null;
  reopenHistory?: ReportReopenHistoryItemDto[] | null;
  mergedIntoPrimaryReportId?: string | null;
  mergedIntoPrimaryReportCode?: string | null;
  mergedReports?: ReportMergedChildDto[] | null;
  isSuspectedViolationRecurrence?: boolean;
  suspectedRecurrenceOfReportId?: string | null;
  priorClosedReport?: ReportPriorClosedReportDto | null;
  /** BE flag báo cáo bị gắn nghi ngờ (spam / bất thường). */
  isSuspicious?: boolean;
  suspiciousReasons?: string[] | null;
}

/** GET /v1/reports/{id} — envelope response. */
export interface ReportDetailResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportDetailDto;
}
