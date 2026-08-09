'use client';

import type { CompanyDashboardDateRangeParams } from '@/lib/api/services/fetchCompanyDashboard';
import type { MyCompanyKpiParams } from '@/lib/api/models/company';
import { create } from 'zustand';

export type CompanyOverviewDatePreset = 'all' | '7d' | '30d' | '90d';

export const COMPANY_OVERVIEW_DATE_PRESETS: {
  value: CompanyOverviewDatePreset;
  label: string;
}[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

export function buildCompanyOverviewDateParams(
  preset: CompanyOverviewDatePreset
): CompanyDashboardDateRangeParams | undefined {
  if (preset === 'all') return undefined;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Nhãn preset — dùng chung header + KPI. */
export function getCompanyOverviewDatePresetLabel(preset: CompanyOverviewDatePreset): string {
  return COMPANY_OVERVIEW_DATE_PRESETS.find(p => p.value === preset)?.label ?? preset;
}

/** Map bộ lọc header → query GET /v1/companies/my/kpi. */
export function companyOverviewDateParamsToKpiParams(
  preset: CompanyOverviewDatePreset,
  dateParams: CompanyDashboardDateRangeParams | undefined
): MyCompanyKpiParams {
  if (preset === 'all' || !dateParams?.from || !dateParams?.to) return {};
  return { from: dateParams.from, to: dateParams.to };
}

interface CompanyOverviewUiState {
  datePreset: CompanyOverviewDatePreset;
  /** Resolved once per preset change so header + dashboard share the same query keys. */
  dateParams: CompanyDashboardDateRangeParams | undefined;
  setDatePreset: (preset: CompanyOverviewDatePreset) => void;
}

/** UI-only — date filter for company overview; React Query holds the API data. */
export const useCompanyOverviewUiStore = create<CompanyOverviewUiState>(set => ({
  datePreset: '30d',
  dateParams: buildCompanyOverviewDateParams('30d'),
  setDatePreset: datePreset =>
    set({
      datePreset,
      dateParams: buildCompanyOverviewDateParams(datePreset),
    }),
}));
