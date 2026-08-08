'use client';

import {
  fetchCompanyDashboardOverview,
  fetchCompanyDashboardTaskStatus,
  fetchCompanyDashboardUpcomingDeadlines,
  fetchCompanyDashboardWorkloadTrend,
} from '@/lib/api/services/fetchCompanyDashboard';
import type {
  CompanyDashboardDateRangeParams,
  CompanyDashboardOverview,
  CompanyTaskStatusItem,
  CompanyUpcomingDeadlineItem,
  CompanyWorkloadTrendPoint,
} from '@/lib/api/services/fetchCompanyDashboard';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQueries } from '@tanstack/react-query';
import { companyOverviewKeys, type CompanyOverviewDateRangeKey } from '@/hooks/useCompanyOverview';

const DASHBOARD_STALE_MS = 3 * 60 * 1000;
const FRESH_STALE_MS = 60 * 1000;

function normalizeDateRangeKey(
  params?: CompanyDashboardDateRangeParams
): CompanyOverviewDateRangeKey {
  return {
    from: params?.from?.trim() || null,
    to: params?.to?.trim() || null,
  };
}

function toDateRangeParams(
  range: CompanyOverviewDateRangeKey
): CompanyDashboardDateRangeParams | undefined {
  if (!range.from && !range.to) return undefined;
  return {
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
  };
}

/**
 * Dashboard fetch for `/company` overview — KPI charts + deadline SLA (không fetch bảng phụ).
 */
export function useCompanyOverviewPage(params?: CompanyDashboardDateRangeParams) {
  const rangeKey = normalizeDateRangeKey(params);
  const dateParams = toDateRangeParams(rangeKey);

  const [overviewQuery, taskStatusQuery, workloadTrendQuery, upcomingDeadlinesQuery] = useQueries({
    queries: [
      {
        queryKey: companyOverviewKeys.overview(rangeKey),
        queryFn: () => fetchCompanyDashboardOverview(dateParams),
        select: (envelope: ApiEnvelope<CompanyDashboardOverview>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.taskStatus(rangeKey),
        queryFn: () => fetchCompanyDashboardTaskStatus(dateParams),
        select: (envelope: ApiEnvelope<CompanyTaskStatusItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.workloadTrend(rangeKey),
        queryFn: () => fetchCompanyDashboardWorkloadTrend(dateParams),
        select: (envelope: ApiEnvelope<CompanyWorkloadTrendPoint[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.upcomingDeadlines(rangeKey),
        queryFn: () => fetchCompanyDashboardUpcomingDeadlines(dateParams),
        select: (envelope: ApiEnvelope<CompanyUpcomingDeadlineItem[]>) => envelope.data,
        staleTime: FRESH_STALE_MS,
      },
    ],
  });

  const queries = [
    overviewQuery,
    taskStatusQuery,
    workloadTrendQuery,
    upcomingDeadlinesQuery,
  ] as const;

  const refetch = () => {
    void Promise.all(queries.map(q => q.refetch()));
  };

  return {
    overview: overviewQuery.data,
    taskStatus: taskStatusQuery.data,
    workloadTrend: workloadTrendQuery.data,
    upcomingDeadlines: upcomingDeadlinesQuery.data,
    updatedAtMs: Math.max(0, ...queries.map(q => q.dataUpdatedAt)),
    isPending: overviewQuery.isPending,
    isFetching: queries.some(q => q.isFetching),
    isError: overviewQuery.isError,
    error: overviewQuery.error ?? null,
    refetch,
  };
}
