/**
 * L2 — Companies (officer) + Company Manager (dev portal).
 */
import {
  adaptAddCompanyTeamMember,
  adaptArchiveCompanyTeam,
  adaptAssignCompanyTeam,
  adaptCompanyAssignmentDetail,
  adaptCompanyAssignments,
  adaptCompanyQueue,
  adaptCompanyStaffList,
  adaptCompanyTeamsList,
  adaptCreateCompanyStaff,
  adaptCreateCompanyTeam,
  adaptMyCompany,
  adaptMyCompanyContractHistory,
  adaptMyCompanyKpi,
  adaptRenameCompanyTeam,
  adaptRemoveCompanyTeamMember,
  adaptUpdateCompanyStaffStatus,
} from '@/lib/api/adapters/company.adapter';
import {
  adaptCompaniesList,
  adaptCompanyContractHistory,
  adaptCompanyDetail,
  adaptCreateCompany,
  adaptDeleteCompany,
  adaptFetchCompanyServiceAreas,
  adaptMyWardCompanies,
  adaptReactivateCompany,
  adaptRenewCompanyContract,
  adaptSuspendCompany,
  adaptUpdateCompanyServiceAreas,
} from '@/lib/api/adapters/companies.adapter';
import type {
  AddCompanyTeamMemberInput,
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompaniesList,
  CompaniesListParams,
  CompanyAssignmentDetail,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyContractHistory,
  CompanyDetail,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyServiceAreas,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeam,
  CompanyTeamMembership,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyInput,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  CreatedCompany,
  MyCompany,
  MyCompanyContractHistory,
  MyCompanyKpi,
  MyCompanyKpiParams,
  MyWardCompanies,
  RenameCompanyTeamInput,
  RenewCompanyContractInput,
  RenewCompanyContractResult,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AddCompanyTeamMemberInput,
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompaniesList,
  CompaniesListParams,
  CompanyAssignmentDetail,
  CompanyAssignmentListItem,
  CompanyAssignmentMedia,
  CompanyAssignmentProgressSummary,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyAssignmentStatus,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTimelineEntry,
  CompanyAssignmentWasteTag,
  CompanyContractPeriod,
  CompanyContractType,
  COMPANY_CONTRACT_TYPES,
  CompanyDetail,
  CompanyListItem,
  CompanyPagination,
  CompanyQueueItem,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyQueueSeverity,
  CompanyServiceArea,
  CompanyServiceAreas,
  CompanyStaffItem,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyStatus,
  COMPANIES_PAGE_SIZE,
  CompanyTeam,
  CompanyTeamListItem,
  CompanyTeamMembership,
  CompanyTeamOption,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyInput,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  CreatedCompany,
  MyCompany,
  MyCompanyContractHistory,
  MyCompanyKpi,
  MyCompanyKpiParams,
  MyWardCompanies,
  MyWardCompanyItem,
  RenameCompanyTeamInput,
  RenewCompanyContractInput,
  RenewCompanyContractResult,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';

/** GET /v1/companies — danh sách công ty DVMT (phân trang, tìm kiếm). */
export async function fetchCompanies(
  params?: CompaniesListParams
): Promise<ApiEnvelope<CompaniesList>> {
  return adaptCompaniesList(params);
}

/** GET /v1/companies/my-ward — [LEO] công ty phục vụ phường/xã của LEO. */
export async function fetchMyWardCompanies(): Promise<ApiEnvelope<MyWardCompanies>> {
  return adaptMyWardCompanies();
}

/** POST /v1/companies — tạo công ty DVMT + tài khoản CM. */
export async function createCompany(
  body: CreateCompanyInput
): Promise<ApiEnvelope<CreatedCompany>> {
  return adaptCreateCompany(body);
}

/** GET /v1/companies/{id} — chi tiết công ty DVMT. */
export async function fetchCompanyDetail(companyId: string): Promise<ApiEnvelope<CompanyDetail>> {
  return adaptCompanyDetail(companyId);
}

/** GET /v1/companies/{id}/service-areas — danh sách phường phụ trách. */
export async function fetchCompanyServiceAreas(
  companyId: string
): Promise<ApiEnvelope<CompanyServiceAreas>> {
  return adaptFetchCompanyServiceAreas(companyId);
}

/** PUT /v1/companies/{id}/service-areas — cập nhật địa bàn phụ trách (thay thế toàn bộ). */
export async function updateCompanyServiceAreas(
  companyId: string,
  body: UpdateCompanyServiceAreasInput
): Promise<void> {
  return adaptUpdateCompanyServiceAreas(companyId, body);
}

/** DELETE /v1/companies/{id} — soft delete (vô hiệu hóa công ty). */
export async function deleteCompany(id: string): Promise<void> {
  return adaptDeleteCompany(id);
}

/** POST /v1/companies/{id}/suspend — [DEO/Admin] tạm ngưng công ty (Active → Suspended). */
export async function suspendCompany(
  id: string,
  body: SuspendCompanyInput
): Promise<ApiEnvelope<string | null>> {
  return adaptSuspendCompany(id, body);
}

/** POST /v1/companies/{id}/reactivate — [DEO/Admin] kích hoạt lại (Suspended → Active). */
export async function reactivateCompany(id: string): Promise<ApiEnvelope<string | null>> {
  return adaptReactivateCompany(id);
}

/** POST /v1/companies/{id}/renew-contract — [DEO/Admin] gia hạn HĐ Bidding. */
export async function renewCompanyContract(
  id: string,
  body: RenewCompanyContractInput
): Promise<ApiEnvelope<RenewCompanyContractResult>> {
  return adaptRenewCompanyContract(id, body);
}

/** GET /v1/companies/{id}/contract-history — lịch sử kỳ hợp đồng (DEO/Admin). */
export async function fetchCompanyContractHistory(
  companyId: string
): Promise<ApiEnvelope<CompanyContractHistory>> {
  return adaptCompanyContractHistory(companyId);
}

export async function fetchMyCompany(): Promise<ApiEnvelope<MyCompany>> {
  return adaptMyCompany();
}

export async function fetchCompanyStaff(
  params?: CompanyStaffListParams
): Promise<ApiEnvelope<CompanyStaffList>> {
  return adaptCompanyStaffList(params);
}

export async function createCompanyStaff(
  body: CreateCompanyStaffInput
): Promise<ApiEnvelope<CreateCompanyStaffResult>> {
  return adaptCreateCompanyStaff(body);
}

export async function updateCompanyStaffStatus(
  userId: string,
  body: UpdateCompanyStaffStatusInput
): Promise<ApiEnvelope<string | null>> {
  return adaptUpdateCompanyStaffStatus(userId, body);
}

export async function addCompanyTeamMember(
  teamId: string,
  body: AddCompanyTeamMemberInput
): Promise<ApiEnvelope<CompanyTeamMembership>> {
  return adaptAddCompanyTeamMember(teamId, {
    userId: body.userId,
    isLeader: body.isLeader ?? false,
  });
}

export async function removeCompanyTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  return adaptRemoveCompanyTeamMember(teamId, userId);
}

