import type {
  AssignOfficeOfficerBodyDto,
  CreateOfficeBodyDto,
  LeoMyReportsDataDto,
  LeoWardBoundaryDto,
  OfficeDetailDto,
  OfficeDto,
  OfficesListDataDto,
  OfficesListParamsDto,
  OfficeStaffListDataDto,
  OfficeStaffLookupDataDto,
  RecruitOfficeStaffBodyDto,
  RecruitOfficeStaffDataDto,
  UpdateOfficeBodyDto,
} from '@/lib/api/dto/office.dto';
import {
  mapLeoMyReportsDataDto,
  mapLeoWardBoundaryDto,
  mapOfficeDetailDto,
  mapOfficeDto,
  mapOfficeStaffListDataDto,
  mapOfficeStaffLookupDataDto,
  mapOfficesListDataDto,
  mapRecruitOfficeStaffDataDto,
} from '@/lib/api/mappers/office.mapper';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  LeoMyReportsData,
  LeoMyReportsParams,
  LeoWardBoundary,
  Office,
  OfficeDetail,
  OfficesList,
  OfficesListParams,
  OfficeStaffList,
  OfficeStaffListParams,
  OfficeStaffLookupResult,
  RecruitOfficeStaffInput,
  RecruitOfficeStaffResult,
  UpdateOfficeInput,
} from '@/lib/api/models/office';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildOfficesQuery(
  params?: OfficesListParamsDto
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.departmentId?.trim()) query.departmentId = params.departmentId.trim();
  if (params?.isOnboarded !== undefined) query.isOnboarded = params.isOnboarded;
  return query;
}

export async function adaptOfficesList(
  params?: OfficesListParams
): Promise<ApiEnvelope<OfficesList>> {
  const res = await apiService.get<ApiEnvelope<OfficesListDataDto>>(
    '/v1/offices',
    buildOfficesQuery(params as OfficesListParamsDto | undefined)
  );
  return mapApiEnvelope(res.data, mapOfficesListDataDto);
}

export async function adaptUpdateOffice(id: string, body: UpdateOfficeInput): Promise<void> {
  const payload: UpdateOfficeBodyDto = { name: body.name.trim() };
  await apiService.put(`/v1/offices/${id}`, payload);
}

export async function adaptCreateOffice(body: CreateOfficeInput): Promise<ApiEnvelope<Office>> {
  const payload: CreateOfficeBodyDto = {
    name: body.name.trim(),
    departmentId: body.departmentId,
    wardCode: body.wardCode.trim(),
    ...(body.officerId ? { officerId: body.officerId } : {}),
  };
  const res = await apiService.post<ApiEnvelope<OfficeDto>>('/v1/offices', payload);
  return mapApiEnvelope(res.data, mapOfficeDto);
}

export async function adaptOfficeDetail(id: string): Promise<ApiEnvelope<OfficeDetail>> {
  const res = await apiService.get<ApiEnvelope<OfficeDetailDto>>(`/v1/offices/${id}`);
  return mapApiEnvelope(res.data, mapOfficeDetailDto);
}

export async function adaptAssignOfficeOfficer(
  id: string,
  body: AssignOfficeOfficerInput
): Promise<void> {
  const payload: AssignOfficeOfficerBodyDto = { userId: body.userId };
  await apiService.put(`/v1/offices/${id}/officer`, payload);
}

function buildLeoMyReportsQuery(
  params?: LeoMyReportsParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.status) query.status = params.status;
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.severity) query.severity = params.severity;
  if (params?.assignmentStatus) query.assignmentStatus = params.assignmentStatus;
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

/** GET /v1/offices/my/reports — LEO: báo cáo thuộc LocalOffice đang quản lý. */
export async function adaptFetchLeoMyReports(
  params?: LeoMyReportsParams
): Promise<ApiEnvelope<LeoMyReportsData>> {
  const res = await apiService.get<ApiEnvelope<LeoMyReportsDataDto>>(
    '/v1/offices/my/reports',
    buildLeoMyReportsQuery(params)
  );
  return mapApiEnvelope(res.data, mapLeoMyReportsDataDto);
}

/**
 * GET /v1/offices/my/ward-boundary — ranh giới phường LEO đang quản lý, suy từ JWT.
 * 404 `OFFICE_NOT_FOUND` khi LEO chưa được gán office — caller xử lý qua `extractApiErrorCode`.
 */
export async function adaptFetchLeoWardBoundary(): Promise<ApiEnvelope<LeoWardBoundary>> {
  const res = await apiService.get<ApiEnvelope<LeoWardBoundaryDto>>('/v1/offices/my/ward-boundary');
  return mapApiEnvelope(res.data, mapLeoWardBoundaryDto);
}

/** POST /v1/offices/my/staff — tuyển Citizen vào LocalOffice và đội xử lý. */
function buildRecruitOfficeStaffBody(body: RecruitOfficeStaffInput): RecruitOfficeStaffBodyDto {
  const teamId = body.teamId?.trim() || null;
  return {
    email: body.email.trim(),
    targetRole: body.targetRole,
    teamId,
    // BE: teamId null → isLeader phải false (không gửi null).
    isLeader: teamId ? Boolean(body.isLeader) : false,
  };
}

export async function adaptRecruitOfficeStaff(
  body: RecruitOfficeStaffInput
): Promise<ApiEnvelope<RecruitOfficeStaffResult>> {
  const payload = buildRecruitOfficeStaffBody(body);
  const res = await apiService.post<ApiEnvelope<RecruitOfficeStaffDataDto>>(
    '/v1/offices/my/staff',
    payload
  );
  return mapApiEnvelope(res.data, mapRecruitOfficeStaffDataDto);
}

function buildOfficeStaffQuery(
  params?: OfficeStaffListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.role) query.role = params.role;
  if (params?.hasTeam !== undefined) query.hasTeam = params.hasTeam;
  return query;
}

/** GET /v1/offices/my/staff — danh sách Cleaner/Inspector trong LocalOffice. */
export async function adaptFetchOfficeStaff(
  params?: OfficeStaffListParams
): Promise<ApiEnvelope<OfficeStaffList>> {
  const res = await apiService.get<ApiEnvelope<OfficeStaffListDataDto>>(
    '/v1/offices/my/staff',
    buildOfficeStaffQuery(params)
  );
  return mapApiEnvelope(res.data, mapOfficeStaffListDataDto);
}

/** GET /v1/offices/my/staff/lookup — tra cứu Citizen theo email (exact). */
export async function adaptLookupOfficeStaff(
  email: string
): Promise<ApiEnvelope<OfficeStaffLookupResult>> {
  const res = await apiService.get<ApiEnvelope<OfficeStaffLookupDataDto>>(
    '/v1/offices/my/staff/lookup',
    { email: email.trim() }
  );
  return mapApiEnvelope(res.data, mapOfficeStaffLookupDataDto);
}
