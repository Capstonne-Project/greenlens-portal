import type {
  AssignOfficeOfficerBodyDto,
  CreateOfficeBodyDto,
  OfficeDetailDto,
  OfficeDto,
  OfficesListDataDto,
  OfficesListParamsDto,
  UpdateOfficeBodyDto,
} from '@/lib/api/dto/office.dto';
import {
  mapOfficeDetailDto,
  mapOfficeDto,
  mapOfficesListDataDto,
} from '@/lib/api/mappers/office.mapper';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  Office,
  OfficeDetail,
  OfficesList,
  OfficesListParams,
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
  officeId: string,
  body: AssignOfficeOfficerInput
): Promise<void> {
  const payload: AssignOfficeOfficerBodyDto = { userId: body.userId };
  await apiService.put(`/v1/offices/${officeId}/officer`, payload);
}
