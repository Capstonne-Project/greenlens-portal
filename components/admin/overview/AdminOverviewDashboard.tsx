'use client';

import {
  OverviewLifecycleFunnel,
  OverviewPerformanceBars,
  OverviewPollutionAnalytics,
  OverviewQueueAging,
  OverviewReportTrend,
  OverviewResolutionBars,
} from '@/components/admin/overview/OverviewAnalyticsCharts';
import { OverviewAlertsCard } from '@/components/admin/overview/OverviewAlertsCard';
import { AdminOverviewSkeleton } from '@/components/admin/overview/AdminOverviewSkeleton';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import { useAdminOverviewUiStore } from '@/lib/store/adminOverviewUiStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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

export function AdminOverviewDashboard() {
  const dateParams = useAdminOverviewUiStore(s => s.dateParams);
  const [mapExpanded, setMapExpanded] = useState(false);

  const {
    overview,
    alerts,
    companyPerformance,
    geographic,
    officerPerformance,
    pollutionAnalytics,
    reportFunnel,
    reportTrend,
    queueAging,
    resolutionDistribution,
    isPending,
    isError,
    error,
    isAlertsError,
    alertsError,
    refetch,
    refetchAlerts,
  } = useAdminOverview(dateParams);

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

  const mapNode = (
    <AdminDashboardGeographicMap
      geographic={geographic}
      fillHeight
      expanded={mapExpanded}
      onToggleExpand={() => setMapExpanded(prev => !prev)}
    />
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 pb-1">
      {/*
        Mobile: 1 cột · Tablet (md): 2 cột · Desktop (lg): wireframe 12 cột
      */}
      <section className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(150px,1fr)]">
        {/* Column 1 — left stack */}
        <div className="min-h-0 md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-1">
          <OverviewLifecycleFunnel stages={reportFunnel} />
        </div>
        <div className="min-h-0 md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-2">
          <OverviewResolutionBars items={resolutionDistribution} />
        </div>
        <div className="min-h-0 md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-3">
          <OverviewPerformanceBars companies={companyPerformance} officers={officerPerformance} />
        </div>

        {/* Column 2 — trend + alerts */}
        <div className="min-h-0 md:col-span-1 lg:col-span-5 lg:col-start-4 lg:row-start-1">
          <OverviewReportTrend points={reportTrend} />
        </div>
        <div className="min-h-0 md:col-span-1 lg:col-span-5 lg:col-start-4 lg:row-start-2">
          <OverviewPollutionAnalytics items={pollutionAnalytics} />
        </div>
        <div className="min-h-0 md:col-span-2 lg:col-span-5 lg:col-start-4 lg:row-start-3 lg:row-span-1">
          <OverviewAlertsCard
            alerts={alerts}
            isError={isAlertsError}
            error={alertsError instanceof Error ? alertsError : null}
            onRetry={refetchAlerts}
          />
        </div>

        {/* Column 3 — portrait map + queue aging */}
        <article className="flex min-h-[280px] flex-col rounded-card border border-border bg-card p-3 shadow-sm sm:min-h-[320px] md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2 lg:min-h-0">
          <header className="mb-2 shrink-0">
            <h2 className="text-xs font-semibold text-foreground sm:text-sm">Bản đồ Việt Nam</h2>
            <p className="text-[10px] text-muted-foreground">
              Toàn quốc hình chữ S · click tỉnh để focus · phóng to che sidebar
            </p>
          </header>
          <div className="min-h-0 flex-1">{mapExpanded ? null : mapNode}</div>
        </article>
        <div className="min-h-0 md:col-span-1 lg:col-span-4 lg:col-start-9 lg:row-start-3">
          <OverviewQueueAging items={queueAging} />
        </div>
      </section>

      {mapExpanded ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-background p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Bản đồ Việt Nam toàn màn hình"
        >
          <div className="mb-2 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              Bản đồ Việt Nam — toàn màn hình
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Esc hoặc Quay lại để thu nhỏ · click tỉnh để xem ranh giới
            </p>
          </div>
          <div className="min-h-0 flex-1">{mapNode}</div>
        </div>
      ) : null}
    </div>
  );
}
