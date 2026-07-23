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
  phone: string;
  email: string;
  serviceAreaCount: number;
  staffCount: number;
}

export interface MyWardCompanies {
  companies: MyWardCompanyItem[];
}

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
}

export interface CreateCompanyTeamInput {
  name: string;
}

export interface RenameCompanyTeamInput {
  name: string;
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
}

export interface CompanyTeamsList {
  items: CompanyTeamListItem[];
  pagination: CompanyStaffPagination;
}

export interface CompanyTeamsListParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface UpdateCompanyStaffStatusInput {
  isActive: boolean;
}

export interface AddCompanyTeamMemberInput {
  userId: string;
  isLeader?: boolean;
}

export interface CompanyTeamMembership {
  memberId: string;
  teamId: string;
  userId: string;
  isLeader: boolean;
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

export interface CompanyQueueItem {
  reportId: string;
  code: string;
  address: string;
  wardCode: string;
  categoryName: string;
  severity: CompanyQueueSeverity;
  dispatchedAt: string;
  slaResolveDueAt: string;
}

export interface CompanyQueueList {
  items: CompanyQueueItem[];
  pagination: CompanyStaffPagination;
}

export interface CompanyQueueParams {
  page?: number;
  pageSize?: number;
  severity?: string;
}

/** Body POST /v1/reports/{id}/assign-company-team — [CompanyManager]. */
export interface AssignCompanyTeamInput {
  teams: { teamId: string; note?: string }[];
}

/** Assignment status — task phân công cho đội. */
export type CompanyAssignmentStatus = 'Assigned' | 'InProgress' | 'Completed' | 'Declined' | string;

export interface CompanyAssignmentReportSummary {
  reportId: string;
  code: string;
  address: string;
  wardCode?: string;
  categoryName: string;
  severity: CompanyQueueSeverity;
  status: string;
  slaResolveDueAt: string;
}

export interface CompanyAssignmentTeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
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

export interface CompanyAssignmentsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  reportStatus?: string;
  search?: string;
}

export interface CompanyAssignmentMediaItem {
  url: string;
  uploadedAt: string;
}

export interface CompanyAssignmentMedia {
  beforeImages: CompanyAssignmentMediaItem[];
  progressImages: CompanyAssignmentMediaItem[];
  afterImages: CompanyAssignmentMediaItem[];
}

export interface CompanyAssignmentSla {
  resolveDueAt: string;
  hoursRemaining: number;
  isBreached: boolean;
  severityLabel: string;
}

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
  isLeader: boolean;
}

export interface CompanyAssignmentTeamDetail {
  assignmentId: string;
  status: CompanyAssignmentStatus;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string | null;
  declineReason?: string | null;
  progressPercent: number;
  progressNote?: string | null;
  progressUpdatedAt?: string | null;
  progressUpdatedByName?: string | null;
  teamId: string;
  teamName: string;
  members: CompanyAssignmentTeamMember[];
  assignedByName: string;
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
  iconUrl?: string | null;
}

export interface CompanyAssignmentDetail {
  reportId: string;
  code: string;
  status: string;
  severity: CompanyQueueSeverity;
  categoryName: string;
  description: string;
  address: string;
  wardCode?: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  dispatchedToCompanyAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedCount: number;
  sla: CompanyAssignmentSla;
  summary: CompanyAssignmentProgressSummary;
  media: CompanyAssignmentMedia;
  teamAssignments: CompanyAssignmentTeamDetail[];
  timeline: CompanyAssignmentTimelineEntry[];
  wasteTags: CompanyAssignmentWasteTag[];
}
