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
 * Swagger: `AssignmentProgressItem` — mỗi report có thể có nhiều assignment (re-assign / multi-team).
 */
export type LeoReportAssignmentStatusDto =
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Declined'
  | 'Escalated';

/** Swagger query/response `status`. */
export type LeoMyReportsStatusDto =
  | 'Submitted'
  | 'Verified'
  | 'InProgress'
  | 'Resolved'
  | 'Reopened'
  | 'Closed'
  | 'Rejected'
  | 'Duplicate';

/** Swagger query `severity`. */
export type LeoMyReportsSeverityDto = 'Low' | 'Medium' | 'High' | 'Critical';

/** GET /v1/offices/my/reports — assignments[].teamWasteTags[] — Swagger: `WasteTagSummaryDto`. */
export interface WasteTagSummaryDto {
  tagId: string;
  code?: string | null;
  nameVi?: string | null;
  nameEn?: string | null;
  iconUrl?: string | null;
}

/** @deprecated Dùng `WasteTagSummaryDto`. */
export type LeoReportAssignmentWasteTagDto = WasteTagSummaryDto;

/** GET /v1/offices/my/reports — items[].assignments[] — Swagger: `AssignmentProgressItem`. */
export interface AssignmentProgressItemDto {
  assignmentId: string;
  teamId: string;
  teamName?: string | null;
  teamType?: string | null;
  isCompanyTeam: boolean;
  status: LeoReportAssignmentStatusDto;
  progressPercent: number;
  progressNote?: string | null;
  note?: string | null;
  declineReason?: string | null;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  progressUpdatedAt?: string | null;
  teamWasteTags?: WasteTagSummaryDto[] | null;
  beforeImageUrls?: string[] | null;
  afterImageUrls?: string[] | null;
}

/** @deprecated Dùng `AssignmentProgressItemDto`. */
export type LeoMyReportAssignmentDto = AssignmentProgressItemDto;

/** GET /v1/offices/my/reports — items[].assignedCompany — Swagger: `OfficeAssignedCompanyItem`. */
export interface OfficeAssignedCompanyItemDto {
  companyId: string;
  companyName?: string | null;
  dispatchedAt?: string | null;
}

/** @deprecated Dùng `OfficeAssignedCompanyItemDto`. */
export type LeoMyReportAssignedCompanyDto = OfficeAssignedCompanyItemDto;

/** GET /v1/offices/my/reports — item — Swagger: `OfficeReportItem`. */
export interface OfficeReportItemDto {
  id: string;
  code?: string | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  severity: LeoMyReportsSeverityDto;
  status: LeoMyReportsStatusDto;
  latitude: number;
  longitude: number;
  address?: string | null;
  wardCode?: string | null;
  reporterId?: string | null;
  reporterName?: string | null;
  description?: string | null;
  assignmentCount: number;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  overallProgressPercent: number;
  createdAt: string;
  verifiedAt?: string | null;
  startedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  slaResolveDueAt?: string | null;
  thumbnails?: string[] | null;
  assignedCompany?: OfficeAssignedCompanyItemDto | null;
  assignments?: AssignmentProgressItemDto[] | null;
}

/** @deprecated Dùng `OfficeReportItemDto`. */
export type LeoMyReportItemDto = OfficeReportItemDto;

export interface LeoOfficePaginationDto {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** GET /v1/offices/my/reports — data envelope — Swagger: `GetOfficeReportsResponse`. */
export interface GetOfficeReportsResponseDto {
  localOfficeId: string;
  localOfficeName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  items?: OfficeReportItemDto[] | null;
  pagination: LeoOfficePaginationDto;
}

/** @deprecated Dùng `GetOfficeReportsResponseDto`. */
export type LeoMyReportsDataDto = GetOfficeReportsResponseDto;

/** GET /v1/offices/my/ward-boundary — data envelope */
export interface LeoWardBoundaryDto {
  wardCode: string;
  wardName: string;
  /** BE trả geometry (Polygon/MultiPolygon) đã stringify trực tiếp, không còn qua CDN. */
  geoJson?: string | null;
}

/** POST /v1/offices/my/staff — vai trò đích khi tuyển Citizen. */
export type RecruitStaffTargetRoleDto = 'Citizen' | 'Cleaner' | 'Inspector';

export interface RecruitOfficeStaffBodyDto {
  email: string;
  targetRole: RecruitStaffTargetRoleDto;
  teamId?: string | null;
  /** Optional — chỉ gửi khi có `teamId` / caller set. */
  isLeader?: boolean;
}

/** GET /v1/offices/my/staff — query `role` (Swagger enum). */
export type OfficeStaffRoleFilterDto =
  | 'Citizen'
  | 'DEO'
  | 'LEO'
  | 'Cleaner'
  | 'CompanyManager'
  | 'CompanyStaff'
  | 'Inspector'
  | 'Admin';

/** @deprecated Dùng `OfficeStaffRoleFilterDto` — giữ alias cho filter Cleaner | Inspector trong UI. */
export type OfficeStaffRoleDto = 'Cleaner' | 'Inspector';

/** GET /v1/offices/my/staff — item */
export interface OfficeStaffItemDto {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: OfficeStaffRoleFilterDto | string;
  teamId: string | null;
  teamName: string | null;
  isLeader: boolean;
  createdAt: string;
}

/** GET /v1/offices/my/staff — data envelope */
export interface OfficeStaffListDataDto {
  items: OfficeStaffItemDto[];
  pagination: LeoOfficePaginationDto;
}

export interface OfficeStaffListParamsDto {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: OfficeStaffRoleFilterDto;
  hasTeam?: boolean;
}

/** POST /v1/offices/my/staff — 200 data */
export interface RecruitOfficeStaffDataDto {
  userId: string;
  email: string;
  fullName: string;
  assignedRole: RecruitStaffTargetRoleDto;
  localOfficeId: string;
  teamId: string | null;
  teamMemberId: string | null;
  isLeader?: boolean;
}

/** GET /v1/offices/my/staff/lookup — tra cứu Citizen theo email (exact). */
export interface OfficeStaffLookupDataDto {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  isRecruitEligible: boolean;
  ineligibleReason?: string | null;
}
