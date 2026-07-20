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
  note: string;
  assignedAt: string;
  startedAt: string;
  completedAt: string;
  progressPercent: number;
  progressNote: string;
  progressUpdatedAt: string;
}

/** GET /v1/reports/{id} — `data.wasteTags[]` */
export interface ReportWasteTagDto {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string;
}

/** GET /v1/reports/{id} — `data` (Swagger BE). */
export interface ReportDetailDto {
  id: string;
  code: string;
  reporterId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverityDto;
  severitySetBy: SeveritySetByDto;
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
}

/** GET /v1/reports/{id} — envelope response. */
export interface ReportDetailResponseDto {
  code: string;
  message: string;
  status: number;
  data: ReportDetailDto;
}
