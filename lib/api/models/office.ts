import type { Geometry } from 'geojson';

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
  'Reopened',
  'Closed',
  'Rejected',
  'Duplicate',
] as const;

export type LeoMyReportsStatus = (typeof LEO_MY_REPORTS_STATUSES)[number];

/** Swagger query `severity`. */
export const LEO_MY_REPORTS_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export type LeoMyReportsSeverity = (typeof LEO_MY_REPORTS_SEVERITIES)[number];

/** Swagger query `assignmentStatus` & `assignments[].status`. */
export type LeoReportAssignmentStatus =
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Declined'
  | 'Escalated';

export const LEO_REPORT_ASSIGNMENT_STATUSES = [
  'Assigned',
  'InProgress',
  'Completed',
  'Declined',
  'Escalated',
] as const satisfies readonly LeoReportAssignmentStatus[];

/** Công ty được điều phối trên item GET /v1/offices/my/reports. */
export interface LeoMyReportAssignedCompany {
  companyId: string;
  companyName: string;
  dispatchedAt: string;
}

/** Waste tag gắn trên team — trả về trong assignments[].teamWasteTags. */
export interface LeoReportAssignmentWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
}

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
  isCompanyTeam: boolean;
  /** Waste tags của team được gán — Cleanup teams only. */
  teamWasteTags: LeoReportAssignmentWasteTag[];
  beforeImageUrls: string[];
  afterImageUrls: string[];
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
  assignedCompany: LeoMyReportAssignedCompany | null;
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

// ─── LEO — GET /v1/offices/my/ward-boundary ───────────────────────────────────

/**
 * `data` envelope của GET /v1/offices/my/ward-boundary.
 * `geometry` là Polygon/MultiPolygon ranh giới phường, đã parse sẵn từ `geoJson` (string) BE trả về.
 */
export interface LeoWardBoundary {
  wardCode: string;
  wardName: string;
  geometry: Geometry | null;
}

/**
 * Gợi ý sort phổ biến (Swagger `sortBy` là string tự do).
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

export const LEO_MY_REPORTS_TEAM_SCOPES = ['All', 'Company', 'Community'] as const;

export type LeoMyReportsTeamScope = (typeof LEO_MY_REPORTS_TEAM_SCOPES)[number];

/** Query GET /v1/offices/my/reports — khớp Swagger. */
export interface LeoMyReportsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /**
   * Filter status — BE hỗ trợ multi: `?status=InProgress&status=Resolved`.
   * Truyền 1 giá trị hoặc mảng.
   */
  status?: LeoMyReportsStatus | readonly LeoMyReportsStatus[];
  categoryId?: string;
  severity?: LeoMyReportsSeverity;
  assignmentStatus?: LeoReportAssignmentStatus;
  /** ISO date-time (`string($date-time)`). */
  fromDate?: string;
  /** ISO date-time (`string($date-time)`). */
  toDate?: string;
  /** Swagger: plain string — dùng `LeoMyReportsSortBy` làm gợi ý giá trị. */
  sortBy?: string;
  sortDesc?: boolean;
  /** All | Company | Community — bỏ trống = All. */
  teamScope?: LeoMyReportsTeamScope;
  /** Tracking luôn `false` để ẩn chương trình cộng đồng. */
  hasActiveCommunityCleanup?: boolean;
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

// ─── LEO — GET /v1/offices/my/staff/lookup ────────────────────────────────────

/** GET /v1/offices/my/staff/lookup — preview Citizen trước khi tuyển. */
export interface OfficeStaffLookupResult {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: string;
  isRecruitEligible: boolean;
  ineligibleReason: string | null;
}

// ─── LEO — POST /v1/offices/my/staff ──────────────────────────────────────────

/** Vai trò đích khi tuyển công dân vào LocalOffice (form chỉ Cleaner | Inspector). */
export type RecruitStaffTargetRole = 'Cleaner' | 'Inspector';

export interface RecruitOfficeStaffInput {
  email: string;
  targetRole: RecruitStaffTargetRole;
  /** Null khi tuyển vào văn phòng mà chưa gán đội. */
  teamId?: string | null;
  /** Optional — chỉ gửi lên BE khi có đội và caller set. */
  isLeader?: boolean;
}

/** POST /v1/offices/my/staff — kết quả tuyển nhân sự (lời mời / staff). */
export interface RecruitOfficeStaffResult {
  userId: string;
  email: string;
  fullName: string;
  assignedRole: string;
  localOfficeId: string;
  teamId: string | null;
  teamMemberId: string | null;
  isLeader: boolean;
}
