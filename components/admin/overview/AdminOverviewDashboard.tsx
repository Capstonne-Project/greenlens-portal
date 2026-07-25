'use client';

import {
  OverviewLifecycleFunnel,
  OverviewPerformanceBars,
  OverviewQueueAging,
  OverviewRecentActivities,
  OverviewReportTrend,
  OverviewResolutionBars,
  OverviewStatusDonut,
} from '@/components/admin/overview/OverviewAnalyticsCharts';
import { OverviewAlertsCard } from '@/components/admin/overview/OverviewAlertsCard';
import { AdminOverviewSkeleton } from '@/components/admin/overview/AdminOverviewSkeleton';
import {
  formatOverviewNumber,
  formatRatePercent,
  formatHours,
  formatUpdatedAt,
} from '@/components/admin/overview/adminDashboardFormat';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import type { AdminDashboardDateRangeParams } from '@/lib/api/services/fetchAdminDashboard';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';

const AdminDashboardGeographicMap = dynamic(
  () =>
    import('@/components/admin/overview/AdminDashboardGeographicMap').then(
      mod => mod.AdminDashboardGeographicMap
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[240px] animate-pulse rounded-lg border border-border bg-muted"
        aria-hidden
      />
    ),
  }
);

type DatePreset = 'all' | '7d' | '30d' | '90d';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
];

function buildDateRangeParams(preset: DatePreset): AdminDashboardDateRangeParams | undefined {
  if (preset === 'all') return undefined;
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function AdminOverviewDashboard() {
  const [preset, setPreset] = useState<DatePreset>('30d');
  const dateParams = useMemo(() => buildDateRangeParams(preset), [preset]);

  const {
    overview,
    alerts,
    companyPerformance,
    geographic,
    officerPerformance,
    reportFunnel,
    reportTrend,
    reportStatus,
    queueAging,
    resolutionDistribution,
    recentActivities,
    updatedAtMs,
    isPending,
    isFetching,
    isError,
    error,
    isAlertsError,
    alertsError,
    refetch,
    refetchAlerts,
  } = useAdminOverview(dateParams);

  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;

  if (isPending && !overview) {
    return <AdminOverviewSkeleton />;
  }

  if (isError && !overview) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-3">
            <p className="font-semibold text-destructive">Không tải được bảng điều khiển</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
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

  if (!overview) {
    return <AdminOverviewSkeleton />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
            Tổng quan hệ thống
          </h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}
            {isFetching ? ' · làm mới' : ''}
            {' · '}
            {formatOverviewNumber(overview.totalUsers)} người dùng
            {' · '}
            {formatOverviewNumber(overview.totalReports)} báo cáo
            {' · '}
            SLA {formatRatePercent(overview.slaComplianceRate, 0)}
            {' · '}
            TB {formatHours(overview.averageResolutionHours, 1)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap rounded-lg border border-border bg-muted/30 p-0.5"
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
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold transition hover:bg-muted disabled:opacity-60"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
            Làm mới
          </button>
        </div>
      </header>

      {/* Row 1: funnel · trend · status — equal thirds */}
      <section className="grid min-h-0 gap-3 lg:grid-cols-3">
        <OverviewLifecycleFunnel stages={reportFunnel} />
        <OverviewReportTrend points={reportTrend} />
        <OverviewStatusDonut items={reportStatus} />
      </section>

      {/* Row 2: map · queue · activities */}
      <section className="grid min-h-0 gap-3 lg:grid-cols-12">
        <article className="rounded-card border border-border bg-card p-3 shadow-sm lg:col-span-5">
          <header className="mb-2">
            <h2 className="text-xs font-semibold text-foreground sm:text-sm">Bản đồ Việt Nam</h2>
            <p className="text-[10px] text-muted-foreground">Tô màu theo tỉnh · click để focus</p>
          </header>
          <AdminDashboardGeographicMap geographic={geographic} />
        </article>
        <div className="lg:col-span-3">
          <OverviewQueueAging items={queueAging} />
        </div>
        <div className="lg:col-span-4">
          <OverviewRecentActivities items={recentActivities} />
        </div>
      </section>

      {/* Row 3: resolution · performance · alerts */}
      <section className="grid min-h-0 gap-3 lg:grid-cols-3">
        <OverviewResolutionBars items={resolutionDistribution} />
        <OverviewPerformanceBars companies={companyPerformance} officers={officerPerformance} />
        <OverviewAlertsCard
          alerts={alerts}
          isError={isAlertsError}
          error={alertsError instanceof Error ? alertsError : null}
          onRetry={refetchAlerts}
        />
      </section>
    </div>
  );
}
