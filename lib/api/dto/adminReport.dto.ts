/** DTO khớp Swagger BE — admin reports. */

import type { ReportStatus } from '@/lib/constants/reportStatus';

export type AdminReportStatusDto = ReportStatus;

export type AdminReportSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AdminReportListItemDto {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: AdminReportSeverityDto | string;
  status: AdminReportStatusDto | string;
  latitude: number;
  longitude: number;
  address?: string | null;
  wardCode?: string | null;
  provinceCode?: string | null;
  reporterId?: string | null;
  /** Một số bản BE cũ; Swagger hiện tại không bắt buộc. */
  isAnonymous?: boolean;
  isHidden?: boolean;
  verifiedBy?: string | null;
  assignedByOfficerId?: string | null;
  /** Alias cũ — map sang assignedByOfficerId nếu BE còn gửi. */
  assignedOfficerId?: string | null;
  assignmentCount?: number;
  priorityScore?: number;
  reporterCount?: number;
  reopenedCount?: number;
  createdAt?: string;
  verifiedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface AdminReportsPaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Swagger: `{ items, pagination }` — giữ flat fields để tương thích bản BE cũ. */
export interface AdminReportsListDataDto {
  items: AdminReportListItemDto[];
  pagination?: AdminReportsPaginationDto;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface AdminReportsListParamsDto {
  page?: number;
  pageSize?: number;
  status?: string;
  categoryId?: string;
  wardCode?: string;
  provinceCode?: string;
  search?: string;
}

export interface AdminReportMediaDto {
  id: string;
  mediaType: string;
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface AdminReportAssignmentDto {
  id: string;
  teamId?: string | null;
  teamName?: string | null;
  teamType?: string | null;
  status?: string | null;
  note?: string | null;
  assignedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  progressPercent?: number | null;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
}

export interface AdminReportWasteTagDto {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  iconUrl?: string | null;
}

export interface AdminReportDetailDto extends AdminReportListItemDto {
  categoryId: string;
  severitySetBy?: string | null;
  description?: string | null;
  aiClassifiedType?: string | null;
  aiConfidence?: number | null;
  assignedOfficeId?: string | null;
  media?: AdminReportMediaDto[];
  assignments?: AdminReportAssignmentDto[];
  wasteTags?: AdminReportWasteTagDto[];
  aiSuggestedWasteTagCodes?: string | null;
  startedAt?: string | null;
  slaVerifyDueAt?: string | null;
  slaResolveDueAt?: string | null;
}

export interface HideAdminReportBodyDto {
  reason: string;
}

/** PUT /v1/admin/reports/{id}/status */
export interface UpdateAdminReportStatusBodyDto {
  newStatus: ReportStatus | string;
  reason: string;
}
