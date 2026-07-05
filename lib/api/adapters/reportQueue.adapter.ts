import type { ReportQueueDataDto, ReportQueueParamsDto } from '@/lib/api/dto/reportQueue.dto';
import { mapReportQueueDataDto } from '@/lib/api/mappers/reportQueue.mapper';
import type { ReportQueueData, ReportQueueParams } from '@/lib/api/models/reportQueue';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '@/lib/api/core';

function buildReportQueueQuery(
  params?: ReportQueueParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.status) query.status = params.status;
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
    buildReportQueueQuery(params as ReportQueueParamsDto | undefined)
  );
  return mapApiEnvelope(res.data, mapReportQueueDataDto);
}
