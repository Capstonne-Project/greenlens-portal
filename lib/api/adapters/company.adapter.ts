import apiService from '@/lib/api/core';
import {
  mergeIdempotencyConfig,
  withOptionalIdempotency,
  type IdempotencyRequestOptions,
} from '@/lib/api/idempotency';
import type {
  CompanyAssignmentDetailDto,
  CompanyAssignmentsListDto,
} from '@/lib/api/dto/companyAssignment.dto';
import type { CompanyQueueListDto } from '@/lib/api/dto/companyQueue.dto';
import {
  mapCompanyAssignmentDetailDto,
  mapCompanyAssignmentsListDto,
} from '@/lib/api/mappers/companyAssignment.mapper';
import { mapCompanyQueueListDto } from '@/lib/api/mappers/companyQueue.mapper';
import type {
  AddCompanyTeamMemberInput,
  AssignCompanyTeamInput,
  ReassignCompanyTeamInput,
  CompanyAssignmentDetail,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeam,
  CompanyTeamMembership,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  ArchiveCompanyTeamInput,
  CreateCompanyTeamInput,
  MyCompany,
  MyCompanyContractHistory,
  MyCompanyKpi,
  MyCompanyKpiParams,
  RenameCompanyTeamInput,
  UpdateCompanyStaffStatusInput,
} from '@/lib/api/models/company';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

function buildStaffQuery(
  params?: CompanyStaffListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  return query;
}

function buildTeamsQuery(
  params?: CompanyTeamsListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  return query;
}

function buildQueueQuery(params?: CompanyQueueParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.severity?.trim()) query.severity = params.severity.trim();
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

export async function adaptMyCompany(): Promise<ApiEnvelope<MyCompany>> {
  const res = await apiService.get<ApiEnvelope<MyCompany>>('/v1/companies/my');
  return res.data;
}

export async function adaptCompanyStaffList(
  params?: CompanyStaffListParams
): Promise<ApiEnvelope<CompanyStaffList>> {
  const res = await apiService.get<ApiEnvelope<CompanyStaffList>>(
    '/v1/companies/my/staff',
    buildStaffQuery(params)
  );
  return res.data;
}

export async function adaptCreateCompanyStaff(
  body: CreateCompanyStaffInput
): Promise<ApiEnvelope<CreateCompanyStaffResult>> {
  const res = await apiService.post<ApiEnvelope<CreateCompanyStaffResult>>(
    '/v1/companies/my/staff',
    body
  );
  return res.data;
}

export async function adaptUpdateCompanyStaffStatus(
  userId: string,
  body: UpdateCompanyStaffStatusInput
): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.put<ApiEnvelope<string | null>>(
    `/v1/companies/my/staff/${userId}/status`,
    body
  );
  return res.data;
}

/**
 * POST /v1/teams/company-teams/{teamId}/members
 * [CompanyManager] Thêm CompanyStaff (cùng công ty) vào team; có thể đặt trưởng nhóm.
 */
export async function adaptAddCompanyTeamMember(
  teamId: string,
  body: AddCompanyTeamMemberInput
): Promise<ApiEnvelope<CompanyTeamMembership>> {
  const res = await apiService.post<ApiEnvelope<CompanyTeamMembership>>(
    `/v1/teams/company-teams/${encodeURIComponent(teamId)}/members`,
    {
      userId: body.userId,
      isLeader: body.isLeader ?? false,
    }
  );
  return res.data;
}

/**
 * DELETE /v1/teams/company-teams/{teamId}/members/{userId}
 * [CompanyManager] — 200: envelope data string; 404: không tìm thấy thành viên hoặc team.
 */
export async function adaptRemoveCompanyTeamMember(
  teamId: string,
  userId: string
): Promise<ApiEnvelope<string>> {
  const res = await apiService.delete<ApiEnvelope<string>>(
    `/v1/teams/company-teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`
  );
  return res.data;
}

export async function adaptCompanyTeamsList(
  params?: CompanyTeamsListParams
): Promise<ApiEnvelope<CompanyTeamsList>> {
  const res = await apiService.get<ApiEnvelope<CompanyTeamsList>>(
    '/v1/teams/company-teams',
    buildTeamsQuery(params)
  );
  return res.data;
}

export async function adaptCreateCompanyTeam(
  body: CreateCompanyTeamInput
): Promise<ApiEnvelope<CompanyTeam>> {
  const res = await apiService.post<ApiEnvelope<CompanyTeam>>('/v1/teams/company-teams', body);
  return res.data;
}

export async function adaptRenameCompanyTeam(
  id: string,
  body: RenameCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.put<ApiEnvelope<string | null>>(
    `/v1/teams/company-teams/${id}`,
    body
  );
  return res.data;
}

/** PUT /v1/teams/company-teams/{id}/archive — đóng/mở team công ty. */
export async function adaptArchiveCompanyTeam(
  id: string,
  body: ArchiveCompanyTeamInput
): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.put<ApiEnvelope<string | null>>(
    `/v1/teams/company-teams/${encodeURIComponent(id)}/archive`,
    body
  );
  return res.data;
}

/**
 * DELETE /v1/teams/company-teams/{id}
 * [CompanyManager] Soft delete — dữ liệu không mất nhưng team không còn hiện trên hệ thống.
 * 200: Đã xóa (data string); 404: Không tìm thấy team.
 */
