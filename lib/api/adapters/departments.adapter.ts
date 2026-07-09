import type {
  AssignDepartmentOfficerBodyDto,
  CreateDepartmentBodyDto,
  DepartmentDetailDto,
  DepartmentDto,
  DepartmentsListDataDto,
  DeoMyReportsDataDto,
  MyOfficesDataDto,
  UpdateDepartmentBodyDto,
} from '@/lib/api/dto/department.dto';
import {
  mapDepartmentDetailDto,
  mapDepartmentDto,
  mapDepartmentsListDataDto,
  mapDeoMyReportsDataDto,
  mapMyOfficesDataDto,
} from '@/lib/api/mappers/department.mapper';
import type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentsList,
  DepartmentsListParams,
  DeoMyReportsData,
  DeoMyReportsParams,
  MyOffices,
  MyOfficesParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildDepartmentsQuery(
  params?: DepartmentsListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.isActive !== undefined) query.isActive = params.isActive;
  return query;
}

function buildMyOfficesQuery(params?: MyOfficesParams): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.isOnboarded !== undefined) query.isOnboarded = params.isOnboarded;
  if (params?.sortBy?.trim()) query.sortBy = params.sortBy.trim();
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

/** GET /v1/departments/my-offices — [DEO] Sở và danh sách văn phòng cấp phường. */
export async function adaptMyOffices(params?: MyOfficesParams): Promise<ApiEnvelope<MyOffices>> {
  const res = await apiService.get<ApiEnvelope<MyOfficesDataDto>>(
    '/v1/departments/my-offices',
    buildMyOfficesQuery(params)
  );
  return mapApiEnvelope(res.data, mapMyOfficesDataDto);
}

function buildDeoMyReportsQuery(
  params?: DeoMyReportsParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.status) query.status = params.status;
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.severity) query.severity = params.severity;
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortDesc !== undefined) query.sortDesc = params.sortDesc;
  return query;
}

/** GET /v1/departments/my/reports — [DEO] Danh sách báo cáo trong Sở (phân trang). */
export async function adaptDeoMyReports(
  params?: DeoMyReportsParams
): Promise<ApiEnvelope<DeoMyReportsData>> {
  const res = await apiService.get<ApiEnvelope<DeoMyReportsDataDto>>(
    '/v1/departments/my/reports',
    buildDeoMyReportsQuery(params)
  );
  return mapApiEnvelope(res.data, mapDeoMyReportsDataDto);
}

export async function adaptDepartmentsList(
  params?: DepartmentsListParams
): Promise<ApiEnvelope<DepartmentsList>> {
  const res = await apiService.get<ApiEnvelope<DepartmentsListDataDto>>(
    '/v1/departments',
    buildDepartmentsQuery(params)
  );
  return mapApiEnvelope(res.data, mapDepartmentsListDataDto);
}

export async function adaptDepartmentDetail(id: string): Promise<ApiEnvelope<DepartmentDetail>> {
  const res = await apiService.get<ApiEnvelope<DepartmentDetailDto>>(`/v1/departments/${id}`);
  return mapApiEnvelope(res.data, mapDepartmentDetailDto);
}

export async function adaptCreateDepartment(
  body: CreateDepartmentInput
): Promise<ApiEnvelope<Department>> {
  const payload: CreateDepartmentBodyDto = {
    name: body.name.trim(),
    provinceCode: body.provinceCode.trim(),
  };
  const res = await apiService.post<ApiEnvelope<DepartmentDto>>('/v1/departments', payload);
  return mapApiEnvelope(res.data, mapDepartmentDto);
}

export async function adaptUpdateDepartment(
  id: string,
  body: UpdateDepartmentInput
): Promise<void> {
  const payload: UpdateDepartmentBodyDto = { name: body.name.trim() };
  await apiService.put(`/v1/departments/${id}`, payload);
}

export async function adaptDeactivateDepartment(id: string): Promise<void> {
  await apiService.delete(`/v1/departments/${id}`);
}

export async function adaptAssignDepartmentOfficer(
  id: string,
  body: AssignDepartmentOfficerInput
): Promise<void> {
  const payload: AssignDepartmentOfficerBodyDto = { userId: body.userId };
  await apiService.put(`/v1/departments/${id}/officer`, payload);
}
