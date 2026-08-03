'use client';

import {
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchAuditLogsExport,
  fetchAuditLogsStats,
  type AuditLogsExportParams,
  type AuditLogsListParams,
  type AuditLogsStatsParams,
} from '@/lib/api/services/fetchAuditLog';
import { useMutation, useQuery } from '@tanstack/react-query';

export const auditLogKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (params: AuditLogsListParams) => [...auditLogKeys.all, 'list', params] as const,
  detail: (id: string) => [...auditLogKeys.all, 'detail', id] as const,
  stats: (params: AuditLogsStatsParams) => [...auditLogKeys.all, 'stats', params] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;
const DETAIL_STALE_MS = 3 * 60 * 1000;
const STATS_STALE_MS = 3 * 60 * 1000;

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

export function useAuditLogsStats(params: AuditLogsStatsParams | null) {
  return useQuery({
    queryKey: auditLogKeys.stats(params ?? { fromDate: '', toDate: '' }),
    queryFn: () => fetchAuditLogsStats(params!),
    select: envelope => envelope.data,
    enabled: Boolean(params?.fromDate && params?.toDate),
    staleTime: STATS_STALE_MS,
  });
}

export function useAuditLogsExport() {
  return useMutation({
    mutationFn: (params: AuditLogsExportParams) => fetchAuditLogsExport(params),
  });
}
