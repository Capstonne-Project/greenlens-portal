import type {
  AuditLogDetailDto,
  AuditLogsExportParamsDto,
  AuditLogsListDataDto,
  AuditLogsListParamsDto,
  AuditLogsStatsDataDto,
  AuditLogsStatsParamsDto,
} from '@/lib/api/dto/auditLog.dto';
import {
  mapAuditLogDetailDto,
  mapAuditLogsListDataDto,
  mapAuditLogsStatsDataDto,
} from '@/lib/api/mappers/auditLog.mapper';
import type {
  AuditLogDetail,
  AuditLogsExportParams,
  AuditLogsList,
  AuditLogsListParams,
  AuditLogsStats,
  AuditLogsStatsParams,
} from '@/lib/api/models/auditLog';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function appendSharedAuditFilters(
  query: Record<string, string | number>,
  params?: AuditLogsListParamsDto | AuditLogsExportParamsDto | AuditLogsStatsParamsDto
): void {
  if (!params) return;
  if ('userId' in params && params.userId?.trim()) query.userId = params.userId.trim();
  if ('actorRole' in params && params.actorRole?.trim()) query.actorRole = params.actorRole.trim();
  if ('entityType' in params && params.entityType?.trim())
    query.entityType = params.entityType.trim();
  if ('action' in params && params.action?.trim()) query.action = params.action.trim();
  if (params.fromDate?.trim()) query.fromDate = params.fromDate.trim();
  if (params.toDate?.trim()) query.toDate = params.toDate.trim();
}

function buildAuditLogsListQuery(params?: AuditLogsListParamsDto): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.entityId?.trim()) query.entityId = params.entityId.trim();
  appendSharedAuditFilters(query, params);
  return query;
}

function buildAuditLogsExportQuery(
  params: AuditLogsExportParamsDto
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  appendSharedAuditFilters(query, params);
  return query;
}

function extractFilename(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(contentDisposition);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1].replace(/"/g, '').trim());
}

/** GET /v1/admin/audit-logs — danh sách nhật ký kiểm toán. */
export async function adaptAuditLogsList(
  params?: AuditLogsListParams
): Promise<ApiEnvelope<AuditLogsList>> {
  const res = await apiService.get<ApiEnvelope<AuditLogsListDataDto>>(
    '/v1/admin/audit-logs',
    buildAuditLogsListQuery(params)
  );
  return mapApiEnvelope(res.data, mapAuditLogsListDataDto);
}

/** GET /v1/admin/audit-logs/{id} — chi tiết nhật ký kiểm toán. */
export async function adaptAuditLogDetail(id: string): Promise<ApiEnvelope<AuditLogDetail>> {
  const res = await apiService.get<ApiEnvelope<AuditLogDetailDto>>(`/v1/admin/audit-logs/${id}`);
  return mapApiEnvelope(res.data, mapAuditLogDetailDto);
}

/** GET /v1/admin/audit-logs/stats — thống kê dashboard (max 90 ngày). */
export async function adaptAuditLogsStats(
  params: AuditLogsStatsParams
): Promise<ApiEnvelope<AuditLogsStats>> {
  const res = await apiService.get<ApiEnvelope<AuditLogsStatsDataDto>>(
    '/v1/admin/audit-logs/stats',
    buildAuditLogsExportQuery(params)
  );
  return mapApiEnvelope(res.data, mapAuditLogsStatsDataDto);
}

export type AuditLogsExportResult = {
  blob: Blob;
  filename: string;
};

/** GET /v1/admin/audit-logs/export — tải CSV (fromDate + toDate bắt buộc, max 90 ngày). */
export async function adaptAuditLogsExport(
  params: AuditLogsExportParams
): Promise<AuditLogsExportResult> {
  const res = await apiService.get<Blob>(
    '/v1/admin/audit-logs/export',
    buildAuditLogsExportQuery(params),
    { responseType: 'blob' }
  );

  const header = res.headers['content-disposition'];
  const disposition = typeof header === 'string' ? header : undefined;
  const filename =
    extractFilename(disposition) ??
    `audit_logs_${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}.csv`;

  return { blob: res.data, filename };
}
