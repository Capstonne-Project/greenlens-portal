import apiService from '@/lib/api/core';
import type {
  AssignCompanyStaffTeamInput,
  AssignCompanyTeamInput,
  CompanyAssignmentDetail,
  CompanyAssignmentsList,
  CompanyAssignmentsParams,
  CompanyQueueList,
  CompanyQueueParams,
  CompanyStaffList,
  CompanyStaffListParams,
  CompanyTeam,
  CompanyTeamsList,
  CompanyTeamsListParams,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
  CreateCompanyTeamInput,
  MyCompany,
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

function buildQueueQuery(params?: CompanyQueueParams): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.severity?.trim()) query.severity = params.severity.trim();
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

export async function adaptAssignCompanyStaffTeam(
  userId: string,
  body: AssignCompanyStaffTeamInput
): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.put<ApiEnvelope<string | null>>(
    `/v1/companies/my/staff/${userId}/team`,
    body
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

export async function adaptDeactivateCompanyTeam(id: string): Promise<ApiEnvelope<string | null>> {
  const res = await apiService.delete<ApiEnvelope<string | null>>(`/v1/teams/company-teams/${id}`);
  return res.data;
}

export async function adaptCompanyQueue(
  params?: CompanyQueueParams
): Promise<ApiEnvelope<CompanyQueueList>> {
  const res = await apiService.get<ApiEnvelope<CompanyQueueList>>(
    '/v1/reports/company-queue',
    buildQueueQuery(params)
  );
  return res.data;
}

function buildAssignmentsQuery(params?: CompanyAssignmentsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status?.trim()) query.status = params.status.trim();
  if (params?.reportStatus?.trim()) query.reportStatus = params.reportStatus.trim();
  if (params?.search?.trim()) query.search = params.search.trim();
  return query;
}

export async function adaptCompanyAssignments(
  params?: CompanyAssignmentsParams
): Promise<ApiEnvelope<CompanyAssignmentsList>> {
  const res = await apiService.get<ApiEnvelope<CompanyAssignmentsList>>(
    '/v1/reports/company-assignments',
    buildAssignmentsQuery(params)
  );
  return res.data;
}

export async function adaptCompanyAssignmentDetail(
  reportId: string
): Promise<ApiEnvelope<CompanyAssignmentDetail>> {
  const res = await apiService.get<ApiEnvelope<CompanyAssignmentDetail>>(
    `/v1/reports/company-assignments/${reportId}`
  );
  return res.data;
}

export async function adaptAssignCompanyTeam(
  reportId: string,
  body: AssignCompanyTeamInput
): Promise<void> {
  await apiService.post(`/v1/reports/${reportId}/assign-company-team`, body);
}
