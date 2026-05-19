import type {
  AdminReportDetailDto,
  AdminReportsListDataDto,
  AdminReportsListParamsDto,
} from '@/lib/api/dto/adminReport.dto';
import {
  mapAdminReportDetailDto,
  mapAdminReportsListDataDto,
} from '@/lib/api/mappers/adminReport.mapper';
import type {
  AdminReportDetail,
  AdminReportsList,
  AdminReportsListParams,
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
  const res = await apiService.get<ApiEnvelope<AdminReportDetailDto>>(`/v1/admin/reports/${id}`);
  return mapApiEnvelope(res.data, mapAdminReportDetailDto);
}
