'use client';

import type { DeoDashboardDateRangeParams } from '@/lib/api/services/fetchDeoDashboard';
import type { DeoReportTrendGroupBy } from '@/lib/api/services/fetchDeoDashboard';
import { create } from 'zustand';

export type DeoOverviewDatePreset = 'all' | '7d' | '30d' | '90d';

export type DeoDashboardTab = 'overview' | 'reports' | 'performance' | 'map';

/** Filter card Tổng quan — query thật GET /report-trend `from`/`to` + Month. */
export type DeoTrendRangePreset = '1m' | '2m' | '3m' | '6m';

export const DEO_DASHBOARD_TABS: { value: DeoDashboardTab; label: string }[] = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'reports', label: 'Báo cáo' },
  { value: 'performance', label: 'Hiệu suất' },
  { value: 'map', label: 'Bản đồ' },
];

export const DEO_OVERVIEW_DATE_PRESETS: { value: DeoOverviewDatePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

export const DEO_TREND_RANGE_PRESETS: { value: DeoTrendRangePreset; label: string }[] = [
  { value: '1m', label: '1 Tháng' },
  { value: '2m', label: '2 Tháng' },
  { value: '3m', label: '3 Tháng' },
  { value: '6m', label: '6 Tháng' },
];

export const DEO_REPORT_TREND_GROUP_BY = [
  { value: 'Day', label: 'Ngày' },
  { value: 'Week', label: 'Tuần' },
  { value: 'Month', label: 'Tháng' },
] as const;

export function buildDeoOverviewDateParams(
  preset: DeoOverviewDatePreset
): DeoDashboardDateRangeParams | undefined {
  if (preset === 'all') return undefined;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfLocalMonth(d: Date): Date {
  return startOfLocalDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function monthsForPreset(preset: DeoTrendRangePreset): number {
  if (preset === '1m') return 1;
  if (preset === '2m') return 2;
  if (preset === '3m') return 3;
  return 6;
}

/**
 * Map filter → `from`/`to` + `groupBy=Month` gửi API /report-trend.
 * N tháng gần nhất (tính cả tháng hiện tại): from = đầu tháng (now − N + 1).
 */
export function buildDeoTrendRange(preset: DeoTrendRangePreset): {
  dateParams: DeoDashboardDateRangeParams;
  groupBy: DeoReportTrendGroupBy;
} {
  const now = new Date();
  const n = monthsForPreset(preset);
  const from = startOfLocalMonth(new Date(now.getFullYear(), now.getMonth() - (n - 1), 1));
  return {
    dateParams: {
      from: from.toISOString(),
      to: endOfLocalDay(now).toISOString(),
    },
    groupBy: 'Month',
  };
}

interface DeoOverviewUiState {
  activeTab: DeoDashboardTab;
  datePreset: DeoOverviewDatePreset;
  dateParams: DeoDashboardDateRangeParams | undefined;
  trendRangePreset: DeoTrendRangePreset;
  /** from/to thật gửi GET /report-trend khi đổi filter. */
  trendDateParams: DeoDashboardDateRangeParams;
  groupBy: DeoReportTrendGroupBy;
  setActiveTab: (tab: DeoDashboardTab) => void;
  setDatePreset: (preset: DeoOverviewDatePreset) => void;
  setTrendRangePreset: (preset: DeoTrendRangePreset) => void;
  setGroupBy: (groupBy: DeoReportTrendGroupBy) => void;
}

const initialTrend = buildDeoTrendRange('6m');

/** UI-only — tab + date + trend range; React Query holds API data. */
export const useDeoOverviewUiStore = create<DeoOverviewUiState>(set => ({
  activeTab: 'overview',
  datePreset: '30d',
  dateParams: buildDeoOverviewDateParams('30d'),
  trendRangePreset: '6m',
  trendDateParams: initialTrend.dateParams,
  groupBy: initialTrend.groupBy,
  setActiveTab: activeTab => set({ activeTab }),
  setDatePreset: datePreset =>
    set({
      datePreset,
      dateParams: buildDeoOverviewDateParams(datePreset),
    }),
  setTrendRangePreset: trendRangePreset => {
    const next = buildDeoTrendRange(trendRangePreset);
    set({
      trendRangePreset,
      trendDateParams: next.dateParams,
      groupBy: next.groupBy,
    });
  },
  setGroupBy: groupBy => set({ groupBy }),
}));
