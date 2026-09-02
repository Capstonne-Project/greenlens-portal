/**
 * L2 — Companies (officer) + Company Manager (dev portal).
 */
import {
  adaptAddCompanyTeamMember,
  adaptArchiveCompanyTeam,
  adaptCompanyTeamDetail,
  adaptDeleteCompanyTeam,
  adaptAssignCompanyTeam,
  adaptReassignCompanyTeam,
  adaptCompanyAssignmentDetail,
  adaptCompanyAssignments,
  adaptCompanyQueue,
  adaptCompanyReportDetail,
  adaptCompanyStaffList,
  adaptCompanyTeamsList,
  adaptCreateCompanyStaff,
  adaptCreateCompanyTeam,
  adaptMyCompany,
  adaptMyCompanyContractHistory,
  adaptMyCompanyKpi,
  adaptRemoveCompanyTeamMember,
  adaptUpdateCompanyStaffStatus,
  adaptUpdateCompanyTeam,
} from '@/lib/api/adapters/company.adapter';
import {
  adaptCompaniesList,
  adaptCompanyContractHistory,
  adaptCompanyDetail,
  adaptCreateCompany,
  adaptDeleteCompany,
  adaptFetchCompanyServiceAreas,
  adaptMyWardCompaniesList,
  adaptMyWardCompanyDetail,
  adaptReactivateCompany,
  adaptRenewCompanyContract,
  adaptSuspendCompany,
  adaptUpdateCompanyServiceAreas,
} from '@/lib/api/adapters/companies.adapter';
import type { IdempotencyRequestOptions } from '@/lib/api/idempotency';
import type {
  AddCompanyTeamMemberInput,
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  ReassignCompanyTeamInput,
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
  CompanyTeamDetail,
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
  MyWardCompaniesList,
  MyWardCompaniesListParams,
  MyWardCompanyDetail,
  RenewCompanyContractInput,
  RenewCompanyContractResult,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
  UpdateCompanyTeamInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AddCompanyTeamMemberInput,
  ArchiveCompanyTeamInput,
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  ReassignCompanyTeamInput,
  CompaniesList,
  CompaniesListParams,
  CompanyAssignmentDetail,
  CompanyAssignmentDispatchSource,
  CompanyAssignmentListItem,
  CompanyAssignmentMedia,
  CompanyAssignmentProgressSummary,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyAssignmentStatus,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTeamWasteTag,
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
  CompanyTeamDetail,
  CompanyTeamDetailMember,
  CompanyTeamListItem,
  CompanyTeamMembership,
  CompanyTeamOption,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CompanyTeamWasteTag,
  CreateCompanyInput,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  CreatedCompany,
  MyCompany,
  MyCompanyContractHistory,
  MyCompanyKpi,
  MyCompanyKpiParams,
  MyWardCompaniesList,
  MyWardCompaniesListParams,
  MyWardCompanyDetail,
  MyWardCompanyItem,
  MY_WARD_COMPANIES_PAGE_SIZE,
  RenewCompanyContractInput,
  RenewCompanyContractResult,
  SuspendCompanyInput,
  UpdateCompanyServiceAreasInput,
  UpdateCompanyStaffStatusInput,
  UpdateCompanyTeamInput,
} from '@/lib/api/models/company';

/** GET /v1/companies — danh sách công ty DVMT (phân trang, tìm kiếm). */
export async function fetchCompanies(
  params?: CompaniesListParams
): Promise<ApiEnvelope<CompaniesList>> {
  return adaptCompaniesList(params);
}

/** GET /v1/companies/my-ward — [LEO] công ty phục vụ phường/xã của LEO. */
export async function fetchMyWardCompanies(
  params?: MyWardCompaniesListParams
): Promise<ApiEnvelope<MyWardCompaniesList>> {
  return adaptMyWardCompaniesList(params);
}

/** GET /v1/companies/my-ward/{id} — [LEO] chi tiết công ty trong phường của LEO. */
export async function fetchMyWardCompanyDetail(
  companyId: string
): Promise<ApiEnvelope<MyWardCompanyDetail>> {
  return adaptMyWardCompanyDetail(companyId);
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

/**
 * DELETE /v1/teams/company-teams/{teamId}/members/{userId}
 * [CompanyManager] Cho CompanyStaff rời team; vẫn thuộc công ty.
 */
export async function removeCompanyTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  if (!teamId.trim() || !userId.trim()) {
    throw new Error('Thiếu teamId hoặc userId');
  }
  return adaptRemoveCompanyTeamMember(teamId.trim(), userId.trim());
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

/** PUT /v1/teams/company-teams/{id} — cập nhật tên + wasteTagIds.
 *  200: "Đã cập nhật" | 403: Team không thuộc công ty | 404: Không tìm thấy team. */
export async function updateCompanyTeam(
  id: string,
  body: UpdateCompanyTeamInput
): Promise<ApiEnvelope<string>> {
  return adaptUpdateCompanyTeam(id, body);
}

/** GET /v1/teams/company-teams/{id} — chi tiết đội công ty. */
export async function fetchCompanyTeamDetail(id: string): Promise<ApiEnvelope<CompanyTeamDetail>> {
  return adaptCompanyTeamDetail(id);
}

/** PUT /v1/teams/company-teams/{id}/archive — đóng/mở team công ty. */
export async function archiveCompanyTeam(
  id: string,
  body: ArchiveCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  return adaptArchiveCompanyTeam(id, body);
}

/**
 * DELETE /v1/teams/company-teams/{id}
 * [CompanyManager] Soft Delete team công ty.
 * Dữ liệu team không bị mất nhưng không còn xuất hiện trên hệ thống.
 */
export async function deleteCompanyTeam(id: string): Promise<ApiEnvelope<string>> {
  if (!id.trim()) {
    throw new Error('Thiếu id đội');
  }
  return adaptDeleteCompanyTeam(id.trim());
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

/** GET /v1/reports/company-assignments/{reportId} — chi tiết tiến độ báo cáo [CompanyManager]. */
export async function fetchCompanyAssignmentDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  return adaptCompanyAssignmentDetail(reportId);
}

/** GET /v1/reports/company-reports/{reportId} — chi tiết báo cáo hàng đợi phân công [CompanyManager]. */
export async function fetchCompanyReportDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  return adaptCompanyReportDetail(reportId);
}

/**
 * POST /v1/reports/{id}/assign-company-team — [CompanyManager] phân công team công ty
 * (Verified → InProgress). Khác với `assignReport` (LEO → POST .../assign).
 */
export async function assignCompanyTeam(
  reportId: string,
  body: AssignCompanyTeamInput,
  options?: IdempotencyRequestOptions
): Promise<void> {
  return adaptAssignCompanyTeam(reportId, body, options);
}

/**
 * PUT /v1/reports/{id}/reassign-company-team — [CompanyManager] phân công lại đội
 * khi assignment `Declined` / `Assigned`. Body: oldTeamId, newTeamId, reason (≥20).
 */
export async function reassignCompanyTeam(
  reportId: string,
  body: ReassignCompanyTeamInput
): Promise<void> {
  return adaptReassignCompanyTeam(reportId, body);
}

const companyApi = {
  fetchCompanies,
  fetchMyWardCompanies,
  fetchMyWardCompanyDetail,
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
  archiveCompanyTeam,
  deleteCompanyTeam,
  fetchMyCompanyContractHistory,
  fetchMyCompanyKpi,
  fetchCompanyQueue,
  fetchCompanyAssignments,
  fetchCompanyAssignmentDetail,
  fetchCompanyReportDetail,
  assignCompanyTeam,
  reassignCompanyTeam,
};

export default companyApi;
