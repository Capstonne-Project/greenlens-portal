import type {
  AuditLogDetailDto,
  AuditLogsListDataDto,
  AuditLogsListParamsDto,
} from '@/lib/api/dto/auditLog.dto';
import { mapAuditLogDetailDto, mapAuditLogsListDataDto } from '@/lib/api/mappers/auditLog.mapper';
import type { AuditLogDetail, AuditLogsList, AuditLogsListParams } from '@/lib/api/models/auditLog';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildAuditLogsQuery(params?: AuditLogsListParamsDto): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.actorId?.trim()) query.actorId = params.actorId.trim();
  if (params?.entityType?.trim()) query.entityType = params.entityType.trim();
  if (params?.action?.trim()) query.action = params.action.trim();
  if (params?.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params?.toDate?.trim()) query.toDate = params.toDate.trim();
  return query;
}

/** GET /v1/admin/audit-logs — danh sách nhật ký kiểm toán. */
export async function adaptAuditLogsList(
  params?: AuditLogsListParams
): Promise<ApiEnvelope<AuditLogsList>> {
  const res = await apiService.get<ApiEnvelope<AuditLogsListDataDto>>(
    '/v1/admin/audit-logs',
    buildAuditLogsQuery(params)
  );
  return mapApiEnvelope(res.data, mapAuditLogsListDataDto);
}

/** GET /v1/admin/audit-logs/{id} — chi tiết nhật ký kiểm toán. */
export async function adaptAuditLogDetail(id: string): Promise<ApiEnvelope<AuditLogDetail>> {
  const res = await apiService.get<ApiEnvelope<AuditLogDetailDto>>(`/v1/admin/audit-logs/${id}`);
  return mapApiEnvelope(res.data, mapAuditLogDetailDto);
}
