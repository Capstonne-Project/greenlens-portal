'use client';

import {
  fetchAuditLogDetail,
  fetchAuditLogs,
  type AuditLogsListParams,
} from '@/lib/api/services/fetchAuditLog';
import { useQuery } from '@tanstack/react-query';

export const auditLogKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (params: AuditLogsListParams) => [...auditLogKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditLogKeys.all, 'detail', id] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;

export function useAuditLogsList(params: AuditLogsListParams) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => fetchAuditLogs(params),
    select: envelope => envelope.data,
    staleTime: LIST_STALE_MS,
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery({
    queryKey: auditLogKeys.detail(id ?? ''),
    queryFn: () => fetchAuditLogDetail(id!),
    select: envelope => envelope.data,
    enabled: Boolean(id),
    staleTime: DETAIL_STALE_MS,
  });
}
