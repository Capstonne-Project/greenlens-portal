'use client';

import { DeoDashboardTabs } from '@/components/officer/overview/DeoDashboardTabs';
import { DeoMapTab } from '@/components/officer/overview/DeoMapTab';
import { DeoOverviewTab } from '@/components/officer/overview/DeoOverviewTab';
import { DeoPerformanceTab } from '@/components/officer/overview/DeoPerformanceTab';
import { DeoReportsTab } from '@/components/officer/overview/DeoReportsTab';
import { OfficerDashboardWelcome } from '@/components/officer/overview/OfficerDashboardWelcome';
import { useLeoOverview } from '@/hooks/useLeoOverview';
import { useDeoOverviewUiStore } from '@/lib/store/deoOverviewUiStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function LeoOverviewDashboard() {
  const activeTab = useDeoOverviewUiStore(s => s.activeTab);
  const dateParams = useDeoOverviewUiStore(s => s.dateParams);
  const trendRangePreset = useDeoOverviewUiStore(s => s.trendRangePreset);
  const trendDateParams = useDeoOverviewUiStore(s => s.trendDateParams);
  const setActiveTab = useDeoOverviewUiStore(s => s.setActiveTab);
  const setTrendRangePreset = useDeoOverviewUiStore(s => s.setTrendRangePreset);

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
    isPending,
    isError,
    error,
    isAlertsError,
    alertsError,
    refetch,
    refetchAlerts,
  } = useLeoOverview(dateParams, {
    activeTab,
    trendDateParams,
  });

  const showOverviewGate = activeTab === 'overview' && isPending && !overview;
  const showOverviewError = activeTab === 'overview' && isError && !overview;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-xl bg-[#fbfbfc] p-1.5 sm:p-2">
      <header className="flex shrink-0 flex-col gap-2">
        <OfficerDashboardWelcome description="Theo dõi báo cáo, xác minh, phân công và bản đồ trên địa bàn phường/xã phụ trách." />
        <DeoDashboardTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Mục tổng quan phường"
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === 'overview' ? (
          showOverviewGate ? (
            <LeoOverviewSkeleton />
          ) : showOverviewError ? (
            <LeoErrorPanel
              message={error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
              onRetry={refetch}
            />
          ) : overview ? (
            <DeoOverviewTab
              overview={overview}
              reportTrend={reportTrend}
              reportStatus={reportStatus}
              alerts={alerts}
              recentActivities={recentActivities}
              groupBy="Month"
              trendRangePreset={trendRangePreset}
              trendDateParams={trendDateParams}
              onTrendRangeChange={setTrendRangePreset}
              isAlertsError={isAlertsError}
              alertsError={alertsError instanceof Error ? alertsError : null}
              onRetryAlerts={refetchAlerts}
            />
          ) : (
            <LeoOverviewSkeleton />
          )
        ) : null}

        {activeTab === 'reports' ? (
          isPending && !reportFunnel ? (
            <LeoTabSkeleton />
          ) : isError && !reportFunnel ? (
            <LeoErrorPanel
              message={error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
              onRetry={refetch}
            />
          ) : (
            <DeoReportsTab
              reportFunnel={reportFunnel}
              pollutionAnalytics={pollutionAnalytics}
              resolutionDistribution={resolutionDistribution}
              queueAging={queueAging}
            />
          )
        ) : null}

        {activeTab === 'performance' ? (
          isPending && !companyPerformance ? (
            <LeoTabSkeleton />
          ) : isError && !companyPerformance ? (
            <LeoErrorPanel
              message={error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
              onRetry={refetch}
            />
          ) : (
            <DeoPerformanceTab
              companyPerformance={companyPerformance}
              officerPerformance={officerPerformance}
            />
          )
        ) : null}

        {activeTab === 'map' ? (
          isPending && !geographic ? (
            <LeoTabSkeleton />
          ) : isError && !geographic ? (
            <LeoErrorPanel
              message={error instanceof Error ? error.message : 'Vui lòng thử lại sau.'}
              onRetry={refetch}
            />
          ) : (
            <DeoMapTab
              geographic={geographic}
              title="Bản đồ phường"
              subtitle="Bản đồ nhiệt và điểm báo cáo trong địa bàn phụ trách"
            />
          )
        ) : null}
      </div>
    </div>
  );
}

function LeoErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 space-y-3">
          <p className="font-semibold text-destructive">Không tải được bảng điều khiển phường</p>
          <p className="text-muted-foreground">{message}</p>
          <button
            type="button"
            onClick={onRetry}
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

function LeoOverviewSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      aria-busy="true"
      aria-label="Đang tải tổng quan phường"
    >
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {['a', 'b', 'c', 'd'].map(key => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="animate-pulse rounded-card bg-muted lg:col-span-8" />
        <div className="animate-pulse rounded-card bg-muted lg:col-span-4" />
        <div className="animate-pulse rounded-card bg-muted lg:col-span-6" />
        <div className="animate-pulse rounded-card bg-muted lg:col-span-6" />
      </div>
    </div>
  );
}

function LeoTabSkeleton() {
  return (
    <div
      className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2"
      aria-busy="true"
      aria-label="Đang tải"
    >
      {['a', 'b', 'c', 'd'].map(key => (
        <div key={key} className="min-h-48 animate-pulse rounded-card bg-muted" />
      ))}
    </div>
  );
}
