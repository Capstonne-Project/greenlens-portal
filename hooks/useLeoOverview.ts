'use client';

import { useCanFetchProtected } from '@/hooks/useAuthSession';
import { getOfficeCommunityQueueStats } from '@/lib/api/services/fetchCommunityCleanup';
import { fetchMyWardCompanies } from '@/lib/api/services/fetchCompany';
import type { DeoDashboardDateRangeParams } from '@/lib/api/services/fetchDeoDashboard';
import { fetchLeoMyReportsForDashboard, fetchOfficeStaff } from '@/lib/api/services/fetchOffice';
import { fetchTeams } from '@/lib/api/services/fetchTeam';
import type { DeoDashboardTab } from '@/lib/store/deoOverviewUiStore';
import { aggregateLeoDashboard } from '@/utils/leoDashboardAggregate';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

export type LeoOverviewDateRangeKey = {
  from: string | null;
  to: string | null;
};

export const leoOverviewKeys = {
  all: ['leo', 'overview'] as const,
  reports: (range: LeoOverviewDateRangeKey) => [...leoOverviewKeys.all, 'reports', range] as const,
  companies: () => [...leoOverviewKeys.all, 'companies'] as const,
  staff: () => [...leoOverviewKeys.all, 'staff'] as const,
  teams: () => [...leoOverviewKeys.all, 'teams'] as const,
  communityStats: () => [...leoOverviewKeys.all, 'community-stats'] as const,
};

const DASHBOARD_STALE_MS = 3 * 60 * 1000;
const ALERTS_STALE_MS = 60 * 1000;

function normalizeDateRangeKey(params?: DeoDashboardDateRangeParams): LeoOverviewDateRangeKey {
  return {
    from: params?.from?.trim() || null,
    to: params?.to?.trim() || null,
  };
}

export type UseLeoOverviewOptions = {
  activeTab?: DeoDashboardTab;
  trendDateParams?: DeoDashboardDateRangeParams;
};

/**
 * Dashboard LEO — chưa có `/v1/dashboard/leo`.
 * Parallel: reports (phường) + companies/staff/teams + community stats, rồi aggregate client-side.
 */
