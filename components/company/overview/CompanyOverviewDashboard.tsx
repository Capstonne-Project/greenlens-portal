'use client';

import { CompanyStatusBadge } from '@/components/company/CompanyStatusBadge';
import {
  CompanyOverviewSummaryCharts,
  CompanyQueueAgingDonut,
  CompanyRecentActivities,
  CompanyStaffPerformanceTable,
  CompanyTaskStatusDonut,
  CompanyTeamPerformanceTable,
  CompanyUpcomingDeadlines,
  CompanyWorkloadTrend,
} from '@/components/company/overview/CompanyAnalyticsCharts';
import { formatUpdatedAt } from '@/components/admin/overview/adminDashboardFormat';
import { useCompanyOverview } from '@/hooks/useCompanyOverview';
import { useCompanyQueueCount, useMyCompany } from '@/hooks/useCompany';
import type { CompanyDashboardDateRangeParams } from '@/lib/api/services/fetchCompanyDashboard';
import { cn } from '@/lib/utils';
import { formatCompanyDate } from '@/utils/companyUi';
import { AlertTriangle, Building2, ClipboardList, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type DatePreset = 'all' | '7d' | '30d' | '90d';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

function buildDateRangeParams(preset: DatePreset): CompanyDashboardDateRangeParams | undefined {
  if (preset === 'all') return undefined;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'CM';
}

export function CompanyOverviewDashboard() {
  const [preset, setPreset] = useState<DatePreset>('30d');
  const dateParams = useMemo(() => buildDateRangeParams(preset), [preset]);

  const {
    data: company,
    isPending: companyPending,
    isError: companyError,
    error: companyErr,
    refetch: refetchCompany,
  } = useMyCompany();
  const { data: queueCount } = useCompanyQueueCount();

  const {
    overview,
    queueAging,
    recentActivities,
    staffPerformance,
    taskStatus,
    teamPerformance,
    upcomingDeadlines,
    workloadTrend,
    updatedAtMs,
    isPending: dashPending,
    isFetching,
    isError: dashError,
    error: dashErr,
    refetch: refetchDash,
  } = useCompanyOverview(dateParams);

  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;

  if (companyPending && !company) {
    return <CompanyOverviewSkeleton />;
  }

  if (companyError || !company) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-2">
            <p className="font-semibold text-destructive">Không tải được thông tin công ty</p>
            <p className="text-muted-foreground">
              {companyErr instanceof Error ? companyErr.message : 'Vui lòng thử lại sau.'}
            </p>
            <button
              type="button"
              onClick={() => refetchCompany()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasQueue = typeof queueCount === 'number' && queueCount > 0;
  const initials = companyInitials(company.name);

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-3">
      {/* Compact company header */}
      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white dark:border-border dark:bg-card">
        <div className="flex flex-col gap-3 bg-emerald-600 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-xs font-bold tracking-wide text-white"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                <Building2 className="size-3 shrink-0" aria-hidden />
                Tổng quan công ty
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold tracking-tight text-white">
                  {company.name}
                </h1>
                <CompanyStatusBadge
                  status={company.status}
                  className="bg-white text-emerald-900 ring-0"
                />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-emerald-50">
                {company.departmentName} · MST {company.taxCode} · Thành lập{' '}
                {formatCompanyDate(company.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-lg border border-white/30 bg-emerald-700/50 p-0.5"
              role="radiogroup"
              aria-label="Khoảng thời gian"
            >
              {DATE_PRESETS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={preset === option.value}
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-semibold transition',
                    preset === option.value
                      ? 'bg-white text-emerald-900'
                      : 'text-emerald-50 hover:bg-emerald-700'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                refetchCompany();
                refetchDash();
              }}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              aria-label="Làm mới"
            >
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
              Làm mới
            </button>
            <Link
              href="/company/queue"
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition',
                hasQueue
                  ? 'bg-white text-emerald-900 hover:bg-emerald-50'
                  : 'border border-white/40 bg-emerald-700 text-white hover:bg-emerald-800'
              )}
            >
              <ClipboardList className="size-3.5" aria-hidden />
              {hasQueue ? `${queueCount} chờ` : 'Hàng đợi'}
            </Link>
          </div>
        </div>
      </section>

      {dashPending && !overview ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-muted" />
          ))}
        </div>
      ) : dashError && !overview ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Không tải được bảng điều khiển</p>
          <p className="mt-1 text-muted-foreground">
            {dashErr instanceof Error ? dashErr.message : 'Vui lòng thử lại sau.'}
          </p>
          <button
            type="button"
            onClick={() => refetchDash()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Thử lại analytics
          </button>
        </div>
      ) : overview ? (
        <>
          <p className="text-[11px] text-muted-foreground">
            {updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}
            {isFetching ? ' · làm mới' : ''}
          </p>

          <CompanyOverviewSummaryCharts overview={overview} />

          {/* Row 1: trend · status · queue */}
          <section className="grid min-h-0 gap-3 lg:grid-cols-3">
            <CompanyWorkloadTrend points={workloadTrend} />
            <CompanyTaskStatusDonut items={taskStatus} />
            <CompanyQueueAgingDonut items={queueAging} />
          </section>

          {/* Row 2: deadlines · activities */}
          <section className="grid min-h-0 gap-3 lg:grid-cols-2">
            <CompanyUpcomingDeadlines items={upcomingDeadlines} />
            <CompanyRecentActivities items={recentActivities} />
          </section>

          {/* Row 3: team · staff */}
          <section className="grid min-h-0 gap-3 lg:grid-cols-2">
            <CompanyTeamPerformanceTable items={teamPerformance} />
            <CompanyStaffPerformanceTable items={staffPerformance} />
          </section>
        </>
      ) : null}
    </div>
  );
}

function CompanyOverviewSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3" aria-busy="true" aria-label="Đang tải tổng quan">
      <div className="h-20 animate-pulse rounded-2xl bg-emerald-100" />
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-card bg-muted" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-card bg-muted" />
        ))}
      </div>
    </div>
  );
}
