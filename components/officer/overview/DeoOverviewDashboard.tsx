'use client';

import {
  formatHours,
  formatOverviewNumber,
  formatRatePercent,
  formatUpdatedAt,
} from '@/components/admin/overview/adminDashboardFormat';
import { OverviewAlertsCard } from '@/components/admin/overview/OverviewAlertsCard';
import {
  OverviewLifecycleFunnel,
  OverviewPerformanceBars,
  OverviewPollutionAnalytics,
  OverviewQueueAging,
  OverviewRecentActivities,
  OverviewResolutionBars,
  OverviewStatusDonut,
} from '@/components/admin/overview/OverviewAnalyticsCharts';
import { DeoReportTrendChart } from '@/components/officer/overview/DeoReportTrendChart';
import { useDeoOverview } from '@/hooks/useDeoOverview';
import type { DeoDashboardOverview } from '@/lib/api/services/fetchDeoDashboard';
import {
  DEO_OVERVIEW_DATE_PRESETS,
  DEO_REPORT_TREND_GROUP_BY,
  useDeoOverviewUiStore,
} from '@/lib/store/deoOverviewUiStore';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Building2,
  Clock,
  FileText,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const AdminDashboardGeographicMap = dynamic(
  () =>
    import('@/components/admin/overview/AdminDashboardGeographicMap').then(
      mod => mod.AdminDashboardGeographicMap
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-[240px] animate-pulse rounded-lg border border-border bg-muted"
        aria-hidden
      />
    ),
  }
);

export function DeoOverviewDashboard() {
  const datePreset = useDeoOverviewUiStore(s => s.datePreset);
  const dateParams = useDeoOverviewUiStore(s => s.dateParams);
  const groupBy = useDeoOverviewUiStore(s => s.groupBy);
  const setDatePreset = useDeoOverviewUiStore(s => s.setDatePreset);
  const setGroupBy = useDeoOverviewUiStore(s => s.setGroupBy);
  const [mapExpanded, setMapExpanded] = useState(false);

  const {
    overview,
    alerts,
    reportStatus,
    reportTrend,
    pollutionAnalytics,
    reportFunnel,
    geographic,
    queueAging,
    resolutionDistribution,
    companyPerformance,
    officerPerformance,
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
  } = useDeoOverview(dateParams, groupBy);

  if (isPending && !overview) {
    return <DeoOverviewSkeleton />;
  }

  if (isError && !overview) {
    return (
      <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
          <div className="min-w-0 space-y-3">
            <p className="font-semibold text-destructive">Không tải được bảng điều khiển Sở</p>
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
    return <DeoOverviewSkeleton />;
  }

  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;

  const mapNode = (
    <AdminDashboardGeographicMap
      geographic={geographic}
      fillHeight
      expanded={mapExpanded}
      onToggleExpand={() => setMapExpanded(prev => !prev)}
    />
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground">Tổng quan Sở</h1>
          <p className="text-xs text-muted-foreground">
            {updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}
            {isFetching ? ' · làm mới' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap rounded-lg border border-border bg-muted/30 p-0.5"
            role="radiogroup"
            aria-label="Khoảng thời gian"
          >
            {DEO_OVERVIEW_DATE_PRESETS.map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={datePreset === option.value}
                onClick={() => setDatePreset(option.value)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-semibold transition',
                  datePreset === option.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div
            className="flex rounded-lg border border-border bg-muted/30 p-0.5"
            role="radiogroup"
            aria-label="Nhóm xu hướng"
          >
            {DEO_REPORT_TREND_GROUP_BY.map(option => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={groupBy === option.value}
                onClick={() => setGroupBy(option.value)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-semibold transition',
                  groupBy === option.value
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

      <DeoKpiHero overview={overview} />

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <OverviewLifecycleFunnel stages={reportFunnel} />
        <OverviewStatusDonut items={reportStatus} />
        <DeoReportTrendChart points={reportTrend} groupBy={groupBy} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <OverviewPollutionAnalytics items={pollutionAnalytics} />
        <OverviewResolutionBars items={resolutionDistribution} />
        <OverviewQueueAging items={queueAging} />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <OverviewPerformanceBars companies={companyPerformance} officers={officerPerformance} />
        <OverviewAlertsCard
          alerts={alerts}
          isError={isAlertsError}
          error={alertsError instanceof Error ? alertsError : null}
          onRetry={refetchAlerts}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
        <article className="flex min-h-[280px] flex-col rounded-card border border-border bg-card p-3 shadow-sm">
          <header className="mb-1.5 shrink-0">
            <h2 className="text-xs font-semibold text-foreground sm:text-sm">Bản đồ Sở</h2>
            <p className="text-[10px] text-muted-foreground">
              Heatmap và marker báo cáo trong địa bàn
            </p>
          </header>
          <div className="min-h-[240px] flex-1">{mapExpanded ? null : mapNode}</div>
        </article>
        <OverviewRecentActivities items={recentActivities} />
      </section>

      {mapExpanded ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-background p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Bản đồ Sở toàn màn hình"
        >
          <div className="mb-2 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">Bản đồ Sở — toàn màn hình</h2>
          </div>
          <div className="min-h-0 flex-1">{mapNode}</div>
        </div>
      ) : null}
    </div>
  );
}

function DeoKpiHero({ overview }: { overview: DeoDashboardOverview }) {
  const cards = [
    {
      label: 'Tổng báo cáo',
      value: formatOverviewNumber(overview.totalReports),
      tag: 'Sở',
      icon: FileText,
    },
    {
      label: 'Chờ xử lý',
      value: formatOverviewNumber(overview.pendingReports),
      tag: 'Hàng đợi',
      icon: Clock,
    },
    {
      label: 'Đã giải quyết',
      value: formatOverviewNumber(overview.resolvedReports),
      tag: 'Closed/Resolved',
      icon: ShieldCheck,
    },
    {
      label: 'SLA',
      value: formatRatePercent(overview.slaComplianceRate, 0),
      tag: `TB ${formatHours(overview.averageResolutionHours, 1)}`,
      icon: AlertTriangle,
    },
    {
      label: 'Văn phòng',
      value: formatOverviewNumber(overview.officeCount),
      tag: 'Org',
      icon: Landmark,
    },
    {
      label: 'Doanh nghiệp',
      value: formatOverviewNumber(overview.companyCount),
      tag: 'DVMT',
      icon: Building2,
    },
    {
      label: 'Đội',
      value: formatOverviewNumber(overview.teamCount),
      tag: 'Org',
      icon: Users,
    },
    {
      label: 'Cán bộ LEO',
      value: formatOverviewNumber(overview.officerCount),
      tag: 'Org',
      icon: Users,
    },
  ] as const;

  return (
    <div className="rounded-2xl bg-[#0f1117] px-5 py-5">
      <p className="mb-4 text-xs text-slate-400">KPI báo cáo và cơ cấu tổ chức Sở</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(card => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">{card.label}</span>
              <card.icon className="size-4 text-teal-400" aria-hidden />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{card.value}</span>
              <span className="mb-0.5 truncate text-[10px] font-semibold text-teal-400">
                {card.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeoOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải tổng quan Sở">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {['a', 'b', 'c'].map(key => (
          <div key={key} className="h-52 animate-pulse rounded-card bg-muted" />
        ))}
      </div>
    </div>
  );
}
