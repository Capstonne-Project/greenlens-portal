/**
 * L2 — DEO department dashboard analytics (authenticated).
 *
 * Exactly 12 endpoints from Swagger `GET /v1/dashboard/deo/*`:
 * 1.  /overview
 * 2.  /alerts
 * 3.  /report-status
 * 4.  /report-trend
 * 5.  /pollution-analytics
 * 6.  /report-funnel
 * 7.  /geographic
 * 8.  /queue-aging
 * 9.  /resolution-distribution
 * 10. /company-performance
 * 11. /officer-performance
 * 12. /recent-activities
 */
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '../core';

/** Optional ISO date-time range (`from` / `to` query). */
export interface DeoDashboardDateRangeParams {
  from?: string;
  to?: string;
}

/** Swagger enum for GET /report-trend `groupBy`. */
export type DeoReportTrendGroupBy = 'Day' | 'Week' | 'Month';

export interface DeoDashboardTrendParams extends DeoDashboardDateRangeParams {
  groupBy?: DeoReportTrendGroupBy;
}

export interface DeoRecentActivitiesParams {
  page?: number;
  pageSize?: number;
}

/** Department overview KPIs (reports + org structure). */
export interface DeoDashboardOverview {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  officeCount: number;
  companyCount: number;
  teamCount: number;
  officerCount: number;
  slaComplianceRate: number;
  averageResolutionHours: number;
  /**
   * % thay đổi so với cùng metric tuần trước (WoW).
   * BE hiện CHƯA có — optional để FE sẵn sàng khi bổ sung trên GET /overview.
   * null/undefined → KPI badge hiện "—".
   */
  totalReportsChangePercentWoW?: number | null;
  pendingReportsChangePercentWoW?: number | null;
  resolvedReportsChangePercentWoW?: number | null;
  slaComplianceRateChangePercentWoW?: number | null;
}

/** Documented severities; `| string` keeps unknown BE values type-safe. */
export type DeoDashboardAlertSeverity = 'High' | 'Medium' | 'Low' | string;

export interface DeoDashboardAlert {
  type: string;
  severity: DeoDashboardAlertSeverity;
  message: string;
}

export interface DeoReportStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface DeoReportTrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface DeoPollutionAnalyticsItem {
  category: string;
  count: number;
}

export interface DeoReportFunnelStage {
  stage: string;
  count: number;
}

export interface DeoGeographicHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface DeoGeographicMarker {
  reportId: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface DeoGeographicData {
  heatmap: DeoGeographicHeatmapPoint[];
  markers: DeoGeographicMarker[];
}

export interface DeoQueueAgingItem {
  range: string;
  count: number;
}

export interface DeoResolutionDistributionItem {
  range: string;
  count: number;
}

export interface DeoCompanyPerformanceItem {
  companyId: string;
  companyName: string;
  assignedTasks: number;
  completedTasks: number;
  onTimeRate: number;
  slaRate: number;
  performanceScore: number;
}

export interface DeoOfficerPerformanceItem {
  officerId: string;
  officerName: string;
  verifiedReports: number;
  averageHours: number;
  slaRate: number;
  score: number;
}

export interface DeoRecentActivityItem {
  time: string;
  type: string;
  description: string;
}

interface DeoDashboardOverviewRaw {
  totalReports?: number;
  pendingReports?: number;
  resolvedReports?: number;
  officeCount?: number;
  offices?: number;
  activeOffices?: number;
  companyCount?: number;
  activeCompanies?: number;
  teamCount?: number;
  activeTeams?: number;
  officerCount?: number;
  activeOfficers?: number;
  leoCount?: number;
  slaComplianceRate?: number;
  averageResolutionHours?: number;
  /** WoW % — aliases chấp nhận khi BE bổ sung */
  totalReportsChangePercentWoW?: number;
  totalReportsWowPercent?: number;
  pendingReportsChangePercentWoW?: number;
  pendingReportsWowPercent?: number;
  resolvedReportsChangePercentWoW?: number;
  resolvedReportsWowPercent?: number;
  slaComplianceRateChangePercentWoW?: number;
  slaComplianceRateWowPercent?: number;
}

interface DeoReportTrendPointRaw {
  date?: string;
  created?: number;
  submitted?: number;
  resolved?: number;
  count?: number;
}

interface DeoGeographicDataRaw {
  heatmap?: DeoGeographicHeatmapPoint[];
  markers?: DeoGeographicMarker[];
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function unwrapList<T>(raw: T[] | { items?: T[]; points?: T[] } | null | undefined): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.points)) return raw.points;
  return [];
}

