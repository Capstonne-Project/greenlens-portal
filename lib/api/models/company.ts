/** FE models — công ty DVMT (officer) + Company Manager dashboard (dev). */

/** POST /v1/companies — `contractType` enum. */
export const COMPANY_CONTRACT_TYPES = ['Subsidiary', 'Bidding'] as const;

export type CompanyContractType = (typeof COMPANY_CONTRACT_TYPES)[number];

export type CompanyStatus = 'PendingActivation' | 'Active' | 'Suspended' | 'Expired' | string;

/** GET /v1/companies — item */
export interface CompanyListItem {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
  createdAt: string;
}

export interface CompanyPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompaniesList {
  items: CompanyListItem[];
  pagination: CompanyPagination;
}

/** POST /v1/companies */
export interface CreateCompanyInput {
  name: string;
  departmentId: string;
  contractNumber: string;
  contractStartDate: string;
  contractEndDate: string | null;
  contractType: CompanyContractType;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  managerEmail?: string;
  managerFullName?: string;
  wardCodes?: string[];
}

/** POST /v1/companies — 201 data */
export interface CreatedCompany {
  companyId: string;
  companyName: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  managerUserId: string;
  managerEmail: string;
  tempPassword: string;
}

export interface CompaniesListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export const COMPANIES_PAGE_SIZE = 10;

/** GET /v1/companies/my-ward — [LEO] công ty phục vụ phường/xã của LEO. */
export interface MyWardCompanyItem {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
  activeReportCount: number;
  createdAt: string;
}

export interface MyWardCompaniesListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  contractType?: string;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export const MY_WARD_COMPANIES_PAGE_SIZE = 10;

export interface MyWardCompaniesList {
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  items: MyWardCompanyItem[];
  pagination: CompanyPagination;
}

/** GET /v1/companies/my-ward/{id} — chi tiết công ty trong phường của LEO. */
export interface MyWardCompanyDetail {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activatedAt: string | null;
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  wardServiceArea: CompanyServiceArea | null;
  allServiceAreas: CompanyServiceArea[];
  staffCount: number;
  teamCount: number;
  activeReportCount: number;
  completedReportCount: number;
  createdAt: string;
}

/** @deprecated Dùng `MyWardCompaniesList`. */
export type MyWardCompanies = MyWardCompaniesList;

/** GET /v1/companies/{id}/service-areas */
export interface CompanyServiceAreas {
  wardCodes: string[];
}

/** PUT /v1/companies/{id}/service-areas */
export interface UpdateCompanyServiceAreasInput {
  wardCodes: string[];
}

/** POST /v1/companies/{id}/suspend — [DEO/Admin] tạm ngưng công ty (Active → Suspended). */
export interface SuspendCompanyInput {
  reason: string;
}

/** POST /v1/companies/{id}/renew-contract — [DEO/Admin] gia hạn HĐ Bidding (Expired → Active). */
export interface RenewCompanyContractInput {
  newStartDate: string;
  newEndDate: string;
  newContractNumber: string;
  note: string;
}

/** POST /v1/companies/{id}/renew-contract — 200 data */
export interface RenewCompanyContractResult {
  contractPeriodId: string;
  companyStatus: CompanyStatus;
}

/** GET /v1/companies/{id} — địa bàn phụ trách (phường/xã). */
export interface CompanyServiceArea {
  id: string;
  wardCode: string;
  wardName: string;
  provinceCode: string;
}

/** GET /v1/companies/{id} — chi tiết công ty DVMT. */
export interface CompanyDetail {
  id: string;
  name: string;
  contractNumber: string;
  contractType: CompanyContractType;
  status: CompanyStatus;
  contractStartDate: string;
  contractEndDate: string | null;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activatedAt: string | null;
  serviceAreas: CompanyServiceArea[];
  staffCount: number;
  createdAt: string;
}

/** FE models — Company Manager dashboard. */

