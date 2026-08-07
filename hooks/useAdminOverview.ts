'use client';

import {
  fetchAdminDashboardAlerts,
  fetchAdminDashboardCompanyPerformance,
  fetchAdminDashboardGeographic,
  fetchAdminDashboardOfficerPerformance,
  fetchAdminDashboardOverview,
  fetchAdminDashboardPollutionAnalytics,
  fetchAdminDashboardQueueAging,
  fetchAdminDashboardRecentActivities,
  fetchAdminDashboardReportFunnel,
  fetchAdminDashboardReportStatus,
  fetchAdminDashboardReportTrend,
  fetchAdminDashboardResolutionDistribution,
} from '@/lib/api/services/fetchAdminDashboard';
import type {
  AdminCompanyPerformanceItem,
  AdminDashboardAlert,
  AdminDashboardDateRangeParams,
  AdminDashboardOverview,
  AdminGeographicData,
  AdminOfficerPerformanceItem,
  AdminPollutionAnalyticsItem,
  AdminQueueAgingItem,
  AdminRecentActivityItem,
  AdminReportFunnelStage,
  AdminReportStatusItem,
  AdminReportTrendPoint,
  AdminResolutionDistributionItem,
} from '@/lib/api/services/fetchAdminDashboard';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useQueries } from '@tanstack/react-query';

/** Normalized date range for stable query keys (primitives only — no object identity churn). */
export type AdminOverviewDateRangeKey = {
  from: string | null;
  to: string | null;
};

export const adminOverviewKeys = {
  all: ['admin', 'overview'] as const,
  overview: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'dashboard', range] as const,
  alerts: () => [...adminOverviewKeys.all, 'alerts'] as const,
  companyPerformance: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'company-performance', range] as const,
  geographic: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'geographic', range] as const,
  officerPerformance: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'officer-performance', range] as const,
  queueAging: () => [...adminOverviewKeys.all, 'queue-aging'] as const,
  recentActivities: (page: number, pageSize: number) =>
    [...adminOverviewKeys.all, 'recent-activities', { page, pageSize }] as const,
  reportFunnel: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'report-funnel', range] as const,
  reportStatus: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'report-status', range] as const,
  pollutionAnalytics: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'pollution-analytics', range] as const,
  resolutionDistribution: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'resolution-distribution', range] as const,
  reportTrend: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'report-trend', range] as const,
};

const DASHBOARD_STALE_MS = 3 * 60 * 1000;
const ALERTS_STALE_MS = 60 * 1000;
/** Queue aging changes often — keep fresh. */
const QUEUE_AGING_STALE_MS = 60 * 1000;
/** Recent activity feed — near real-time. */
const RECENT_ACTIVITIES_STALE_MS = 60 * 1000;
/** BR-MAP-012 — map/geographic client cache 10 phút */
const GEOGRAPHIC_STALE_MS = 10 * 60 * 1000;

const RECENT_ACTIVITIES_PAGE = 1;
const RECENT_ACTIVITIES_PAGE_SIZE = 12;

function normalizeDateRangeKey(params?: AdminDashboardDateRangeParams): AdminOverviewDateRangeKey {
  const from = params?.from?.trim() || null;
  const to = params?.to?.trim() || null;
  return { from, to };
}

function toDateRangeParams(
  range: AdminOverviewDateRangeKey
): AdminDashboardDateRangeParams | undefined {
  if (!range.from && !range.to) return undefined;
  return {
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
  };
}

/**
 * Admin dashboard — parallel fetch of overview, alerts, company/officer performance, geographic.
 * Unwraps each `ApiEnvelope` to `.data`.
 */