function buildDateRangeQuery(
  params?: DeoDashboardDateRangeParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.from?.trim()) query.from = params.from.trim();
  if (params.to?.trim()) query.to = params.to.trim();
  return Object.keys(query).length > 0 ? query : undefined;
}

function buildTrendQuery(params?: DeoDashboardTrendParams): Record<string, string> | undefined {
  const query: Record<string, string> = { ...buildDateRangeQuery(params) };
  if (params?.groupBy) query.groupBy = params.groupBy;
  return Object.keys(query).length > 0 ? query : undefined;
}

function buildRecentActivitiesQuery(
  params?: DeoRecentActivitiesParams
): Record<string, number> | undefined {
  if (!params) return undefined;
  const query: Record<string, number> = {};
  if (params.page != null) query.page = params.page;
  if (params.pageSize != null) query.pageSize = params.pageSize;
  return Object.keys(query).length > 0 ? query : undefined;
}

function asOptionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeOverview(raw: DeoDashboardOverviewRaw | null | undefined): DeoDashboardOverview {
  const data = raw ?? {};
  return {
    totalReports: asNumber(data.totalReports),
    pendingReports: asNumber(data.pendingReports),
    resolvedReports: asNumber(data.resolvedReports),
    officeCount: asNumber(data.officeCount ?? data.activeOffices ?? data.offices),
    companyCount: asNumber(data.companyCount ?? data.activeCompanies),
    teamCount: asNumber(data.teamCount ?? data.activeTeams),
    officerCount: asNumber(data.officerCount ?? data.activeOfficers ?? data.leoCount),
    slaComplianceRate: asNumber(data.slaComplianceRate),
    averageResolutionHours: asNumber(data.averageResolutionHours),
    totalReportsChangePercentWoW: asOptionalNumber(
      data.totalReportsChangePercentWoW ?? data.totalReportsWowPercent
    ),
    pendingReportsChangePercentWoW: asOptionalNumber(
      data.pendingReportsChangePercentWoW ?? data.pendingReportsWowPercent
    ),
    resolvedReportsChangePercentWoW: asOptionalNumber(
      data.resolvedReportsChangePercentWoW ?? data.resolvedReportsWowPercent
    ),
    slaComplianceRateChangePercentWoW: asOptionalNumber(
      data.slaComplianceRateChangePercentWoW ?? data.slaComplianceRateWowPercent
    ),
  };
}

function normalizeTrendPoint(raw: DeoReportTrendPointRaw): DeoReportTrendPoint {
  return {
    date: raw.date?.trim() || '',
    created: asNumber(raw.created ?? raw.submitted ?? raw.count),
    resolved: asNumber(raw.resolved),
  };
}

function envelopeWith<T>(source: ApiEnvelope<unknown>, data: T): ApiEnvelope<T> {
  return {
    code: source.code,
    message: source.message,
    status: source.status,
    data,
  };
}