export interface MyCompany {
  id: string;
  name: string;
  contractNumber: string;
  contractType: string;
  status: string;
  contractStartDate: string;
  contractEndDate: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activatedAt?: string | null;
  serviceAreas: CompanyServiceArea[];
  staffCount: number;
  createdAt: string;
}

export interface CompanyStaffItem {
  userId: string;
  email: string;
  fullName: string;
  position: string;
  isActive: boolean;
  teamName?: string | null;
  teamId?: string | null;
  createdAt: string;
}

export interface CompanyStaffPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CompanyStaffList {
  items: CompanyStaffItem[];
  pagination: CompanyStaffPagination;
}

export interface CompanyStaffListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface CreateCompanyStaffInput {
  email: string;
  fullName: string;
  position: string;
  teamId?: string;
}

export interface CreateCompanyStaffResult {
  userId: string;
  email: string;
  fullName: string;
  tempPassword: string;
  companyId: string;
  position: string;
  teamId?: string | null;
}

export interface CompanyTeam {
  id: string;
  name: string;
  companyId: string;
  teamType: string;
  wasteTags: CompanyTeamWasteTag[];
}

/** Waste tag trả về trong company team responses. */
export interface CompanyTeamWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
}

export interface CreateCompanyTeamInput {
  name: string;
  /** Bắt buộc, min 1 tag. */
  wasteTagIds: string[];
}

/** PUT /v1/teams/company-teams/{id} — cập nhật tên + wasteTagIds (optional replace). */
export interface UpdateCompanyTeamInput {
  name: string;
  wasteTagIds?: string[];
}

/** PUT /v1/teams/company-teams/{id}/archive — [CompanyManager]. */
export interface ArchiveCompanyTeamInput {
  isActive: boolean;
}

/** GET /v1/companies/my/contract-history & GET /v1/companies/{id}/contract-history — một kỳ hợp đồng. */
export interface CompanyContractPeriod {
  id: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  renewedByUserId: string | null;
  renewedByName: string | null;
  note: string | null;
  createdAt: string;
}

/** GET /v1/companies/my/contract-history & GET /v1/companies/{id}/contract-history — data. */
export interface MyCompanyContractHistory {
  companyId: string;
  companyName: string;
  periods: CompanyContractPeriod[];
}

/** Alias — DEO xem lịch sử theo companyId. */
export type CompanyContractHistory = MyCompanyContractHistory;

/** GET /v1/companies/my/kpi — query. */
export interface MyCompanyKpiParams {
  from?: string;
  to?: string;
  period?: string;
}

/** GET /v1/companies/my/kpi — data. */
export interface MyCompanyKpi {
  companyId: string;
  companyName: string;
  periodFrom: string;
  periodTo: string;
  totalAssigned: number;
  totalCompleted: number;
  totalDeclined: number;
  completedOnTime: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
}

export interface CompanyTeamOption {
  id: string;
  name: string;
}

export interface CompanyTeamListItem {
  id: string;
  name: string;
  teamType: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  /** BE thường trả "LEO {tên phường}" — FE format thành "Phường …". */
  officeName?: string | null;
  /** Cleanup teams only — tags đội phụ trách. */
  wasteTags: CompanyTeamWasteTag[];
  /** Số tag khớp với report khi filter theo reportId. */
  wasteTagMatchCount: number;
}

export interface CompanyTeamsList {
  items: CompanyTeamListItem[];
  pagination: CompanyStaffPagination;
}

export interface CompanyTeamsListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  /** Multi-filter OR — trả về đội có bất kỳ tag nào trong danh sách. */
  wasteTagIds?: string[];
  /** Khi có reportId → sort theo wasteTagMatchCount desc. */
  reportId?: string;
}

export interface UpdateCompanyStaffStatusInput {
  isActive: boolean;
}

/** POST /v1/teams/company-teams/{teamId}/members — [CompanyManager]. */
export interface AddCompanyTeamMemberInput {
  userId: string;
  isLeader?: boolean;
}

