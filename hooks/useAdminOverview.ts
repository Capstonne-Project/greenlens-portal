'use client';

import { useCanFetchProtected } from '@/hooks/useAuthSession';
import {
  fetchAdminDashboardAlerts,
  fetchAdminDashboardCompanyPerformance,
  fetchAdminDashboardGeographic,
  fetchAdminDashboardOfficerPerformance,
  fetchAdminDashboardOverview,
  fetchAdminDashboardPollutionAnalytics,
  fetchAdminDashboardQueueAging,
  fetchAdminDashboardReportFunnel,
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
  AdminReportFunnelStage,
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
  reportFunnel: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'report-funnel', range] as const,
  reportTrend: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'report-trend', range] as const,
  pollutionAnalytics: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'pollution-analytics', range] as const,
  resolutionDistribution: (range: AdminOverviewDateRangeKey) =>
    [...adminOverviewKeys.all, 'resolution-distribution', range] as const,
};

const DASHBOARD_STALE_MS = 3 * 60 * 1000;
const ALERTS_STALE_MS = 60 * 1000;
/** Queue aging changes often — keep fresh. */
const QUEUE_AGING_STALE_MS = 60 * 1000;
/** BR-MAP-012 — map/geographic client cache 10 phút */
const GEOGRAPHIC_STALE_MS = 10 * 60 * 1000;

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
  const canFetch = useCanFetchProtected();
  const rangeKey = normalizeDateRangeKey(params);
  const dateParams = toDateRangeParams(rangeKey);

  const [
    overviewQuery,
    alertsQuery,
    companyPerformanceQuery,
    geographicQuery,
    officerPerformanceQuery,
    queueAgingQuery,
    reportFunnelQuery,
    reportTrendQuery,
    pollutionAnalyticsQuery,
    resolutionDistributionQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: adminOverviewKeys.overview(rangeKey),
        queryFn: () => fetchAdminDashboardOverview(dateParams),
        select: (envelope: ApiEnvelope<AdminDashboardOverview>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.alerts(),
        queryFn: () => fetchAdminDashboardAlerts(),
        select: (envelope: ApiEnvelope<AdminDashboardAlert[]>) => envelope.data,
        staleTime: ALERTS_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.companyPerformance(rangeKey),
        queryFn: () => fetchAdminDashboardCompanyPerformance(dateParams),
        select: (envelope: ApiEnvelope<AdminCompanyPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.geographic(rangeKey),
        queryFn: () => fetchAdminDashboardGeographic(dateParams),
        select: (envelope: ApiEnvelope<AdminGeographicData>) => envelope.data,
        staleTime: GEOGRAPHIC_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.officerPerformance(rangeKey),
        queryFn: () => fetchAdminDashboardOfficerPerformance(dateParams),
        select: (envelope: ApiEnvelope<AdminOfficerPerformanceItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.queueAging(),
        queryFn: () => fetchAdminDashboardQueueAging(),
        select: (envelope: ApiEnvelope<AdminQueueAgingItem[]>) => envelope.data,
        staleTime: QUEUE_AGING_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.reportFunnel(rangeKey),
        queryFn: () => fetchAdminDashboardReportFunnel(dateParams),
        select: (envelope: ApiEnvelope<AdminReportFunnelStage[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.reportTrend(rangeKey),
        queryFn: () => fetchAdminDashboardReportTrend(dateParams),
        select: (envelope: ApiEnvelope<AdminReportTrendPoint[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.pollutionAnalytics(rangeKey),
        queryFn: () => fetchAdminDashboardPollutionAnalytics(dateParams),
        select: (envelope: ApiEnvelope<AdminPollutionAnalyticsItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
      },
      {
        queryKey: adminOverviewKeys.resolutionDistribution(rangeKey),
        queryFn: () => fetchAdminDashboardResolutionDistribution(dateParams),
        select: (envelope: ApiEnvelope<AdminResolutionDistributionItem[]>) => envelope.data,
        staleTime: DASHBOARD_STALE_MS,
        enabled: canFetch,
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
    reportFunnelQuery,
    reportTrendQuery,
    pollutionAnalyticsQuery,
    resolutionDistributionQuery,
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
    reportFunnel: reportFunnelQuery.data,
    reportTrend: reportTrendQuery.data,
    pollutionAnalytics: pollutionAnalyticsQuery.data,
    resolutionDistribution: resolutionDistributionQuery.data,
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
