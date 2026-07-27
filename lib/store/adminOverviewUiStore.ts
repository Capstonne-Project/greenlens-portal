'use client';

import type { AdminDashboardDateRangeParams } from '@/lib/api/services/fetchAdminDashboard';
import { create } from 'zustand';

export type AdminOverviewDatePreset = 'all' | '7d' | '30d' | '90d';

export const ADMIN_OVERVIEW_DATE_PRESETS: { value: AdminOverviewDatePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

export function buildAdminOverviewDateParams(
  preset: AdminOverviewDatePreset
): AdminDashboardDateRangeParams | undefined {
  if (preset === 'all') return undefined;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

interface AdminOverviewUiState {
  datePreset: AdminOverviewDatePreset;
  /** Resolved once per preset change so header + dashboard share the same query keys. */
  dateParams: AdminDashboardDateRangeParams | undefined;
  setDatePreset: (preset: AdminOverviewDatePreset) => void;
}

/** UI-only — date filter for admin overview; React Query holds the API data. */
export const useAdminOverviewUiStore = create<AdminOverviewUiState>(set => ({
  datePreset: '30d',
  dateParams: buildAdminOverviewDateParams('30d'),
  setDatePreset: datePreset =>
    set({
      datePreset,
      dateParams: buildAdminOverviewDateParams(datePreset),
    }),
}));