/**
 * DELETE /v1/teams/company-teams/{teamId}/members/{userId}
 * [CompanyManager] Xóa nhân viên khỏi team công ty.
 * User vẫn thuộc công ty (CompanyStaff không đổi) — chỉ rời team.
 */
export interface RemoveCompanyTeamMemberInput {
  /** Path: teamId (uuid) */
  teamId: string;
  /** Path: userId (uuid) */
  userId: string;
}

export interface CompanyTeamMembership {
  memberId: string;
  teamId: string;
  userId: string;
  isLeader: boolean;
}

/** GET /v1/teams/company-teams/{id} — 200 data. */
export interface CompanyTeamDetail {
  id: string;
  name: string;
  teamType: string;
  companyId: string;
  isActive: boolean;
  memberCount: number;
  members: CompanyTeamDetailMember[];
  wasteTags: CompanyTeamWasteTag[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyTeamDetailMember {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isLeader: boolean;
  joinedAt: string;
}

export interface AssignCompanyStaffTeamInput {
  /** Staff user to assign into a company team. */
  userId: string;
  /** Target team to assign into. */
  teamId: string;
  /** Current team of the staff, if any. Delete from this team before assigning when different. */
  currentTeamId?: string | null;
  isLeader?: boolean;
}

export type CompanyQueueSeverity = 'Low' | 'Medium' | 'High' | 'Critical' | string;

/** Sort fields supported by GET /v1/reports/company-queue (Swagger). */
export type CompanyQueueSortBy =
  | 'priorityScore'
  | 'dispatchedAt'
  | 'verifiedAt'
  | 'severity'
  | 'code'
  | 'createdAt'
  | 'slaResolveDueAt'
  | string;

export interface CompanyQueueMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

/** GET /v1/reports/company-queue item — tasks chờ phân công đội. */
export interface CompanyQueueItem {
  reportId: string;
  code: string;
  address: string;
  wardCode: string;
  provinceCode?: string | null;
  latitude: number;
  longitude: number;
  categoryName: string;
  severity: CompanyQueueSeverity;
  dispatchedAt: string;
  verifiedAt?: string | null;
  verifiedByName?: string | null;
  slaResolveDueAt: string;
  media: CompanyQueueMedia[];
  /** Derived — media[0].thumbnailUrl ?? media[0].url */
  thumbnailUrl?: string | null;
}

export interface CompanyQueueList {
  items: CompanyQueueItem[];
  pagination: CompanyStaffPagination;
}

/**
 * Query GET /v1/reports/company-queue.
 * Search: code, address, ward, categoryName.
 * fromDate/toDate filter theo `dispatchedAt` (LEO điều phối).
 * Default BE: sortBy=priorityScore desc (FE may pass explicitly).
 */
export interface CompanyQueueParams {
  page?: number;
  pageSize?: number;
  search?: string;
  severity?: CompanyQueueSeverity;
  wardCode?: string;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: CompanyQueueSortBy;
  sortDesc?: boolean;
}

/** Body POST /v1/reports/{id}/assign-company-team — [CompanyManager]. */
export interface AssignCompanyTeamInput {
  teams: { teamId: string; note?: string }[];
}

/**
 * Body PUT /v1/reports/{id}/reassign-company-team — [CompanyManager]
 * phân công lại sau Declined / Assigned (chưa nhận). `reason` ≥ 20 ký tự.
 */
export interface ReassignCompanyTeamInput {
  oldTeamId: string;
  newTeamId: string;
  reason: string;
}

/** Assignment status — task phân công cho đội (Swagger company-assignments). */
export type CompanyAssignmentStatus =
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Declined'
  | 'Escalated'
  | string;

/** Văn phòng / LEO điều phối — list `report.dispatchSource`, detail `dispatchSource`. */
export interface CompanyAssignmentDispatchSource {
  localOfficeId: string;
  localOfficeName: string;
  wardCode: string;
  wardName: string;
  leoUserId: string;
  leoFullName: string;
}

/** Waste tag trên đội — list `team.wasteTags`, detail `assignment.teamWasteTags`. */
export interface CompanyAssignmentTeamWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string | null;
  iconUrl: string | null;
}

/** Canonical first media from list `report.firstMedia`. */
export interface CompanyAssignmentFirstMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

export interface CompanyAssignmentReportSummary {
  reportId: string;
  code: string;
  address: string;
  wardCode?: string;
  categoryName: string;
  severity: CompanyQueueSeverity;
  status: string;
  slaResolveDueAt: string;
  dispatchSource: CompanyAssignmentDispatchSource | null;
  /** Canonical cover from Swagger list (`report.firstMedia`). */
  firstMedia?: CompanyAssignmentFirstMedia | null;
  /** Derived — firstMedia.thumbnailUrl ?? firstMedia.url hoặc fallback legacy. */
  thumbnailUrl?: string | null;
  /** Derived images for UI (from firstMedia + legacy fields). */
  reportImages: CompanyAssignmentMediaItem[];
}

export interface CompanyAssignmentTeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  wasteTags: CompanyAssignmentTeamWasteTag[];
  members: CompanyAssignmentTeamMember[];
}

