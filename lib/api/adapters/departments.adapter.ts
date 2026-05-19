import type {
  CreateDepartmentBodyDto,
  DepartmentDetailDto,
  DepartmentDto,
  DepartmentsListDataDto,
  UpdateDepartmentBodyDto,
} from '@/lib/api/dto/department.dto';
import {
  mapDepartmentDetailDto,
  mapDepartmentDto,
  mapDepartmentsListDataDto,
} from '@/lib/api/mappers/department.mapper';
import type {
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentsList,
  DepartmentsListParams,
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