export function useAdminOverview(params?: AdminDashboardDateRangeParams) {
  const rangeKey = normalizeDateRangeKey(params);
  const dateParams = toDateRangeParams(rangeKey);

  const [
    overviewQuery,
    alertsQuery,
    companyPerformanceQuery,
    geographicQuery,
    officerPerformanceQuery,
    queueAgingQuery,
    recentActivitiesQuery,
    reportFunnelQuery,
    reportStatusQuery,
    pollutionAnalyticsQuery,
    resolutionDistributionQuery,
    reportTrendQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: adminOverviewKeys.overview(rangeKey),
        queryFn: () => fetchAdminDashboardOverview(dateParams),
        select: (envelope: ApiEnvelope<AdminDashboardOverview>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.alerts(),
        queryFn: () => fetchAdminDashboardAlerts(),
        select: (envelope: ApiEnvelope<AdminDashboardAlert[]>) => envelope.data,
        staleTime: ALERTS_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.companyPerformance(rangeKey),
        queryFn: () => fetchAdminDashboardCompanyPerformance(dateParams),
        select: (envelope: ApiEnvelope<AdminCompanyPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.geographic(rangeKey),
        queryFn: () => fetchAdminDashboardGeographic(dateParams),
        select: (envelope: ApiEnvelope<AdminGeographicData>) => envelope.data,
        staleTime: GEOGRAPHIC_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.officerPerformance(rangeKey),
        queryFn: () => fetchAdminDashboardOfficerPerformance(dateParams),
        select: (envelope: ApiEnvelope<AdminOfficerPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.queueAging(),
        queryFn: () => fetchAdminDashboardQueueAging(),
        select: (envelope: ApiEnvelope<AdminQueueAgingItem[]>) => envelope.data,
        staleTime: QUEUE_AGING_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.recentActivities(
          RECENT_ACTIVITIES_PAGE,
          RECENT_ACTIVITIES_PAGE_SIZE
        ),
        queryFn: () =>
          fetchAdminDashboardRecentActivities({
            page: RECENT_ACTIVITIES_PAGE,
            pageSize: RECENT_ACTIVITIES_PAGE_SIZE,
          }),
        select: (envelope: ApiEnvelope<AdminRecentActivityItem[]>) => envelope.data,
        staleTime: RECENT_ACTIVITIES_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.reportFunnel(rangeKey),
        queryFn: () => fetchAdminDashboardReportFunnel(dateParams),
        select: (envelope: ApiEnvelope<AdminReportFunnelStage[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.reportStatus(rangeKey),
        queryFn: () => fetchAdminDashboardReportStatus(dateParams),
        select: (envelope: ApiEnvelope<AdminReportStatusItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.pollutionAnalytics(rangeKey),
        queryFn: () => fetchAdminDashboardPollutionAnalytics(dateParams),
        select: (envelope: ApiEnvelope<AdminPollutionAnalyticsItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.resolutionDistribution(rangeKey),
        queryFn: () => fetchAdminDashboardResolutionDistribution(dateParams),
        select: (envelope: ApiEnvelope<AdminResolutionDistributionItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
      {
        queryKey: adminOverviewKeys.reportTrend(rangeKey),
        queryFn: () => fetchAdminDashboardReportTrend(dateParams),
        select: (envelope: ApiEnvelope<AdminReportTrendPoint[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
      },
    ],
  });

  const queries = [
    overviewQuery,
    alertsQuery,
    companyPerformanceQuery,
    geographicQuery,
    officerPerformanceQuery,
    queueAgingQuery,
    recentActivitiesQuery,
    reportFunnelQuery,
    reportStatusQuery,
    pollutionAnalyticsQuery,
    resolutionDistributionQuery,
    reportTrendQuery,
  ] as const;

  const refetch = () => {
    void Promise.all(queries.map(q => q.refetch()));
  };

  return {
    overview: overviewQuery.data,
    alerts: alertsQuery.data,
    companyPerformance: companyPerformanceQuery.data,
    geographic: geographicQuery.data,
    officerPerformance: officerPerformanceQuery.data,
    queueAging: queueAgingQuery.data,
    recentActivities: recentActivitiesQuery.data,
    reportFunnel: reportFunnelQuery.data,
    reportStatus: reportStatusQuery.data,
    pollutionAnalytics: pollutionAnalyticsQuery.data,
    resolutionDistribution: resolutionDistributionQuery.data,
    reportTrend: reportTrendQuery.data,
    updatedAtMs: Math.max(0, ...queries.map(q => q.dataUpdatedAt)),
    // Gate the full-page skeleton on overview only so charts can load independently.
    isPending: overviewQuery.isPending,
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
