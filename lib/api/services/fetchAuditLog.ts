/**
 * L2 — Audit logs (admin).
 */
import { adaptAuditLogDetail, adaptAuditLogsList } from '@/lib/api/adapters/auditLogs.adapter';
import type { AuditLogDetail, AuditLogsList, AuditLogsListParams } from '@/lib/api/models/auditLog';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AuditJsonObject,
  AuditJsonValue,
  AuditLogDetail,
  AuditLogListItem,
  AuditLogPagination,
  AuditLogsList,
  AuditLogsListParams,
} from '@/lib/api/models/auditLog';

/** GET /v1/admin/audit-logs — danh sách nhật ký kiểm toán. */
export async function fetchAuditLogs(
  params?: AuditLogsListParams
): Promise<ApiEnvelope<AuditLogsList>> {
  return adaptAuditLogsList(params);
}

/** GET /v1/admin/audit-logs/{id} — chi tiết nhật ký kiểm toán. */
export async function fetchAuditLogDetail(id: string): Promise<ApiEnvelope<AuditLogDetail>> {
  return adaptAuditLogDetail(id);
}

const auditLogApi = {
  fetchAuditLogs,
  fetchAuditLogDetail,
};

export default auditLogApi;