export function useLeoOverview(
  params?: DeoDashboardDateRangeParams,
  options?: UseLeoOverviewOptions
) {
  const canFetch = useCanFetchProtected();
  const activeTab = options?.activeTab ?? 'overview';
  const rangeKey = normalizeDateRangeKey(params);
  const trendRangeKey = normalizeDateRangeKey(options?.trendDateParams ?? params);

  const enableCore = canFetch;
  const enableOrg = canFetch && (activeTab === 'overview' || activeTab === 'performance');
  const enableCommunity = canFetch && activeTab === 'overview';
  const enableTrend = canFetch && activeTab === 'overview';

  const [reportsQuery, trendQuery, companiesQuery, staffQuery, teamsQuery, communityQuery] =
    useQueries({
      queries: [
        {
          queryKey: leoOverviewKeys.reports(rangeKey),
          queryFn: () =>
            fetchLeoMyReportsForDashboard({
              ...(rangeKey.from ? { fromDate: rangeKey.from } : {}),
              ...(rangeKey.to ? { toDate: rangeKey.to } : {}),
            }),
          select: (envelope: Awaited<ReturnType<typeof fetchLeoMyReportsForDashboard>>) =>
            envelope.data,
          staleTime: DASHBOARD_STALE_MS,
          enabled: enableCore,
        },
        {
          queryKey: [...leoOverviewKeys.reports(trendRangeKey), 'trend'] as const,
          queryFn: () =>
            fetchLeoMyReportsForDashboard({
              ...(trendRangeKey.from ? { fromDate: trendRangeKey.from } : {}),
              ...(trendRangeKey.to ? { toDate: trendRangeKey.to } : {}),
            }),
          select: (envelope: Awaited<ReturnType<typeof fetchLeoMyReportsForDashboard>>) =>
            envelope.data,
          staleTime: DASHBOARD_STALE_MS,
          enabled: enableTrend,
        },
        {
          queryKey: leoOverviewKeys.companies(),
          queryFn: () => fetchMyWardCompanies(),
          select: (envelope: Awaited<ReturnType<typeof fetchMyWardCompanies>>) => envelope.data,
          staleTime: DASHBOARD_STALE_MS,
          enabled: enableOrg,
        },
        {
          queryKey: leoOverviewKeys.staff(),
          queryFn: () => fetchOfficeStaff({ page: 1, pageSize: 1 }),
          select: (envelope: Awaited<ReturnType<typeof fetchOfficeStaff>>) => envelope.data,
          staleTime: DASHBOARD_STALE_MS,
          enabled: enableOrg,
        },
        {
          queryKey: leoOverviewKeys.teams(),
          queryFn: () => fetchTeams({ page: 1, pageSize: 1, isActive: true }),
          select: (envelope: Awaited<ReturnType<typeof fetchTeams>>) => envelope.data,
          staleTime: DASHBOARD_STALE_MS,
          enabled: enableOrg,
        },
        {
          queryKey: leoOverviewKeys.communityStats(),
          queryFn: () => getOfficeCommunityQueueStats(),
          select: (envelope: Awaited<ReturnType<typeof getOfficeCommunityQueueStats>>) =>
            envelope.data,
          staleTime: ALERTS_STALE_MS,
          enabled: enableCommunity,
        },
      ],
    });

  const dashboard = useMemo(() => {
    if (!reportsQuery.data) return null;
    const view = aggregateLeoDashboard(
      reportsQuery.data,
      {
        companyCount: companiesQuery.data?.companies.length ?? 0,
        teamCount: teamsQuery.data?.pagination.totalItems ?? 0,
        officerCount: staffQuery.data?.pagination.totalItems ?? 0,
      },
      communityQuery.data ?? null
    );
    if (trendQuery.data) {
      const trendView = aggregateLeoDashboard(
        trendQuery.data,
        {
          companyCount: 0,
          teamCount: 0,
          officerCount: 0,
        },
        null
      );
      return { ...view, reportTrend: trendView.reportTrend };
    }
    return view;
  }, [
    reportsQuery.data,
    trendQuery.data,
    companiesQuery.data,
    staffQuery.data,
    teamsQuery.data,
    communityQuery.data,
  ]);

  const activeQueries =
    activeTab === 'overview'
      ? ([
          reportsQuery,
          trendQuery,
          companiesQuery,
          staffQuery,
          teamsQuery,
          communityQuery,
        ] as const)
      : activeTab === 'performance'
        ? ([reportsQuery, companiesQuery, staffQuery, teamsQuery] as const)
        : ([reportsQuery] as const);

  const refetch = () => {
    void Promise.all(activeQueries.map(q => q.refetch()));
  };

  return {
    overview: dashboard?.overview,
    alerts: dashboard?.alerts,
    reportStatus: dashboard?.reportStatus,
    reportTrend: dashboard?.reportTrend,
    pollutionAnalytics: dashboard?.pollutionAnalytics,
    reportFunnel: dashboard?.reportFunnel,
    geographic: dashboard?.geographic,
    queueAging: dashboard?.queueAging,
    resolutionDistribution: dashboard?.resolutionDistribution,
    companyPerformance: dashboard?.companyPerformance,
    officerPerformance: dashboard?.officerPerformance,
    recentActivities: dashboard?.recentActivities,
    updatedAtMs: Math.max(0, ...activeQueries.map(q => q.dataUpdatedAt)),
    isPending: !canFetch || reportsQuery.isPending,
    isFetching: activeQueries.some(q => q.isFetching),
    isError: reportsQuery.isError,
    error: reportsQuery.error ?? null,
    alertsError: communityQuery.error ?? null,
    isAlertsError: communityQuery.isError,
    refetch,
    refetchAlerts: () => {
      void communityQuery.refetch();
    },
  };
}
