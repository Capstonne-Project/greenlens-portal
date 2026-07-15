/** FE models — admin báo cáo ô nhiễm (ổn định cho L4/L6). */

import type { ReportStatus } from '@/lib/constants/reportStatus';

export type { ReportStatus } from '@/lib/constants/reportStatus';

export type ReportSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AdminReportListItem {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string | null;
  provinceCode: string | null;
  reporterId: string | null;
  isAnonymous: boolean;
  isHidden: boolean;
  verifiedBy: string | null;
  assignedOfficerId: string | null;
  assignmentCount: number;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  createdAt: string;
  verifiedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminReportsList {
  items: AdminReportListItem[];
  pagination: PaginationMeta;
}

export interface AdminReportsListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  categoryId?: string;
  wardCode?: string;
  provinceCode?: string;
  search?: string;
}

export interface AdminReportMedia {
  id: string;
  mediaType: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface AdminReportAssignment {
  id: string;
  teamId: string | null;
  teamName: string | null;
  teamType: string | null;
  status: string | null;
  note: string | null;
  assignedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number | null;
  progressNote: string | null;
  progressUpdatedAt: string | null;
}

export interface AdminReportWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string | null;
  iconUrl: string | null;
}

export interface AdminReportDetail extends AdminReportListItem {
  categoryId: string;
  severitySetBy: string | null;
  description: string;
  aiClassifiedType: string | null;
  aiConfidence: number | null;
  assignedOfficeId: string | null;
  media: AdminReportMedia[];
  assignments: AdminReportAssignment[];
  wasteTags: AdminReportWasteTag[];
  aiSuggestedWasteTagCodes: string | null;
  startedAt: string | null;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
}

export interface HideAdminReportInput {
  reason: string;
}

export interface UpdateAdminReportStatusInput {
  newStatus: string;
  reason: string;
}