/** GET /v1/dashboard/deo/overview */
export async function fetchDeoDashboardOverview(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoDashboardOverview>> {
  const res = await apiService.get<ApiEnvelope<DeoDashboardOverviewRaw>>(
    '/v1/dashboard/deo/overview',
    buildDateRangeQuery(params)
  );
  return envelopeWith(res.data, normalizeOverview(res.data.data));
}

/** GET /v1/dashboard/deo/alerts — no query params. */
export async function fetchDeoDashboardAlerts(): Promise<ApiEnvelope<DeoDashboardAlert[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoDashboardAlert[] | { items?: DeoDashboardAlert[] }>
  >('/v1/dashboard/deo/alerts');
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/report-status */
export async function fetchDeoDashboardReportStatus(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoReportStatusItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoReportStatusItem[] | { items?: DeoReportStatusItem[] }>
  >('/v1/dashboard/deo/report-status', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/report-trend
 * Params: from, to, groupBy (Day|Week|Month).
 * Overview: filter 1/2/3/6 Tháng → from/to thật; FE luôn vẽ đủ 12 tháng, merge data vào tháng có điểm.
 * Tooltip: created (mới) + resolved (đã giải quyết).
 * Wishlist: periodChangeCount, periodChangePercent, averageCreatedPerPeriod.
 */
export async function fetchDeoDashboardReportTrend(
  params?: DeoDashboardTrendParams
): Promise<ApiEnvelope<DeoReportTrendPoint[]>> {
  const res = await apiService.get<
    ApiEnvelope<
      | DeoReportTrendPointRaw[]
      | { points?: DeoReportTrendPointRaw[]; items?: DeoReportTrendPointRaw[] }
    >
  >('/v1/dashboard/deo/report-trend', buildTrendQuery(params));

  return envelopeWith(
    res.data,
    unwrapList(res.data.data)
      .map(normalizeTrendPoint)
      .filter(point => point.date.length > 0)
  );
}

/** GET /v1/dashboard/deo/pollution-analytics */
export async function fetchDeoDashboardPollutionAnalytics(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoPollutionAnalyticsItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoPollutionAnalyticsItem[] | { items?: DeoPollutionAnalyticsItem[] }>
  >('/v1/dashboard/deo/pollution-analytics', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/report-funnel */
export async function fetchDeoDashboardReportFunnel(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoReportFunnelStage[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoReportFunnelStage[] | { items?: DeoReportFunnelStage[] }>
  >('/v1/dashboard/deo/report-funnel', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/geographic */
export async function fetchDeoDashboardGeographic(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoGeographicData>> {
  const res = await apiService.get<ApiEnvelope<DeoGeographicDataRaw>>(
    '/v1/dashboard/deo/geographic',
    buildDateRangeQuery(params)
  );
  const raw = res.data.data;
  return envelopeWith(res.data, {
    heatmap: unwrapList(raw?.heatmap),
    markers: unwrapList(raw?.markers),
  });
}

/** GET /v1/dashboard/deo/queue-aging — no query params. */
export async function fetchDeoDashboardQueueAging(): Promise<ApiEnvelope<DeoQueueAgingItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoQueueAgingItem[] | { items?: DeoQueueAgingItem[] }>
  >('/v1/dashboard/deo/queue-aging');
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/resolution-distribution */
export async function fetchDeoDashboardResolutionDistribution(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoResolutionDistributionItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoResolutionDistributionItem[] | { items?: DeoResolutionDistributionItem[] }>
  >('/v1/dashboard/deo/resolution-distribution', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/company-performance */
export async function fetchDeoDashboardCompanyPerformance(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoCompanyPerformanceItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoCompanyPerformanceItem[] | { items?: DeoCompanyPerformanceItem[] }>
  >('/v1/dashboard/deo/company-performance', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/officer-performance */
export async function fetchDeoDashboardOfficerPerformance(
  params?: DeoDashboardDateRangeParams
): Promise<ApiEnvelope<DeoOfficerPerformanceItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoOfficerPerformanceItem[] | { items?: DeoOfficerPerformanceItem[] }>
  >('/v1/dashboard/deo/officer-performance', buildDateRangeQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

/** GET /v1/dashboard/deo/recent-activities — default page=1, pageSize=20. */
export async function fetchDeoDashboardRecentActivities(
  params?: DeoRecentActivitiesParams
): Promise<ApiEnvelope<DeoRecentActivityItem[]>> {
  const res = await apiService.get<
    ApiEnvelope<DeoRecentActivityItem[] | { items?: DeoRecentActivityItem[] }>
  >('/v1/dashboard/deo/recent-activities', buildRecentActivitiesQuery(params));
  return envelopeWith(res.data, unwrapList(res.data.data));
}

const deoDashboardApi = {
  fetchDeoDashboardOverview,
  fetchDeoDashboardAlerts,
  fetchDeoDashboardReportStatus,
  fetchDeoDashboardReportTrend,
  fetchDeoDashboardPollutionAnalytics,
  fetchDeoDashboardReportFunnel,
  fetchDeoDashboardGeographic,
  fetchDeoDashboardQueueAging,
  fetchDeoDashboardResolutionDistribution,
  fetchDeoDashboardCompanyPerformance,
  fetchDeoDashboardOfficerPerformance,
  fetchDeoDashboardRecentActivities,
};

export default deoDashboardApi;
