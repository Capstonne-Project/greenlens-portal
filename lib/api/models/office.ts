export interface Office {
  id: string;
  name: string;
  departmentId: string;
  wardCode: string;
}

export interface OfficeListItem {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  wardCode: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teamCount: number;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OfficesList {
  items: OfficeListItem[];
  pagination: PaginationMeta;
}

export interface OfficesListParams {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  isOnboarded?: boolean;
}

export interface UpdateOfficeInput {
  name: string;
}

export interface OfficeTeam {
  id: string;
  name: string;
  teamType: string;
  isActive: boolean;
  memberCount: number;
}

export interface OfficeDetail extends Office {
  departmentName: string;
  wardName: string;
  officerId: string | null;
  officerName: string | null;
  isOnboarded: boolean;
  teams: OfficeTeam[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfficeInput {
  name: string;
  departmentId: string;
  wardCode: string;
  officerId?: string;
}

export interface AssignOfficeOfficerInput {
  userId: string;
}

export interface ChangeUserRoleInput {
  newRole: string;
}

// ─── LEO — GET /v1/offices/my/reports ───────────────────────────────────────

/** Một assignment trong `LeoMyReportItem.assignments[]`. */
export interface LeoMyReportAssignment {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: 'checklai';
  progressPercent: number;
  progressNote: string | null;
  note: string | null;
  declineReason: string | null;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  progressUpdatedAt: string | null;
}

/** Item báo cáo LEO quản lý (kèm `assignments[]`). */
export interface LeoMyReportItem {
  id: string;
  code: string;
  categoryCode: string;
  categoryName: string;
  severity: import('@/lib/api/models/report').ReportSeverity;
  status: import('@/lib/api/models/report').ReportStatus;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  reporterId: string;
  reporterName: string;
  description: string | null;
  assignmentCount: number;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  overallProgressPercent: number;
  createdAt: string;
  verifiedAt: string | null;
  dispatchedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaResolveDueAt: string | null;
  assignments: LeoMyReportAssignment[];
}

/** `data` envelope của GET /v1/offices/my/reports. */
export interface LeoMyReportsData {
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  items: LeoMyReportItem[];
  pagination: PaginationMeta;
}

/**
 * Sort theo Swagger comment:
 * `code, status, severity, priority, createdAt, assignmentCount`
 * (mặc định BE: mới nhất).
 */
export type LeoMyReportsSortBy =
  | 'code'
  | 'status'
  | 'severity'
  | 'priority'
  | 'createdAt'
  | 'assignmentCount';

export interface LeoMyReportsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: import('@/lib/api/models/report').ReportStatus;
  categoryId?: string;
  severity?: import('@/lib/api/models/report').ReportSeverity;
  assignmentStatus?: 'checklai';
  sortBy?: LeoMyReportsSortBy;
  sortDesc?: boolean;
}