export interface CompanyAssignmentListItem {
  assignmentId: string;
  assignmentStatus: CompanyAssignmentStatus;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  note?: string | null;
  report: CompanyAssignmentReportSummary;
  team: CompanyAssignmentTeamSummary;
  assignedByName: string;
}

export interface CompanyAssignmentsList {
  items: CompanyAssignmentListItem[];
  pagination: CompanyStaffPagination;
}

/** Sort fields — GET /v1/reports/company-assignments (Swagger). */
export type CompanyAssignmentsSortBy =
  | 'assignedAt'
  | 'code'
  | 'severity'
  | 'reportStatus'
  | 'status'
  | 'progressPercent'
  | 'startedAt'
  | 'completedAt'
  | 'slaResolveDueAt'
  | 'teamName'
  | string;

/**
 * Query GET /v1/reports/company-assignments.
 * Search: code, address, ward, categoryName, teamName.
 * fromDate/toDate filter theo `assignedAt`.
 */
export interface CompanyAssignmentsParams {
  page?: number;
  pageSize?: number;
  /** Assignment status. */
  status?: CompanyAssignmentStatus;
  reportStatus?: string;
  search?: string;
  severity?: CompanyQueueSeverity;
  wardCode?: string;
  categoryId?: string;
  teamId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: CompanyAssignmentsSortBy;
  sortDesc?: boolean;
}

export interface CompanyAssignmentMediaItem {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  mediaType?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedAt: string;
}

/**
 * FE media buckets.
 * - beforeImages / afterImages: wire from `media`
 * - progressImages: **derived** — flatMap `assignment.progressUpdates[].images` (legacy `media.progressImages` fallback)
 */
export interface CompanyAssignmentMedia {
  beforeImages: CompanyAssignmentMediaItem[];
  /** Derived from progressUpdates (or legacy wire). */
  progressImages: CompanyAssignmentMediaItem[];
  afterImages: CompanyAssignmentMediaItem[];
}

export interface CompanyAssignmentSla {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

/** Aggregated team progress — wire `summary` if present, else **derived** from singular `assignment`. */
export interface CompanyAssignmentProgressSummary {
  totalTeams: number;
  acceptedTeams: number;
  completedTeams: number;
  declinedTeams: number;
  pendingTeams: number;
  overallProgressPercent: number;
  startedAt?: string | null;
}

export interface CompanyAssignmentTeamMember {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  isLeader: boolean;
  joinedAt?: string | null;
}

/** Wire: one progress update inside `assignment.progressUpdates`. */
export interface CompanyAssignmentProgressUpdate {
  id: string;
  progressPercent: number;
  progressNote?: string | null;
  updatedAt: string;
  updatedByUserId: string;
  updatedByName: string;
  images: CompanyAssignmentMediaItem[];
}

/** Wire: `citizenMedia[]` item (same shape as list firstMedia). */
export interface CompanyAssignmentCitizenMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  uploadedAt: string;
}

