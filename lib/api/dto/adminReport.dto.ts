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
  address: string;
  wardCode?: string | null;
  provinceCode?: string | null;
  reporterId?: string | null;
  isAnonymous: boolean;
  assignedOfficerId?: string | null;
  assignmentCount: number;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  createdAt: string;
  verifiedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface AdminReportsListDataDto {
  items: AdminReportListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
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
}

export interface AdminReportDetailDto extends AdminReportListItemDto {
  categoryId: string;
  severitySetBy?: string | null;
  description: string;
  aiClassifiedType?: string | null;
  aiConfidence?: number | null;
  assignedOfficeId?: string | null;
  media: AdminReportMediaDto[];
  assignments: AdminReportAssignmentDto[];
  startedAt?: string | null;
  slaVerifyDueAt?: string | null;
  slaResolveDueAt?: string | null;
}
