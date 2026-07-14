import type {
  AdminReportDetailDto,
  AdminReportsListDataDto,
  AdminReportsListParamsDto,
  HideAdminReportBodyDto,
  UpdateAdminReportStatusBodyDto,
} from '@/lib/api/dto/adminReport.dto';
import {
  mapAdminReportDetailDto,
  mapAdminReportsListDataDto,
} from '@/lib/api/mappers/adminReport.mapper';
import type {
  AdminReportDetail,
  AdminReportsList,
  AdminReportsListParams,
  HideAdminReportInput,
  UpdateAdminReportStatusInput,
} from '@/lib/api/models/adminReport';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildQuery(params?: AdminReportsListParamsDto): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status?.trim()) query.status = params.status.trim();
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.provinceCode?.trim()) query.provinceCode = params.provinceCode.trim();
  if (params?.search?.trim()) query.search = params.search.trim();
  return query;
}

export async function adaptAdminReportsList(
  params?: AdminReportsListParams
): Promise<ApiEnvelope<AdminReportsList>> {
  const query = buildQuery(params as AdminReportsListParamsDto | undefined);
  const res = await apiService.get<ApiEnvelope<AdminReportsListDataDto>>(
    '/v1/admin/reports',
    query
  );
  return mapApiEnvelope(res.data, mapAdminReportsListDataDto);
}

export async function adaptAdminReportDetail(id: string): Promise<ApiEnvelope<AdminReportDetail>> {
  const res = await apiService.get<ApiEnvelope<AdminReportDetailDto>>(
    `/v1/admin/reports/${encodeURIComponent(id)}`
  );
  return mapApiEnvelope(res.data, mapAdminReportDetailDto);
}

/** POST /v1/admin/reports/{id}/hide — reversible. */
export async function adaptHideAdminReport(
  id: string,
  body: HideAdminReportInput
): Promise<ApiEnvelope<null>> {
  const payload: HideAdminReportBodyDto = { reason: body.reason.trim() };
  const res = await apiService.post<ApiEnvelope<unknown>>(
    `/v1/admin/reports/${encodeURIComponent(id)}/hide`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** POST /v1/admin/reports/{id}/unhide */
export async function adaptUnhideAdminReport(id: string): Promise<ApiEnvelope<null>> {
  const res = await apiService.post<ApiEnvelope<unknown>>(
    `/v1/admin/reports/${encodeURIComponent(id)}/unhide`
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** PUT /v1/admin/reports/{id}/status — admin override status. */
export async function adaptUpdateAdminReportStatus(
  id: string,
  body: UpdateAdminReportStatusInput
): Promise<ApiEnvelope<null>> {
  const payload: UpdateAdminReportStatusBodyDto = {
    newStatus: body.newStatus,
    reason: body.reason.trim(),
  };
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/admin/reports/${encodeURIComponent(id)}/status`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
