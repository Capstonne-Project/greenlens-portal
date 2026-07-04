import type { AdminUser } from '@/lib/api/models/adminUser';
import type { MapReportDetailItem, MapReportStatus } from '@/lib/api/services/fetchMap';
import {
  MODERATION_REPORT_STATUSES,
  normalizeReportStatus,
  OPEN_REPORT_STATUSES,
  REPORT_STATUS_CHART_COLORS,
  REPORT_STATUS_LABEL_VI,
} from '@/lib/constants/reportStatus';

export { MODERATION_REPORT_STATUSES, OPEN_REPORT_STATUSES, REPORT_STATUS_LABEL_VI };
export const REPORT_STATUS_COLORS: Record<MapReportStatus, string> = REPORT_STATUS_CHART_COLORS;

export type OverviewGrowthRange = 'day' | 'week' | 'month';

export interface OverviewStatCard {
  key: string;
  label: string;
  value: number;
  hint: string;
  ringPercent: number;
}

export interface OverviewStatusSlice {
  status: MapReportStatus;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface OverviewGrowthPoint {
  label: string;
  reports: number;
  users: number;
}

export interface OverviewActivityItem {
  id: string;
  title: string;
  timeLabel: string;
}

export interface OverviewIntegrationItem {
  id: string;
  label: string;
  latencyMs: number | null;
  status: 'stable' | 'slow' | 'error';
}

export interface AdminOverviewSnapshot {
  updatedAt: string;
  stats: OverviewStatCard[];
  growth: OverviewGrowthPoint[];
  growthTotalReports: number;
  growthTotalUsers: number;
  statusSlices: OverviewStatusSlice[];
  reportTotal: number;
  activities: OverviewActivityItem[];
  integrations: OverviewIntegrationItem[];
  categoryCount: number;
}

export function formatOverviewNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatOverviewCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function isValidCreatedAt(iso: string | undefined): boolean {
  if (!iso?.trim()) return false;
  const s = iso.trim();
  if (s.startsWith('0001-01-01')) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.getFullYear() > 1;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function bucketKey(date: Date, range: OverviewGrowthRange): string {
  if (range === 'day') {
    return startOfDay(date).toISOString().slice(0, 10);
  }

  if (range === 'week') {
    return startOfWeek(date).toISOString().slice(0, 10);
  }

  const monthStart = startOfMonth(date);

  return `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
}

function bucketLabel(key: string, range: OverviewGrowthRange): string {
  if (range === 'month') {
    const [year, month] = key.split('-');
    return `T${Number(month)}/${year.slice(-2)}`;
  }
  const d = new Date(`${key}T00:00:00`);
  if (range === 'week') {
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d);
  }
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d);
}

function buildGrowthSeries(
  reports: MapReportDetailItem[],
  users: AdminUser[],
  range: OverviewGrowthRange
): OverviewGrowthPoint[] {
  const reportBuckets = new Map<string, number>();
  const userBuckets = new Map<string, number>();

  for (const report of reports) {
    if (!isValidCreatedAt(report.createdAt)) continue;
    const key = bucketKey(new Date(report.createdAt), range);
    reportBuckets.set(key, (reportBuckets.get(key) ?? 0) + 1);
  }

  for (const user of users) {
    if (!isValidCreatedAt(user.createdAt)) continue;
    const key = bucketKey(new Date(user.createdAt), range);
    userBuckets.set(key, (userBuckets.get(key) ?? 0) + 1);
  }

  const keys = new Set([...reportBuckets.keys(), ...userBuckets.keys()]);
  if (keys.size === 0) {
    const now = new Date();
    const fallbackKeys: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now);
      if (range === 'month') d.setMonth(d.getMonth() - i);
      else if (range === 'week') d.setDate(d.getDate() - i * 7);
      else d.setDate(d.getDate() - i);
      fallbackKeys.push(bucketKey(d, range));
    }
    return fallbackKeys.map(key => ({
      label: bucketLabel(key, range),
      reports: reportBuckets.get(key) ?? 0,
      users: userBuckets.get(key) ?? 0,
    }));
  }

  return [...keys]
    .sort()
    .slice(-12)
    .map(key => ({
      label: bucketLabel(key, range),
      reports: reportBuckets.get(key) ?? 0,
      users: userBuckets.get(key) ?? 0,
    }));
}

function relativeTimeVi(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'Vừa xong';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function integrationStatus(latencyMs: number | null): OverviewIntegrationItem['status'] {
  if (latencyMs == null) return 'error';
  if (latencyMs >= 1_000) return 'slow';
  return 'stable';
}

export function buildAdminOverviewSnapshot(input: {
  users: AdminUser[];
  reports: MapReportDetailItem[];
  categoryCount: number;
  growthRange: OverviewGrowthRange;
  integrationLatencies: {
    mapMs: number | null;
    catalogMs: number | null;
    usersMs: number | null;
  };
}): AdminOverviewSnapshot {
  const { users, categoryCount, growthRange, integrationLatencies } = input;
  const reports = input.reports.map(r => ({
    ...r,
    status: normalizeReportStatus(String(r.status)),
  }));
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isEmailVerified).length;
  const openReports = reports.filter(r => OPEN_REPORT_STATUSES.includes(r.status)).length;
  const moderationQueue = reports.filter(r => MODERATION_REPORT_STATUSES.includes(r.status)).length;
  const duplicateReports = reports.filter(r => r.status === 'Duplicate').length;
  const reportTotal = reports.length;

  const stats: OverviewStatCard[] = [
    {
      key: 'users',
      label: 'Tổng người dùng',
      value: totalUsers,
      hint:
        verifiedUsers > 0
          ? `${formatOverviewNumber(verifiedUsers)} đã xác minh email`
          : 'Chưa có người dùng xác minh',
      ringPercent: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    },
    {
      key: 'open-reports',
      label: 'Báo cáo đang mở',
      value: openReports,
      hint:
        reportTotal > 0
          ? `Tổng ${formatOverviewNumber(reportTotal)} trên bản đồ`
          : 'Chưa có báo cáo',
      ringPercent: reportTotal > 0 ? Math.round((openReports / reportTotal) * 100) : 0,
    },
    {
      key: 'moderation',
      label: 'Chờ kiểm duyệt',
      value: moderationQueue,
      hint: moderationQueue > 0 ? 'Trạng thái Đã gửi' : 'Không có hàng chờ',
      ringPercent: reportTotal > 0 ? Math.round((moderationQueue / reportTotal) * 100) : 0,
    },
    {
      key: 'duplicate',
      label: 'Nghi ngờ trùng lặp',
      value: duplicateReports,
      hint: duplicateReports > 0 ? 'Trạng thái Trùng lặp' : 'Chưa ghi nhận',
      ringPercent: reportTotal > 0 ? Math.round((duplicateReports / reportTotal) * 100) : 0,
    },
  ];

  const statusCounts = new Map<MapReportStatus, number>();
  for (const report of reports) {
    statusCounts.set(report.status, (statusCounts.get(report.status) ?? 0) + 1);
  }

  const statusSlices: OverviewStatusSlice[] = (
    Object.keys(REPORT_STATUS_LABEL_VI) as MapReportStatus[]
  )
    .map(status => {
      const count = statusCounts.get(status) ?? 0;
      return {
        status,
        label: REPORT_STATUS_LABEL_VI[status],
        count,
        percent: reportTotal > 0 ? Math.round((count / reportTotal) * 100) : 0,
        color: REPORT_STATUS_COLORS[status],
      };
    })
    .filter(slice => slice.count > 0);

  const growth = buildGrowthSeries(reports, users, growthRange);
  const growthTotalReports = growth.reduce((sum, point) => sum + point.reports, 0);
  const growthTotalUsers = growth.reduce((sum, point) => sum + point.users, 0);

  const activities: OverviewActivityItem[] = [...reports]
    .filter(r => isValidCreatedAt(r.createdAt))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
    .map(report => ({
      id: report.id,
      title: `${report.code} · ${report.title || REPORT_STATUS_LABEL_VI[report.status]}`,
      timeLabel: relativeTimeVi(report.createdAt),
    }));

  const integrations: OverviewIntegrationItem[] = [
    {
      id: 'map',
      label: 'Bản đồ báo cáo',
      latencyMs: integrationLatencies.mapMs,
      status: integrationStatus(integrationLatencies.mapMs),
    },
    {
      id: 'catalog',
      label: 'Danh mục ô nhiễm',
      latencyMs: integrationLatencies.catalogMs,
      status: integrationStatus(integrationLatencies.catalogMs),
    },
    {
      id: 'users',
      label: 'Quản trị người dùng',
      latencyMs: integrationLatencies.usersMs,
      status: integrationStatus(integrationLatencies.usersMs),
    },
  ];

  return {
    updatedAt: new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date()),
    stats,
    growth,
    growthTotalReports,
    growthTotalUsers,
    statusSlices,
    reportTotal,
    activities,
    integrations,
    categoryCount,
  };
}
