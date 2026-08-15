/**
 * Tạm thời: biến GET /v1/offices/my/reports (+ org APIs) thành shape dashboard DEO
 * để LEO dùng chung UI. Thay bằng `/v1/dashboard/leo` khi BE sẵn sàng.
 */
import type { CommunityCleanupQueueStats } from '@/lib/api/models/communityCleanup';
import type {
  LeoMyReportItem,
  LeoMyReportsData,
  LeoMyReportsStatus,
} from '@/lib/api/models/office';
import type {
  DeoCompanyPerformanceItem,
  DeoDashboardAlert,
  DeoDashboardOverview,
  DeoGeographicData,
  DeoOfficerPerformanceItem,
  DeoPollutionAnalyticsItem,
  DeoQueueAgingItem,
  DeoRecentActivityItem,
  DeoReportFunnelStage,
  DeoReportStatusItem,
  DeoReportTrendPoint,
  DeoResolutionDistributionItem,
} from '@/lib/api/services/fetchDeoDashboard';

const OPEN_STATUSES = new Set<LeoMyReportsStatus>([
  'Submitted',
  'Verified',
  'InProgress',
  'Reopened',
]);

const DONE_STATUSES = new Set<LeoMyReportsStatus>(['Resolved', 'Closed']);

const FUNNEL_ORDER: LeoMyReportsStatus[] = [
  'Submitted',
  'Verified',
  'InProgress',
  'Resolved',
  'Closed',
  'Rejected',
  'Duplicate',
  'Reopened',
];

const QUEUE_BUCKETS = ['0–1 ngày', '1–3 ngày', '3–7 ngày', '7+ ngày'] as const;
const RESOLUTION_BUCKETS = ['0–4 giờ', '4–24 giờ', '1–3 ngày', '3+ ngày'] as const;

const SEVERITY_WEIGHT: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

export interface LeoDashboardOrgCounts {
  companyCount: number;
  teamCount: number;
  officerCount: number;
}

export interface LeoDashboardViewModel {
  overview: DeoDashboardOverview;
  alerts: DeoDashboardAlert[];
  reportStatus: DeoReportStatusItem[];
  reportTrend: DeoReportTrendPoint[];
  pollutionAnalytics: DeoPollutionAnalyticsItem[];
  reportFunnel: DeoReportFunnelStage[];
  geographic: DeoGeographicData;
  queueAging: DeoQueueAgingItem[];
  resolutionDistribution: DeoResolutionDistributionItem[];
  companyPerformance: DeoCompanyPerformanceItem[];
  officerPerformance: DeoOfficerPerformanceItem[];
  recentActivities: DeoRecentActivityItem[];
}

function asTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function hoursBetween(fromIso: string, toIso: string | null): number | null {
  const from = asTime(fromIso);
  const to = asTime(toIso);
  if (from == null || to == null || to < from) return null;
  return (to - from) / 3_600_000;
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function countByStatus(items: LeoMyReportItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item.status, (map.get(item.status) ?? 0) + 1);
  }
  return map;
}

function wowWindow(items: LeoMyReportItem[], now: Date, pick: (item: LeoMyReportItem) => string) {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();
  let current = 0;
  let previous = 0;
  for (const item of items) {
    const t = asTime(pick(item));
    if (t == null) continue;
    const age = nowMs - t;
    if (age >= 0 && age < weekMs) current += 1;
    else if (age >= weekMs && age < weekMs * 2) previous += 1;
  }
  return percentChange(current, previous);
}

function buildOverview(
  reports: LeoMyReportsData,
  org: LeoDashboardOrgCounts,
  now: Date
): DeoDashboardOverview {
  const items = reports.items;
  const pending = items.filter(item => OPEN_STATUSES.has(item.status)).length;
  const resolved = items.filter(item => DONE_STATUSES.has(item.status)).length;

  const slaSamples = items.filter(item => item.slaResolveDueAt);
  let slaOk = 0;
  for (const item of slaSamples) {
    const due = asTime(item.slaResolveDueAt);
    if (due == null) continue;
    if (DONE_STATUSES.has(item.status)) {
      const done = asTime(item.resolvedAt ?? item.closedAt);
      if (done != null && done <= due) slaOk += 1;
    } else if (now.getTime() <= due) {
      slaOk += 1;
    }
  }

  const resolutionHours = items
    .map(item => hoursBetween(item.createdAt, item.resolvedAt ?? item.closedAt))
    .filter((h): h is number => h != null);
  const averageResolutionHours =
    resolutionHours.length === 0
      ? 0
      : resolutionHours.reduce((sum, h) => sum + h, 0) / resolutionHours.length;

  return {
    totalReports: reports.pagination.totalItems || items.length,
    pendingReports: pending,
    resolvedReports: resolved,
    officeCount: 1,
    companyCount: org.companyCount,
    teamCount: org.teamCount,
    officerCount: org.officerCount,
    slaComplianceRate: slaSamples.length === 0 ? 0 : slaOk / slaSamples.length,
    averageResolutionHours,
    totalReportsChangePercentWoW: wowWindow(items, now, item => item.createdAt),
    pendingReportsChangePercentWoW: null,
    resolvedReportsChangePercentWoW: wowWindow(
      items.filter(item => DONE_STATUSES.has(item.status)),
      now,
      item => item.resolvedAt ?? item.closedAt ?? item.createdAt
    ),
    slaComplianceRateChangePercentWoW: null,
  };
}

