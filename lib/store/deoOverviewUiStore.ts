'use client';

import type { DeoDashboardDateRangeParams } from '@/lib/api/services/fetchDeoDashboard';
import { create } from 'zustand';

export type DeoOverviewDatePreset = 'all' | '7d' | '30d' | '90d';

export const DEO_OVERVIEW_DATE_PRESETS: { value: DeoOverviewDatePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
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

interface DeoOverviewUiState {
  datePreset: DeoOverviewDatePreset;
  dateParams: DeoDashboardDateRangeParams | undefined;
  groupBy: 'Day' | 'Week' | 'Month';
  setDatePreset: (preset: DeoOverviewDatePreset) => void;
  setGroupBy: (groupBy: 'Day' | 'Week' | 'Month') => void;
}

/** UI-only — date + trend grouping for DEO overview; React Query holds API data. */
export const useDeoOverviewUiStore = create<DeoOverviewUiState>(set => ({
  datePreset: '30d',
  dateParams: buildDeoOverviewDateParams('30d'),
  groupBy: 'Day',
  setDatePreset: datePreset =>
    set({
      datePreset,
      dateParams: buildDeoOverviewDateParams(datePreset),
    }),
  setGroupBy: groupBy => set({ groupBy }),
}));
