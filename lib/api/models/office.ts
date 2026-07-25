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

/** Swagger query/response `status` — GET /v1/offices/my/reports. */
export const LEO_MY_REPORTS_STATUSES = [
  'Submitted',
  'Verified',
  'InProgress',
  'Resolved',
  'Closed',
  'Rejected',
  'Duplicate',
] as const;

export type LeoMyReportsStatus = (typeof LEO_MY_REPORTS_STATUSES)[number];

/** Swagger query `severity`. */
export const LEO_MY_REPORTS_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export type LeoMyReportsSeverity = (typeof LEO_MY_REPORTS_SEVERITIES)[number];

/** Swagger query `assignmentStatus` & `assignments[].status`. */
export type LeoReportAssignmentStatus = 'Assigned' | 'InProgress' | 'Completed' | 'Declined';

export const LEO_REPORT_ASSIGNMENT_STATUSES = [
  'Assigned',
  'InProgress',
  'Completed',
  'Declined',
] as const satisfies readonly LeoReportAssignmentStatus[];

/** Một assignment trong `LeoMyReportItem.assignments[]`. */
export interface LeoMyReportAssignment {
  assignmentId: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: LeoReportAssignmentStatus;
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
  severity: LeoMyReportsSeverity;
  status: LeoMyReportsStatus;
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
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaResolveDueAt: string | null;
  /** Thumbnail URLs for report media; empty when BE omits the field. */
  thumbnails: string[];
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
  status?: LeoMyReportsStatus;
  categoryId?: string;
  severity?: LeoMyReportsSeverity;
  assignmentStatus?: LeoReportAssignmentStatus;
  sortBy?: LeoMyReportsSortBy;
  sortDesc?: boolean;
}

// ─── LEO — GET /v1/offices/my/staff ───────────────────────────────────────────

/** Query `role` — khớp Swagger GET /v1/offices/my/staff. */
export type OfficeStaffRoleFilter =
  | 'Citizen'
  | 'DEO'
  | 'LEO'
  | 'Cleaner'
  | 'CompanyManager'
  | 'CompanyStaff'
  | 'Inspector'
  | 'Admin';

/** Vai trò gán đội theo `teamType` (Cleanup → Cleaner, Inspection → Inspector). */
export type OfficeStaffAssignRole = 'Cleaner' | 'Inspector';

/** @deprecated Dùng `OfficeStaffAssignRole` hoặc `OfficeStaffRoleFilter`. */
export type OfficeStaffRole = OfficeStaffAssignRole;

/** Một nhân sự trong danh sách GET /v1/offices/my/staff. */
export interface OfficeStaffMember {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: OfficeStaffRoleFilter;
  teamId: string | null;
  teamName: string | null;
  isLeader: boolean;
  createdAt: string;
}

/** `data` envelope của GET /v1/offices/my/staff. */
export interface OfficeStaffList {
  items: OfficeStaffMember[];
  pagination: PaginationMeta;
}

export interface OfficeStaffListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: OfficeStaffRoleFilter;
  hasTeam?: boolean;
}

// ─── LEO — POST /v1/offices/my/staff ──────────────────────────────────────────

/** Vai trò đích khi tuyển công dân vào LocalOffice (form chỉ Cleaner | Inspector). */
export type RecruitStaffTargetRole = 'Cleaner' | 'Inspector';

export interface RecruitOfficeStaffInput {
  email: string;
  targetRole: RecruitStaffTargetRole;
  /** Null khi tuyển vào văn phòng mà chưa gán đội. */
  teamId?: string | null;
  /** `false` khi `teamId` null; có đội thì theo toggle trưởng nhóm. */
  isLeader?: boolean;
}

/** POST /v1/offices/my/staff — kết quả tuyển nhân sự. */
export interface RecruitOfficeStaffResult {
  userId: string;
  email: string;
  fullName: string;
  assignedRole: string;
  localOfficeId: string;
  teamId: string | null;
  teamMemberId: string | null;
}
