import type { ReportQueueDataDto, ReportQueueParamsDto } from '@/lib/api/dto/reportQueue.dto';
import { mapReportQueueDataDto } from '@/lib/api/mappers/reportQueue.mapper';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';
import type { ReportQueueStatus } from '@/lib/constants/reportStatus';

/** Chuẩn hóa status → mảng (Swagger multi: ?status=A&status=B). */
function normalizeQueueStatuses(
  status: ReportQueueParams['status']
): ReportQueueStatus[] | undefined {
  if (status == null) return undefined;
  const list = (Array.isArray(status) ? status : [status]).filter(Boolean);
  return list.length > 0 ? [...list] : undefined;
}

function buildReportQueueQuery(params?: ReportQueueParams): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  const statuses = normalizeQueueStatuses(params?.status);
  if (statuses) query.status = statuses;
  if (params?.severity) query.severity = params.severity;
  if (params?.categoryId?.trim()) query.categoryId = params.categoryId.trim();
  if (params?.wardCode?.trim()) query.wardCode = params.wardCode.trim();
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  if (params?.slaBreached !== undefined) query.slaBreached = params.slaBreached;
  const search = params?.search?.trim();
  if (search) query.search = search;
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortDir) query.sortDir = params.sortDir;
  return query;
}

/** GET /v1/reports/queue — [LEO/DEO] hàng đợi báo cáo trong phạm vi quản lý. */
export async function adaptFetchReportQueue(
  params?: ReportQueueParams
): Promise<ApiEnvelope<ReportQueueData>> {
  const res = await apiService.get<ApiEnvelope<ReportQueueDataDto>>(
    '/v1/reports/queue',
    buildReportQueueQuery(params as ReportQueueParamsDto | undefined),
    {
      // ASP.NET / Swagger: status=Verified&status=Reopened (không status[]=)
      paramsSerializer: { indexes: null },
    }
  );
  return mapApiEnvelope(res.data, mapReportQueueDataDto);
}