/** Wire: singular `assignment` (also used as element of derived `teamAssignments`). */
export interface CompanyAssignmentTeamDetail {
  assignmentId: string;
  status: CompanyAssignmentStatus;
  assignedAt: string;
  /** Thời điểm nhận việc — step «Đội nhận việc». */
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  declineReason?: string | null;
  checkedInAt?: string | null;
  checkedInLatitude?: number | null;
  checkedInLongitude?: number | null;
  checkedInNote?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  progressUpdatedByName?: string | null;
  teamId: string;
  teamName: string;
  teamLeaderName?: string | null;
  teamWasteTags: CompanyAssignmentTeamWasteTag[];
  members: CompanyAssignmentTeamMember[];
  assignedByName: string;
  progressUpdates: CompanyAssignmentProgressUpdate[];
}

/** Wire: `assignmentHistory[]` — lịch sử phân công / reassign. */
export interface CompanyAssignmentHistoryEntry {
  assignmentId: string;
  teamId: string;
  teamName: string;
  status: CompanyAssignmentStatus;
  assignedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  declineReason?: string | null;
  note?: string | null;
  teamWasteTags: CompanyAssignmentTeamWasteTag[];
}

export interface CompanyAssignmentTimelineEntry {
  timestamp: string;
  fromStatus?: string | null;
  toStatus: string;
  changedByName?: string | null;
  reason?: string | null;
}

export interface CompanyAssignmentWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  iconUrl?: string | null;
}

/**
 * GET `/v1/reports/company-reports/{reportId}` — hàng đợi phân công CM (canonical).
 * GET `/v1/reports/company-assignments/{reportId}` — theo dõi tiến độ (cùng shape).
 *
 * Wire 1:1 Swagger: reportId…wasteTags, citizenMedia, assignment, media.before/after,
 * assignmentHistory, canReassign, priorityScore, sla, timeline.
 * Derived (không có trên wire):
 * - reportImages ← citizenMedia urls (thumbnailUrl ?? url for images) + legacy fallbacks
 * - teamAssignments ← assignment ? [assignment] : legacy teamAssignments
 * - summary ← legacy summary OR derived from assignment
 * - media.progressImages ← flatMap assignment.progressUpdates[].images (+ legacy)
 */
export interface CompanyAssignmentDetail {
  reportId: string;
  code: string;
  status: string;
  severity: CompanyQueueSeverity;
  categoryName: string;
  description: string;
  address: string;
  wardCode?: string | null;
  /** Wire */
  provinceCode?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  /** Wire */
  verifiedAt?: string | null;
  /** Wire */
  verifiedByName?: string | null;
  dispatchedToCompanyAt?: string | null;
  dispatchSource: CompanyAssignmentDispatchSource | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedCount: number;
  priorityScore: number;
  sla: CompanyAssignmentSla;
  /** Wire citizen media (normalized). */
  citizenMedia: CompanyAssignmentCitizenMedia[];
  /** Wire singular assignment (null when unassigned / legacy-only). */
  assignment: CompanyAssignmentTeamDetail | null;
  media: CompanyAssignmentMedia;
  assignmentHistory: CompanyAssignmentHistoryEntry[];
  canReassign: boolean;
  /**
   * Derived — urls from citizenMedia (image type: thumbnailUrl ?? url).
   * Kept for gallery UI that expects `{ url, uploadedAt }[]`.
   */
  reportImages: CompanyAssignmentMediaItem[];
  /**
   * Derived — `[assignment]` when present, else legacy `teamAssignments`.
   * Kept for CompanyTrackingDetailTab multi-team UI.
   */
  teamAssignments: CompanyAssignmentTeamDetail[];
  /** Derived from assignment when wire has no summary. */
  summary: CompanyAssignmentProgressSummary;
  timeline: CompanyAssignmentTimelineEntry[];
  wasteTags: CompanyAssignmentWasteTag[];
}
