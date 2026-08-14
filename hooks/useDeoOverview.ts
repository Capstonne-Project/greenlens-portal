'use client';

import { useCanFetchProtected } from '@/hooks/useAuthSession';
import {
  fetchDeoDashboardAlerts,
  fetchDeoDashboardCompanyPerformance,
  fetchDeoDashboardGeographic,
  fetchDeoDashboardOfficerPerformance,
  fetchDeoDashboardOverview,
  fetchDeoDashboardPollutionAnalytics,
  fetchDeoDashboardQueueAging,
  fetchDeoDashboardRecentActivities,
  fetchDeoDashboardReportFunnel,
  fetchDeoDashboardReportStatus,
  fetchDeoDashboardReportTrend,
  fetchDeoDashboardResolutionDistribution,
} from '@/lib/api/services/fetchDeoDashboard';
import type {
  DeoCompanyPerformanceItem,
  DeoDashboardAlert,
  DeoDashboardDateRangeParams,
  DeoDashboardOverview,
  DeoGeographicData,
  DeoOfficerPerformanceItem,
  DeoPollutionAnalyticsItem,
  DeoQueueAgingItem,
  DeoRecentActivityItem,
  DeoReportFunnelStage,
  DeoReportStatusItem,
  DeoReportTrendGroupBy,
  DeoReportTrendPoint,
  DeoResolutionDistributionItem,
} from '@/lib/api/services/fetchDeoDashboard';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQueries } from '@tanstack/react-query';

export type DeoOverviewDateRangeKey = {
  from: string | null;
  to: string | null;
};

export const deoOverviewKeys = {
  all: ['deo', 'overview'] as const,
  overview: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'dashboard', range] as const,
  alerts: () => [...deoOverviewKeys.all, 'alerts'] as const,
  reportStatus: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'report-status', range] as const,
  reportTrend: (range: DeoOverviewDateRangeKey, groupBy: DeoReportTrendGroupBy) =>
    [...deoOverviewKeys.all, 'report-trend', range, groupBy] as const,
  pollutionAnalytics: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'pollution-analytics', range] as const,
  reportFunnel: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'report-funnel', range] as const,
  geographic: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'geographic', range] as const,
  queueAging: () => [...deoOverviewKeys.all, 'queue-aging'] as const,
  resolutionDistribution: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'resolution-distribution', range] as const,
  companyPerformance: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'company-performance', range] as const,
  officerPerformance: (range: DeoOverviewDateRangeKey) =>
    [...deoOverviewKeys.all, 'officer-performance', range] as const,
  recentActivities: (page: number, pageSize: number) =>
    [...deoOverviewKeys.all, 'recent-activities', { page, pageSize }] as const,
};

const DASHBOARD_STALE_MS = 3 * 60 * 1000;
const ALERTS_STALE_MS = 60 * 1000;
const QUEUE_AGING_STALE_MS = 60 * 1000;
const RECENT_ACTIVITIES_STALE_MS = 60 * 1000;
/** BR-MAP-012 — geographic client cache 10 phút */
const GEOGRAPHIC_STALE_MS = 10 * 60 * 1000;

const RECENT_ACTIVITIES_PAGE = 1;
const RECENT_ACTIVITIES_PAGE_SIZE = 20;

function normalizeDateRangeKey(params?: DeoDashboardDateRangeParams): DeoOverviewDateRangeKey {
  return {
    from: params?.from?.trim() || null,
    to: params?.to?.trim() || null,
  };
}

function toDateRangeParams(
  range: DeoOverviewDateRangeKey
): DeoDashboardDateRangeParams | undefined {
  if (!range.from && !range.to) return undefined;
  return {
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
  };
}

/**
 * DEO dashboard — parallel fetch of exactly 12 `/v1/dashboard/deo/*` endpoints.
 * Unwraps each `ApiEnvelope` to `.data`.
 */
