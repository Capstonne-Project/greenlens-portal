/**
 * L2 — Company dashboard analytics (authenticated).
 * GET /v1/dashboard/company/*
 */
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import apiService from '../core';

/** Optional ISO date range shared by company dashboard endpoints. */
export interface CompanyDashboardDateRangeParams {
  from?: string;
  to?: string;
}

export interface CompanyDashboardOverview {
  assignedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  activeTeams: number;
  activeStaff: number;
  slaComplianceRate: number;
  averageResolutionHours: number;
}

export interface CompanyQueueAgingItem {
  range: string;
  count: number;
}

export interface CompanyRecentActivityItem {
  time: string;
  type: string;
  description: string;
}

/**
 * Staff performance row (camelCase per company domain).
 * Swagger sample returned an empty array — field names inferred from UI mock + admin officer style.
 */
export interface CompanyStaffPerformanceItem {
  staffId: string;
  staffName: string;
  completedTasks: number;
  onTimeRate: number;
  averageHours: number;
}

export interface CompanyTaskStatusItem {
  status: string;
  count: number;
  percentage?: number;
}

export interface CompanyTeamPerformanceItem {
  teamId: string;
  teamName: string;
  assignedTasks: number;
  completedTasks: number;
  onTimeRate: number;
  averageHours: number;
}

export interface CompanyUpcomingDeadlineItem {
  taskId: string;
  reportCode?: string;
  location?: string;
  deadline: string;
  remainingHours?: number;
  priority?: string;
  status?: string;
}

/**
 * Daily dispatched vs completed (swagger: "Daily dispatched vs completed").
 * Primary fields: `dispatched` + `completed`. `assigned` is optional if BE uses that alias.
 */
export interface CompanyWorkloadTrendPoint {
  date: string;
  dispatched: number;
  completed: number;
  assigned?: number;
}

function buildDateRangeQuery(
  params?: CompanyDashboardDateRangeParams
): Record<string, string> | undefined {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.from?.trim()) query.from = params.from.trim();
  if (params.to?.trim()) query.to = params.to.trim();
  return Object.keys(query).length > 0 ? query : undefined;
}

/** GET /v1/dashboard/company/overview */
export async function fetchCompanyDashboardOverview(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyDashboardOverview>> {
  const res = await apiService.get<ApiEnvelope<CompanyDashboardOverview>>(
    '/v1/dashboard/company/overview',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/queue-aging */
export async function fetchCompanyDashboardQueueAging(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyQueueAgingItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyQueueAgingItem[]>>(
    '/v1/dashboard/company/queue-aging',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/recent-activities */
export async function fetchCompanyDashboardRecentActivities(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyRecentActivityItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyRecentActivityItem[]>>(
    '/v1/dashboard/company/recent-activities',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/**
 * GET /v1/dashboard/company/staff-performance
 * Empty arrays observed in swagger samples — DTO kept to expected BE camelCase.
 */
export async function fetchCompanyDashboardStaffPerformance(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyStaffPerformanceItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyStaffPerformanceItem[]>>(
    '/v1/dashboard/company/staff-performance',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/task-status */
export async function fetchCompanyDashboardTaskStatus(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyTaskStatusItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyTaskStatusItem[]>>(
    '/v1/dashboard/company/task-status',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/team-performance */
export async function fetchCompanyDashboardTeamPerformance(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyTeamPerformanceItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyTeamPerformanceItem[]>>(
    '/v1/dashboard/company/team-performance',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/upcoming-deadlines */
export async function fetchCompanyDashboardUpcomingDeadlines(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyUpcomingDeadlineItem[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyUpcomingDeadlineItem[]>>(
    '/v1/dashboard/company/upcoming-deadlines',
    buildDateRangeQuery(params)
  );
  return res.data;
}

/** GET /v1/dashboard/company/workload-trend */
export async function fetchCompanyDashboardWorkloadTrend(
  params?: CompanyDashboardDateRangeParams
): Promise<ApiEnvelope<CompanyWorkloadTrendPoint[]>> {
  const res = await apiService.get<ApiEnvelope<CompanyWorkloadTrendPoint[]>>(
    '/v1/dashboard/company/workload-trend',
    buildDateRangeQuery(params)
  );
  return res.data;
}

const companyDashboardApi = {
  fetchCompanyDashboardOverview,
  fetchCompanyDashboardQueueAging,
  fetchCompanyDashboardRecentActivities,
  fetchCompanyDashboardStaffPerformance,
  fetchCompanyDashboardTaskStatus,
  fetchCompanyDashboardTeamPerformance,
  fetchCompanyDashboardUpcomingDeadlines,
  fetchCompanyDashboardWorkloadTrend,
};

export default companyDashboardApi;