export async function adaptDeleteCompanyTeam(id: string): Promise<ApiEnvelope<string>> {
  const res = await apiService.delete<ApiEnvelope<string>>(
    `/v1/teams/company-teams/${encodeURIComponent(id)}`
  );
  return res.data;
}

/** GET /v1/companies/my/contract-history — lịch sử kỳ hợp đồng công ty CM. */
export async function adaptMyCompanyContractHistory(): Promise<
  ApiEnvelope<MyCompanyContractHistory>
> {
  const res = await apiService.get<ApiEnvelope<MyCompanyContractHistory>>(
    '/v1/companies/my/contract-history'
  );
  return res.data;
}

function buildMyKpiQuery(params?: MyCompanyKpiParams): Record<string, string> {
  const query: Record<string, string> = {};
  if (params?.from?.trim()) query.from = params.from.trim();
  if (params?.to?.trim()) query.to = params.to.trim();
  if (params?.period?.trim()) query.period = params.period.trim();
  return query;
}

/** GET /v1/companies/my/kpi — KPI công ty CM. */
export async function adaptMyCompanyKpi(
  params?: MyCompanyKpiParams
): Promise<ApiEnvelope<MyCompanyKpi>> {
  const res = await apiService.get<ApiEnvelope<MyCompanyKpi>>(
    '/v1/companies/my/kpi',
    buildMyKpiQuery(params)
  );
  return res.data;
}

export async function adaptCompanyQueue(
  params?: CompanyQueueParams
): Promise<ApiEnvelope<CompanyQueueList>> {
  const res = await apiService.get<ApiEnvelope<CompanyQueueListDto>>(
    '/v1/reports/company-queue',
    buildQueueQuery(params)
  );
  const envelope = res.data;
  if (!envelope.data) return envelope as ApiEnvelope<CompanyQueueList>;
  return {
    ...envelope,
    data: mapCompanyQueueListDto(envelope.data),
  };
}

function buildAssignmentsQuery(
  params?: CompanyAssignmentsParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status?.trim()) query.status = params.status.trim();
  if (params?.reportStatus?.trim()) query.reportStatus = params.reportStatus.trim();
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.severity?.trim()) query.severity = params.severity.trim();
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.teamId?.trim()) query.teamId = params.teamId.trim();
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

export async function adaptCompanyAssignments(
  params?: CompanyAssignmentsParams
): Promise<ApiEnvelope<CompanyAssignmentsList>> {
  const res = await apiService.get<ApiEnvelope<CompanyAssignmentsListDto>>(
    '/v1/reports/company-assignments',
    buildAssignmentsQuery(params)
  );
  const envelope = res.data;
  if (!envelope.data) return envelope as ApiEnvelope<CompanyAssignmentsList>;
  return {
    ...envelope,
    data: mapCompanyAssignmentsListDto(envelope.data),
  };
}

export async function adaptCompanyAssignmentDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  const res = await apiService.get<ApiEnvelope<CompanyAssignmentDetailDto>>(
    `/v1/reports/company-assignments/${reportId}`
  );
  const envelope = res.data;
  if (!envelope.data) return envelope as ApiEnvelope<CompanyAssignmentDetail>;
  return {
    ...envelope,
    data: mapCompanyAssignmentDetailDto(envelope.data),
  };
}

/** GET /v1/reports/company-reports/{reportId} — chi tiết báo cáo [CompanyManager] (assign queue). */
export async function adaptCompanyReportDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  const res = await apiService.get<ApiEnvelope<CompanyAssignmentDetailDto>>(
    `/v1/reports/company-reports/${reportId}`
  );
  const envelope = res.data;
  if (!envelope.data) return envelope as ApiEnvelope<CompanyAssignmentDetail>;
  return {
    ...envelope,
    data: mapCompanyAssignmentDetailDto(envelope.data),
  };
}

/**
 * POST /v1/reports/{id}/assign-company-team — [CompanyManager] gán team công ty.
 * Không dùng POST /v1/reports/{id}/assign (đó là LEO gán community team).
 */
export async function adaptAssignCompanyTeam(
  reportId: string,
  body: AssignCompanyTeamInput,
  options?: IdempotencyRequestOptions
): Promise<void> {
  const payload: AssignCompanyTeamInput = {
    teams: body.teams.map(t => ({
      teamId: t.teamId,
      ...(t.note?.trim() ? { note: t.note.trim() } : {}),
    })),
  };
  return withOptionalIdempotency(options?.idempotencyKey, async key => {
    await apiService.post(
      `/v1/reports/${reportId}/assign-company-team`,
      payload,
      mergeIdempotencyConfig(key, options?.config)
    );
  });
}

/**
 * PUT /v1/reports/{id}/reassign-company-team — [CompanyManager] chuyển giao đội
 * khi assignment `Declined` hoặc `Assigned` (chưa nhận). Report vẫn `InProgress`.
 */
export async function adaptReassignCompanyTeam(
  reportId: string,
  body: ReassignCompanyTeamInput
): Promise<void> {
  const payload: ReassignCompanyTeamInput = {
    oldTeamId: body.oldTeamId,
    newTeamId: body.newTeamId,
    reason: body.reason.trim(),
  };
  await apiService.put(`/v1/reports/${reportId}/reassign-company-team`, payload);
}
