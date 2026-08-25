/**
 * L2 — Admin dashboard analytics (authenticated).
 * GET /v1/dashboard/admin/*
 */
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '../core';

/** Optional ISO date range shared by overview / performance / geographic endpoints. */
export interface AdminDashboardDateRangeParams {
  from?: string;
  to?: string;
}

export interface AdminDashboardOverview {
  totalUsers: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  activeCompanies: number;
  activeTeams: number;
  slaComplianceRate: number;
  averageResolutionHours: number;
}

/** Documented severities; `| string` keeps unknown BE values type-safe without runtime narrowing. */
export type AdminDashboardAlertSeverity = 'High' | 'Medium' | 'Low' | string;

export interface AdminDashboardAlert {
  type: string;
  severity: AdminDashboardAlertSeverity;
  message: string;
}

export interface AdminCompanyPerformanceItem {
  companyId: string;
  companyName: string;
  assignedTasks: number;
  completedTasks: number;
  onTimeRate: number;
  slaRate: number;
  performanceScore: number;
}

export interface AdminGeographicHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface AdminGeographicMarker {
  reportId: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface AdminGeographicData {
  heatmap: AdminGeographicHeatmapPoint[];
  markers: AdminGeographicMarker[];
}

export interface AdminOfficerPerformanceItem {
  officerId: string;
  officerName: string;
  verifiedReports: number;
  averageHours: number;
  slaRate: number;
  score: number;
}

export interface AdminQueueAgingItem {
  range: string;
  count: number;
}

export interface AdminRecentActivityItem {
  time: string;
  type: string;
  description: string;
}

export interface AdminRecentActivitiesParams {
  page?: number;
  pageSize?: number;
}

export interface AdminReportFunnelStage {
  stage: string;
  count: number;
}

export interface AdminReportStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface AdminPollutionAnalyticsItem {
  category: string;
  count: number;
}

export interface AdminResolutionDistributionItem {
  range: string;
  count: number;
}

export interface AdminReportTrendPoint {
  date: string;
  /** Total for single-series fallback */
  count: number;
  /** BE: newly created reports */
  created?: number;
  /** Legacy / alias of `created` */
  submitted?: number;
  resolved?: number;
}

type AdminReportTrendPointRaw = {
  date: string;
  count?: number;
  created?: number;
  submitted?: number;
  resolved?: number;
};

function normalizeAdminReportTrendPoint(raw: AdminReportTrendPointRaw): AdminReportTrendPoint {
  const created = raw.created ?? raw.submitted ?? 0;
  const resolved = raw.resolved ?? 0;
  const count = raw.count ?? created + resolved;

  return {
    date: raw.date,
    count,
    created,
    submitted: created,
    resolved,
  };
}

function buildDateRangeQuery(
  params?: AdminDashboardDateRangeParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.from?.trim()) query.from = params.from.trim();
  if (params.to?.trim()) query.to = params.to.trim();
  return Object.keys(query).length > 0 ? query : undefined;
}

function buildRecentActivitiesQuery(
  params?: AdminRecentActivitiesParams
): Record<string, number> | undefined {
  if (!params) return undefined;
  const query: Record<string, number> = {};
  if (params.page != null) query.page = params.page;
  if (params.pageSize != null) query.pageSize = params.pageSize;
  return Object.keys(query).length > 0 ? query : undefined;
}

/** GET /v1/dashboard/admin/overview */
export async function fetchAdminDashboardOverview(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminDashboardOverview>> {
  const res = await apiService.get<ApiEnvelope<AdminDashboardOverview>>(
    '/v1/dashboard/admin/overview',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/alerts */
export async function fetchAdminDashboardAlerts(): Promise<ApiEnvelope<AdminDashboardAlert[]>> {
  const res = await apiService.get<ApiEnvelope<AdminDashboardAlert[]>>(
    '/v1/dashboard/admin/alerts'
  );
  return res.data;
}

/** GET /v1/dashboard/admin/company-performance */
export async function fetchAdminDashboardCompanyPerformance(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminCompanyPerformanceItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminCompanyPerformanceItem[]>>(
    '/v1/dashboard/admin/company-performance',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/geographic */
export async function fetchAdminDashboardGeographic(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminGeographicData>> {
  const res = await apiService.get<ApiEnvelope<AdminGeographicData>>(
    '/v1/dashboard/admin/geographic',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/officer-performance */
export async function fetchAdminDashboardOfficerPerformance(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminOfficerPerformanceItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminOfficerPerformanceItem[]>>(
    '/v1/dashboard/admin/officer-performance',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/queue-aging */
export async function fetchAdminDashboardQueueAging(): Promise<ApiEnvelope<AdminQueueAgingItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminQueueAgingItem[]>>(
    '/v1/dashboard/admin/queue-aging'
  );
  return res.data;
}

/** GET /v1/dashboard/admin/recent-activities */
export async function fetchAdminDashboardRecentActivities(
  params?: AdminRecentActivitiesParams
): Promise<ApiEnvelope<AdminRecentActivityItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminRecentActivityItem[]>>(
    '/v1/dashboard/admin/recent-activities',
    buildRecentActivitiesQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/report-funnel */
export async function fetchAdminDashboardReportFunnel(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminReportFunnelStage[]>> {
  const res = await apiService.get<ApiEnvelope<AdminReportFunnelStage[]>>(
    '/v1/dashboard/admin/report-funnel',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/report-status */
export async function fetchAdminDashboardReportStatus(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminReportStatusItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminReportStatusItem[]>>(
    '/v1/dashboard/admin/report-status',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/pollution-analytics */
export async function fetchAdminDashboardPollutionAnalytics(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminPollutionAnalyticsItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminPollutionAnalyticsItem[]>>(
    '/v1/dashboard/admin/pollution-analytics',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/resolution-distribution */
export async function fetchAdminDashboardResolutionDistribution(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminResolutionDistributionItem[]>> {
  const res = await apiService.get<ApiEnvelope<AdminResolutionDistributionItem[]>>(
    '/v1/dashboard/admin/resolution-distribution',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/admin/report-trend */
export async function fetchAdminDashboardReportTrend(
  params?: AdminDashboardDateRangeParams
): Promise<ApiEnvelope<AdminReportTrendPoint[]>> {
  const res = await apiService.get<
    ApiEnvelope<
      | AdminReportTrendPoint[]
      | { points?: AdminReportTrendPoint[]; items?: AdminReportTrendPoint[] }
    >
  >('/v1/dashboard/admin/report-trend', buildDateRangeQuery(params));

  const raw = res.data.data;
  const points = Array.isArray(raw) ? raw : (raw?.points ?? raw?.items ?? []);

  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: (points as AdminReportTrendPointRaw[]).map(normalizeAdminReportTrendPoint),
  };
}

const adminDashboardApi = {
  fetchAdminDashboardOverview,
  fetchAdminDashboardAlerts,
  fetchAdminDashboardCompanyPerformance,
  fetchAdminDashboardGeographic,
  fetchAdminDashboardOfficerPerformance,
  fetchAdminDashboardQueueAging,
  fetchAdminDashboardRecentActivities,
  fetchAdminDashboardReportFunnel,
  fetchAdminDashboardReportStatus,
  fetchAdminDashboardPollutionAnalytics,
  fetchAdminDashboardResolutionDistribution,
  fetchAdminDashboardReportTrend,
};

export default adminDashboardApi;
