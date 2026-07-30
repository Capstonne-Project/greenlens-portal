/**
 * L2 — Audit logs (admin). BR-ADM-010
 */
import {
  adaptAuditLogDetail,
  adaptAuditLogsExport,
  adaptAuditLogsList,
  adaptAuditLogsStats,
  type AuditLogsExportResult,
} from '@/lib/api/adapters/auditLogs.adapter';
import type {
  AuditLogDetail,
  AuditLogsExportParams,
  AuditLogsList,
  AuditLogsListParams,
  AuditLogsStats,
  AuditLogsStatsParams,
} from '@/lib/api/models/auditLog';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AuditJsonObject,
  AuditJsonValue,
  AuditLogDetail,
  AuditLogListItem,
  AuditLogPagination,
  AuditLogsExportParams,
  AuditLogsList,
  AuditLogsListParams,
  AuditLogsStats,
  AuditLogsStatsParams,
} from '@/lib/api/models/auditLog';

export type { AuditLogsExportResult };

/** GET /v1/admin/audit-logs */
export async function fetchAuditLogs(
  params?: AuditLogsListParams
): Promise<ApiEnvelope<AuditLogsList>> {
  return adaptAuditLogsList(params);
}

/** GET /v1/admin/audit-logs/{id} */
export async function fetchAuditLogDetail(id: string): Promise<ApiEnvelope<AuditLogDetail>> {
  return adaptAuditLogDetail(id);
}

/** GET /v1/admin/audit-logs/stats */
export async function fetchAuditLogsStats(
  params: AuditLogsStatsParams
): Promise<ApiEnvelope<AuditLogsStats>> {
  return adaptAuditLogsStats(params);
}

/** GET /v1/admin/audit-logs/export */
export async function fetchAuditLogsExport(
  params: AuditLogsExportParams
): Promise<AuditLogsExportResult> {
  return adaptAuditLogsExport(params);
}

const auditLogApi = {
  fetchAuditLogs,
  fetchAuditLogDetail,
  fetchAuditLogsStats,
  fetchAuditLogsExport,
};

export default auditLogApi;