export function useDeoOverview(
  params?: DeoDashboardDateRangeParams,
  groupBy: DeoReportTrendGroupBy = 'Day'
) {
  const canFetch = useCanFetchProtected();
  const rangeKey = normalizeDateRangeKey(params);
  const dateParams = toDateRangeParams(rangeKey);

  const [
    overviewQuery,
    alertsQuery,
    reportStatusQuery,
    reportTrendQuery,
    pollutionAnalyticsQuery,
    reportFunnelQuery,
    geographicQuery,
    queueAgingQuery,
    resolutionDistributionQuery,
    companyPerformanceQuery,
    officerPerformanceQuery,
    recentActivitiesQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: deoOverviewKeys.overview(rangeKey),
        queryFn: () => fetchDeoDashboardOverview(dateParams),
        select: (envelope: ApiEnvelope<DeoDashboardOverview>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.alerts(),
        queryFn: () => fetchDeoDashboardAlerts(),
        select: (envelope: ApiEnvelope<DeoDashboardAlert[]>) => envelope.data,
        staleTime: ALERTS_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.reportStatus(rangeKey),
        queryFn: () => fetchDeoDashboardReportStatus(dateParams),
        select: (envelope: ApiEnvelope<DeoReportStatusItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.reportTrend(rangeKey, groupBy),
        queryFn: () => fetchDeoDashboardReportTrend({ ...dateParams, groupBy }),
        select: (envelope: ApiEnvelope<DeoReportTrendPoint[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.pollutionAnalytics(rangeKey),
        queryFn: () => fetchDeoDashboardPollutionAnalytics(dateParams),
        select: (envelope: ApiEnvelope<DeoPollutionAnalyticsItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.reportFunnel(rangeKey),
        queryFn: () => fetchDeoDashboardReportFunnel(dateParams),
        select: (envelope: ApiEnvelope<DeoReportFunnelStage[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.geographic(rangeKey),
        queryFn: () => fetchDeoDashboardGeographic(dateParams),
        select: (envelope: ApiEnvelope<DeoGeographicData>) => envelope.data,
        staleTime: GEOGRAPHIC_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.queueAging(),
        queryFn: () => fetchDeoDashboardQueueAging(),
        select: (envelope: ApiEnvelope<DeoQueueAgingItem[]>) => envelope.data,
        staleTime: QUEUE_AGING_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.resolutionDistribution(rangeKey),
        queryFn: () => fetchDeoDashboardResolutionDistribution(dateParams),
        select: (envelope: ApiEnvelope<DeoResolutionDistributionItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.companyPerformance(rangeKey),
        queryFn: () => fetchDeoDashboardCompanyPerformance(dateParams),
        select: (envelope: ApiEnvelope<DeoCompanyPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.officerPerformance(rangeKey),
        queryFn: () => fetchDeoDashboardOfficerPerformance(dateParams),
        select: (envelope: ApiEnvelope<DeoOfficerPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: deoOverviewKeys.recentActivities(
          RECENT_ACTIVITIES_PAGE,
          RECENT_ACTIVITIES_PAGE_SIZE
        ),
        queryFn: () =>
          fetchDeoDashboardRecentActivities({
            page: RECENT_ACTIVITIES_PAGE,
            pageSize: RECENT_ACTIVITIES_PAGE_SIZE,
          }),
        select: (envelope: ApiEnvelope<DeoRecentActivityItem[]>) => envelope.data,
        staleTime: RECENT_ACTIVITIES_STALE_MS,
        enabled: canFetch,
      },
    ],
  });

  const queries = [
    overviewQuery,
    alertsQuery,
    reportStatusQuery,
    reportTrendQuery,
    pollutionAnalyticsQuery,
    reportFunnelQuery,
    geographicQuery,
    queueAgingQuery,
    resolutionDistributionQuery,
    companyPerformanceQuery,
    officerPerformanceQuery,
    recentActivitiesQuery,
  ] as const;

  const refetch = () => {
    void Promise.all(queries.map(q => q.refetch()));
  };

  return {
    overview: overviewQuery.data,
    alerts: alertsQuery.data,
    reportStatus: reportStatusQuery.data,
    reportTrend: reportTrendQuery.data,
    pollutionAnalytics: pollutionAnalyticsQuery.data,
    reportFunnel: reportFunnelQuery.data,
    geographic: geographicQuery.data,
    queueAging: queueAgingQuery.data,
    resolutionDistribution: resolutionDistributionQuery.data,
    companyPerformance: companyPerformanceQuery.data,
    officerPerformance: officerPerformanceQuery.data,
    recentActivities: recentActivitiesQuery.data,
    updatedAtMs: Math.max(0, ...queries.map(q => q.dataUpdatedAt)),
    isPending: !canFetch || overviewQuery.isPending,
    isFetching: queries.some(q => q.isFetching),
    isError: overviewQuery.isError,
    error: overviewQuery.error ?? null,
    alertsError: alertsQuery.error ?? null,
    isAlertsError: alertsQuery.isError,
    refetch,
    refetchAlerts: () => {
      void alertsQuery.refetch();
    },
  };
}