/**
 * Gán / chuyển nhân viên vào team công ty.
 * Move A→B: DELETE khỏi team cũ rồi POST vào team mới (không atomic — nếu POST fail sau DELETE, staff tạm không thuộc team).
 */
export async function assignCompanyStaffTeam(
  input: AssignCompanyStaffTeamInput
): Promise<ApiEnvelope<CompanyTeamMembership>> {
  if (input.currentTeamId && input.currentTeamId === input.teamId) {
    throw new Error('Nhân viên đã thuộc đội này');
  }

  if (input.currentTeamId) {
    await removeCompanyTeamMember(input.currentTeamId, input.userId);
  }

  return addCompanyTeamMember(input.teamId, {
    userId: input.userId,
    isLeader: input.isLeader ?? false,
  });
}

export async function fetchCompanyTeams(
  params?: CompanyTeamsListParams
): Promise<ApiEnvelope<CompanyTeamsList>> {
  return adaptCompanyTeamsList(params);
}

export async function createCompanyTeam(
  body: CreateCompanyTeamInput
): Promise<ApiEnvelope<CompanyTeam>> {
  return adaptCreateCompanyTeam(body);
}

export async function renameCompanyTeam(
  id: string,
  body: RenameCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  return adaptRenameCompanyTeam(id, body);
}

/** PUT /v1/teams/company-teams/{id}/archive — đóng/mở team công ty. */
export async function archiveCompanyTeam(
  id: string,
  body: ArchiveCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  return adaptArchiveCompanyTeam(id, body);
}

/** GET /v1/companies/my/contract-history — lịch sử kỳ hợp đồng công ty CM. */
export async function fetchMyCompanyContractHistory(): Promise<
  ApiEnvelope<MyCompanyContractHistory>
> {
  return adaptMyCompanyContractHistory();
}

/** GET /v1/companies/my/kpi — KPI công ty của CM. */
export async function fetchMyCompanyKpi(
  params?: MyCompanyKpiParams
): Promise<ApiEnvelope<MyCompanyKpi>> {
  return adaptMyCompanyKpi(params);
}

export async function fetchCompanyQueue(
  params?: CompanyQueueParams
): Promise<ApiEnvelope<CompanyQueueList>> {
  return adaptCompanyQueue(params);
}

export async function fetchCompanyAssignments(
  params?: CompanyAssignmentsParams
): Promise<ApiEnvelope<CompanyAssignmentsList>> {
  return adaptCompanyAssignments(params);
}

export async function fetchCompanyAssignmentDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  return adaptCompanyAssignmentDetail(reportId);
}

/**
 * POST /v1/reports/{id}/assign-company-team — [CompanyManager] phân công team công ty
 * (Verified → InProgress). Khác với `assignReport` (LEO → POST .../assign).
 */
export async function assignCompanyTeam(
  reportId: string,
  body: AssignCompanyTeamInput
): Promise<void> {
  return adaptAssignCompanyTeam(reportId, body);
}

const companyApi = {
  fetchCompanies,
  fetchMyWardCompanies,
  fetchCompanyDetail,
  createCompany,
  deleteCompany,
  suspendCompany,
  reactivateCompany,
  renewCompanyContract,
  fetchCompanyContractHistory,
  fetchCompanyServiceAreas,
  updateCompanyServiceAreas,
  fetchMyCompany,
  fetchCompanyStaff,
  createCompanyStaff,
  updateCompanyStaffStatus,
  addCompanyTeamMember,
  removeCompanyTeamMember,
  assignCompanyStaffTeam,
  fetchCompanyTeams,
  createCompanyTeam,
  renameCompanyTeam,
  archiveCompanyTeam,
  fetchMyCompanyContractHistory,
  fetchMyCompanyKpi,
  fetchCompanyQueue,
  fetchCompanyAssignments,
  fetchCompanyAssignmentDetail,
  assignCompanyTeam,
};

export default companyApi;