function buildReportStatus(items: LeoMyReportItem[]): DeoReportStatusItem[] {
  const counts = countByStatus(items);
  const total = Math.max(1, items.length);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      status,
      count,
      percentage: (count / total) * 100,
    }));
}

function monthKey(iso: string): string | null {
  const t = asTime(iso);
  if (t == null) return null;
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function buildTrend(items: LeoMyReportItem[]): DeoReportTrendPoint[] {
  const buckets = new Map<string, DeoReportTrendPoint>();
  const bump = (key: string, field: 'created' | 'resolved') => {
    const prev = buckets.get(key) ?? { date: key, created: 0, resolved: 0 };
    prev[field] += 1;
    buckets.set(key, prev);
  };
  for (const item of items) {
    const createdKey = monthKey(item.createdAt);
    if (createdKey) bump(createdKey, 'created');
    const doneIso = item.resolvedAt ?? item.closedAt;
    if (doneIso) {
      const doneKey = monthKey(doneIso);
      if (doneKey) bump(doneKey, 'resolved');
    }
  }
  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildPollution(items: LeoMyReportItem[]): DeoPollutionAnalyticsItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = item.categoryName || item.categoryCode || 'Khác';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function buildFunnel(items: LeoMyReportItem[]): DeoReportFunnelStage[] {
  const counts = countByStatus(items);
  return FUNNEL_ORDER.filter(stage => (counts.get(stage) ?? 0) > 0).map(stage => ({
    stage,
    count: counts.get(stage) ?? 0,
  }));
}

function buildGeographic(items: LeoMyReportItem[]): DeoGeographicData {
  const heatmap = items
    .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map(item => ({
      latitude: item.latitude,
      longitude: item.longitude,
      weight: SEVERITY_WEIGHT[item.severity] ?? 1,
    }));
  const markers = items
    .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map(item => ({
      reportId: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      status: item.status,
    }));
  return { heatmap, markers };
}

function queueBucket(ageDays: number): (typeof QUEUE_BUCKETS)[number] {
  if (ageDays < 1) return QUEUE_BUCKETS[0];
  if (ageDays < 3) return QUEUE_BUCKETS[1];
  if (ageDays < 7) return QUEUE_BUCKETS[2];
  return QUEUE_BUCKETS[3];
}

function buildQueueAging(items: LeoMyReportItem[], now: Date): DeoQueueAgingItem[] {
  const waiting = items.filter(item => item.status === 'Submitted' || item.status === 'Verified');
  const counts = new Map<string, number>(QUEUE_BUCKETS.map(b => [b, 0]));
  for (const item of waiting) {
    const created = asTime(item.createdAt);
    if (created == null) continue;
    const days = (now.getTime() - created) / 86_400_000;
    const bucket = queueBucket(days);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return QUEUE_BUCKETS.map(range => ({ range, count: counts.get(range) ?? 0 }));
}

function resolutionBucket(hours: number): (typeof RESOLUTION_BUCKETS)[number] {
  if (hours < 4) return RESOLUTION_BUCKETS[0];
  if (hours < 24) return RESOLUTION_BUCKETS[1];
  if (hours < 72) return RESOLUTION_BUCKETS[2];
  return RESOLUTION_BUCKETS[3];
}

function buildResolution(items: LeoMyReportItem[]): DeoResolutionDistributionItem[] {
  const counts = new Map<string, number>(RESOLUTION_BUCKETS.map(b => [b, 0]));
  for (const item of items) {
    const hours = hoursBetween(item.createdAt, item.resolvedAt ?? item.closedAt);
    if (hours == null) continue;
    const bucket = resolutionBucket(hours);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return RESOLUTION_BUCKETS.map(range => ({ range, count: counts.get(range) ?? 0 }));
}

function buildCompanyPerformance(items: LeoMyReportItem[]): DeoCompanyPerformanceItem[] {
  type Acc = {
    companyName: string;
    assigned: number;
    completed: number;
    onTime: number;
  };
  const map = new Map<string, Acc>();
  for (const item of items) {
    const company = item.assignedCompany;
    if (!company) continue;
    const prev = map.get(company.companyId) ?? {
      companyName: company.companyName,
      assigned: 0,
      completed: 0,
      onTime: 0,
    };
    prev.assigned += 1;
    if (DONE_STATUSES.has(item.status)) {
      prev.completed += 1;
      const due = asTime(item.slaResolveDueAt);
      const done = asTime(item.resolvedAt ?? item.closedAt);
      if (due == null || (done != null && done <= due)) prev.onTime += 1;
    }
    map.set(company.companyId, prev);
  }
  return [...map.entries()].map(([companyId, acc]) => {
    const onTimeRate = acc.completed === 0 ? 0 : acc.onTime / acc.completed;
    const slaRate = onTimeRate;
    const performanceScore = Math.round(
      (acc.assigned === 0 ? 0 : acc.completed / acc.assigned) * 50 + slaRate * 50
    );
    return {
      companyId,
      companyName: acc.companyName,
      assignedTasks: acc.assigned,
      completedTasks: acc.completed,
      onTimeRate,
      slaRate,
      performanceScore,
    };
  });
}

function buildTeamPerformance(items: LeoMyReportItem[]): DeoOfficerPerformanceItem[] {
  type Acc = { name: string; verified: number; hours: number[]; onTime: number };
  const map = new Map<string, Acc>();
  for (const item of items) {
    for (const assignment of item.assignments) {
      const prev = map.get(assignment.teamId) ?? {
        name: assignment.teamName,
        verified: 0,
        hours: [],
        onTime: 0,
      };
      prev.verified += 1;
      const hours = hoursBetween(assignment.assignedAt, assignment.completedAt);
      if (hours != null) prev.hours.push(hours);
      if (assignment.status === 'Completed') prev.onTime += 1;
      map.set(assignment.teamId, prev);
    }
  }
  return [...map.entries()].map(([officerId, acc]) => {
    const averageHours =
      acc.hours.length === 0 ? 0 : acc.hours.reduce((s, h) => s + h, 0) / acc.hours.length;
    const slaRate = acc.verified === 0 ? 0 : acc.onTime / acc.verified;
    return {
      officerId,
      officerName: acc.name,
      verifiedReports: acc.verified,
      averageHours,
      slaRate,
      score: Math.round(slaRate * 100),
    };
  });
}

function buildActivities(items: LeoMyReportItem[]): DeoRecentActivityItem[] {
  const rows: DeoRecentActivityItem[] = items.map(item => {
    const time =
      item.closedAt ?? item.resolvedAt ?? item.startedAt ?? item.verifiedAt ?? item.createdAt;
    return {
      time,
      type: item.status,
      description: `${item.code} · ${item.categoryName || item.categoryCode} · ${item.address}`,
    };
  });
  return rows.sort((a, b) => (asTime(b.time) ?? 0) - (asTime(a.time) ?? 0)).slice(0, 20);
}

function buildAlerts(
  items: LeoMyReportItem[],
  community: CommunityCleanupQueueStats | null,
  now: Date
): DeoDashboardAlert[] {
  const alerts: DeoDashboardAlert[] = [];
  const slaOverdue = items.filter(item => {
    if (
      DONE_STATUSES.has(item.status) ||
      item.status === 'Rejected' ||
      item.status === 'Duplicate'
    ) {
      return false;
    }
    const due = asTime(item.slaResolveDueAt);
    return due != null && due < now.getTime();
  }).length;
  if (slaOverdue > 0) {
    alerts.push({
      type: 'SlaOverdue',
      severity: 'High',
      message: `${slaOverdue} báo cáo đã quá hạn SLA xử lý.`,
    });
  }

  const unverified = items.filter(item => item.status === 'Submitted').length;
  if (unverified > 0) {
    alerts.push({
      type: 'PendingVerification',
      severity: unverified > 10 ? 'High' : 'Medium',
      message: `${unverified} báo cáo đang chờ xác minh.`,
    });
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const verifiedUnassigned = items.filter(item => {
    if (item.status !== 'Verified') return false;
    if (item.assignmentCount > 0 || item.assignedCompany) return false;
    const verified = asTime(item.verifiedAt ?? item.createdAt);
    return verified != null && now.getTime() - verified > dayMs;
  }).length;
  if (verifiedUnassigned > 0) {
    alerts.push({
      type: 'UnassignedOver24h',
      severity: 'Medium',
      message: `${verifiedUnassigned} báo cáo đã xác minh nhưng chưa phân công quá 24 giờ.`,
    });
  }

  const pendingCleanup = community?.countsByStatus.PendingVerification ?? 0;
  if (pendingCleanup > 0) {
    alerts.push({
      type: 'CommunityPendingVerification',
      severity: 'Low',
      message: `${pendingCleanup} chương trình cộng đồng chờ xác thực hoàn thành.`,
    });
  }

  return alerts;
}

export function aggregateLeoDashboard(
  reports: LeoMyReportsData,
  org: LeoDashboardOrgCounts,
  community: CommunityCleanupQueueStats | null,
  now: Date = new Date()
): LeoDashboardViewModel {
  const items = reports.items;
  return {
    overview: buildOverview(reports, org, now),
    alerts: buildAlerts(items, community, now),
    reportStatus: buildReportStatus(items),
    reportTrend: buildTrend(items),
    pollutionAnalytics: buildPollution(items),
    reportFunnel: buildFunnel(items),
    geographic: buildGeographic(items),
    queueAging: buildQueueAging(items, now),
    resolutionDistribution: buildResolution(items),
    companyPerformance: buildCompanyPerformance(items),
    officerPerformance: buildTeamPerformance(items),
    recentActivities: buildActivities(items),
  };
}
