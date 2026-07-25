'use client';

import {
  fetchCompanyDashboardOverview,
  fetchCompanyDashboardQueueAging,
  fetchCompanyDashboardRecentActivities,
  fetchCompanyDashboardStaffPerformance,
  fetchCompanyDashboardTaskStatus,
  fetchCompanyDashboardTeamPerformance,
  fetchCompanyDashboardUpcomingDeadlines,
  fetchCompanyDashboardWorkloadTrend,
} from '@/lib/api/services/fetchCompanyDashboard';
import type {
  CompanyDashboardDateRangeParams,
  CompanyDashboardOverview,
  CompanyQueueAgingItem,
  CompanyRecentActivityItem,
  CompanyStaffPerformanceItem,
  CompanyTaskStatusItem,
  CompanyTeamPerformanceItem,
  CompanyUpcomingDeadlineItem,
  CompanyWorkloadTrendPoint,
} from '@/lib/api/services/fetchCompanyDashboard';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQueries } from '@tanstack/react-query';

export type CompanyOverviewDateRangeKey = {
  from: string | null;
  to: string | null;
};

export const companyOverviewKeys = {
  all: ['company', 'overview'] as const,
  overview: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'dashboard', range] as const,
  queueAging: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'queue-aging', range] as const,
  recentActivities: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'recent-activities', range] as const,
  staffPerformance: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'staff-performance', range] as const,
  taskStatus: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'task-status', range] as const,
  teamPerformance: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'team-performance', range] as const,
  upcomingDeadlines: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'upcoming-deadlines', range] as const,
  workloadTrend: (range: CompanyOverviewDateRangeKey) =>
    [...companyOverviewKeys.all, 'workload-trend', range] as const,
};

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
 * Company dashboard overview — parallel fetch of 8 `/v1/dashboard/company/*` endpoints.
 * Gates full-page skeleton on overview only.
 */
export function useCompanyOverview(params?: CompanyDashboardDateRangeParams) {
  const rangeKey = normalizeDateRangeKey(params);
  const dateParams = toDateRangeParams(rangeKey);

  const [
    overviewQuery,
    queueAgingQuery,
    recentActivitiesQuery,
    staffPerformanceQuery,
    taskStatusQuery,
    teamPerformanceQuery,
    upcomingDeadlinesQuery,
    workloadTrendQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: companyOverviewKeys.overview(rangeKey),
        queryFn: () => fetchCompanyDashboardOverview(dateParams),
        select: (envelope: ApiEnvelope<CompanyDashboardOverview>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.queueAging(rangeKey),
        queryFn: () => fetchCompanyDashboardQueueAging(dateParams),
        select: (envelope: ApiEnvelope<CompanyQueueAgingItem[]>) => envelope.data,
        staleTime: FRESH_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.recentActivities(rangeKey),
        queryFn: () => fetchCompanyDashboardRecentActivities(dateParams),
        select: (envelope: ApiEnvelope<CompanyRecentActivityItem[]>) => envelope.data,
        staleTime: FRESH_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.staffPerformance(rangeKey),
        queryFn: () => fetchCompanyDashboardStaffPerformance(dateParams),
        select: (envelope: ApiEnvelope<CompanyStaffPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.taskStatus(rangeKey),
        queryFn: () => fetchCompanyDashboardTaskStatus(dateParams),
        select: (envelope: ApiEnvelope<CompanyTaskStatusItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.teamPerformance(rangeKey),
        queryFn: () => fetchCompanyDashboardTeamPerformance(dateParams),
        select: (envelope: ApiEnvelope<CompanyTeamPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.upcomingDeadlines(rangeKey),
        queryFn: () => fetchCompanyDashboardUpcomingDeadlines(dateParams),
        select: (envelope: ApiEnvelope<CompanyUpcomingDeadlineItem[]>) => envelope.data,
        staleTime: FRESH_STALE_MS,
      },
      {
        queryKey: companyOverviewKeys.workloadTrend(rangeKey),
        queryFn: () => fetchCompanyDashboardWorkloadTrend(dateParams),
        select: (envelope: ApiEnvelope<CompanyWorkloadTrendPoint[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
    ],
  });

  const queries = [
    overviewQuery,
    queueAgingQuery,
    recentActivitiesQuery,
    staffPerformanceQuery,
    taskStatusQuery,
    teamPerformanceQuery,
    upcomingDeadlinesQuery,
    workloadTrendQuery,
  ] as const;

  const refetch = () => {
    void Promise.all(queries.map(q => q.refetch()));
  };

  return {
    overview: overviewQuery.data,
    queueAging: queueAgingQuery.data,
    recentActivities: recentActivitiesQuery.data,
    staffPerformance: staffPerformanceQuery.data,
    taskStatus: taskStatusQuery.data,
    teamPerformance: teamPerformanceQuery.data,
    upcomingDeadlines: upcomingDeadlinesQuery.data,
    workloadTrend: workloadTrendQuery.data,
    updatedAtMs: Math.max(0, ...queries.map(q => q.dataUpdatedAt)),
    isPending: overviewQuery.isPending,
    isFetching: queries.some(q => q.isFetching),
    isError: overviewQuery.isError,
    error: overviewQuery.error ?? null,
    refetch,
  };
}
