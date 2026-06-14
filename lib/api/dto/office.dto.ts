export interface CreateOfficeBodyDto {
  name: string;
  departmentId: string;
  wardCode: string;
  officerId?: string;
}

export interface OfficeDto {
  id: string;
  name: string;
  departmentId: string;
  wardCode: string;
}

export interface OfficeListItemDto {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  wardCode: string;
  wardName: string;
  officerId?: string | null;
  officerName?: string | null;
  isOnboarded: boolean;
  teamCount: number;
  createdAt: string;
}

export interface OfficesListDataDto {
  items: OfficeListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OfficesListParamsDto {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  isOnboarded?: boolean;
}

export interface OfficeTeamDto {
  id: string;
  name: string;
  teamType: string;
  isActive: boolean;
  memberCount: number;
}

export interface OfficeDetailDto extends OfficeDto {
  departmentName: string;
  wardName: string;
  officerId?: string | null;
  officerName?: string | null;
  isOnboarded: boolean;
  teams: OfficeTeamDto[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOfficeBodyDto {
  name: string;
}

export interface AssignOfficeOfficerBodyDto {
  userId: string;
}

/**
 * GET /v1/offices/my/reports — items[].assignments[]
 * Mỗi report có thể có nhiều assignment (re-assign / multi-team).
 */
export interface LeoMyReportAssignmentDto {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  // status: ReportAssignmentStatusDto;
  progressPercent: number;
  progressNote?: string | null;
  note?: string | null;
  declineReason?: string | null;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  progressUpdatedAt?: string | null;
}

/** GET /v1/offices/my/reports — item */
export interface LeoMyReportItemDto {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: import('@/lib/api/dto/report.dto').ReportSeverityDto;
  status: import('@/lib/api/dto/report.dto').ReportStatusDto;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  reporterId: string;
  reporterName: string;
  description?: string | null;
  assignmentCount: number;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  overallProgressPercent: number;
  createdAt: string;
  verifiedAt?: string | null;
  dispatchedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  slaResolveDueAt?: string | null;
  assignments: LeoMyReportAssignmentDto[];
}

export interface LeoOfficePaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** GET /v1/offices/my/reports — data envelope */
export interface LeoMyReportsDataDto {
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  items: LeoMyReportItemDto[];
  pagination: LeoOfficePaginationDto;
}
