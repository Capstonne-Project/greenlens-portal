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
import {
  filterAdminReportItems,
  hasAdminReportListFilters,
  paginateAdminReportItems,
} from '@/utils/adminReportFilters';
import apiService from '@/lib/api/core';

/** Lô tối đa fetch không filter rồi lọc phía FE. */
const CLIENT_FILTER_BATCH_SIZE = 100;

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

async function fetchAdminReportsListRaw(
  params?: AdminReportsListParamsDto
): Promise<ApiEnvelope<AdminReportsListDataDto>> {
  const res = await apiService.get<ApiEnvelope<AdminReportsListDataDto>>(
    '/v1/admin/reports',
    buildQuery(params)
  );
  return res.data;
}

export async function adaptAdminReportsList(
  params?: AdminReportsListParams
): Promise<ApiEnvelope<AdminReportsList>> {
  if (hasAdminReportListFilters(params)) {
    const page = Math.max(1, params?.page ?? 1);
    const pageSize = Math.max(1, params?.pageSize ?? 10);

    const raw = await fetchAdminReportsListRaw({
      page: 1,
      pageSize: CLIENT_FILTER_BATCH_SIZE,
    });
    const mapped = mapAdminReportsListDataDto(raw.data);
    const filtered = filterAdminReportItems(mapped.items, params ?? {});
    const paged = paginateAdminReportItems(filtered, page, pageSize);

    return {
      code: raw.code,
      message: raw.message,
      status: raw.status,
      data: paged,
    };
  }

  const raw = await fetchAdminReportsListRaw(params as AdminReportsListParamsDto | undefined);
  return mapApiEnvelope(raw, mapAdminReportsListDataDto);
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
