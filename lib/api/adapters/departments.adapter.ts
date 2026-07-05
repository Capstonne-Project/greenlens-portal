import type {
  AssignDepartmentOfficerBodyDto,
  CreateDepartmentBodyDto,
  DepartmentDetailDto,
  DepartmentDto,
  DepartmentsListDataDto,
  MyOfficesDataDto,
  UpdateDepartmentBodyDto,
} from '@/lib/api/dto/department.dto';
import {
  mapDepartmentDetailDto,
  mapDepartmentDto,
  mapDepartmentsListDataDto,
  mapMyOfficesDataDto,
} from '@/lib/api/mappers/department.mapper';
import type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentsList,
  DepartmentsListParams,
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
