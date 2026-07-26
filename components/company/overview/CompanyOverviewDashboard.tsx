'use client';

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
import { useMyCompany } from '@/hooks/useCompany';
import { useCompanyOverviewUiStore } from '@/lib/store/companyOverviewUiStore';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function CompanyOverviewDashboard() {
  const dateParams = useCompanyOverviewUiStore(s => s.dateParams);

  const {
    data: company,
    isPending: companyPending,
    isError: companyError,
    error: companyErr,
    refetch: refetchCompany,
  } = useMyCompany();

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

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-2 overflow-hidden">
      {dashPending && !overview ? (
        <CompanyOverviewSkeleton />
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
          <p className="shrink-0 text-[10px] text-muted-foreground">
            {updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}
            {isFetching ? ' · làm mới' : ''}
          </p>

          {/*
            One-page grid (lg): 3 equal rows fill remaining viewport.
            Long lists scroll inside each card — no page scrollbar.
          */}
          <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-12 lg:grid-rows-3">
            <div className="min-h-0 lg:col-span-12 lg:row-start-1">
              <CompanyOverviewSummaryCharts overview={overview} />
            </div>

            <div className="min-h-0 lg:col-span-4 lg:row-start-2">
              <CompanyWorkloadTrend points={workloadTrend} />
            </div>
            <div className="min-h-0 lg:col-span-4 lg:row-start-2">
              <CompanyTaskStatusDonut items={taskStatus} />
            </div>
            <div className="min-h-0 lg:col-span-4 lg:row-start-2">
              <CompanyQueueAgingDonut items={queueAging} />
            </div>

            <div className="min-h-0 lg:col-span-3 lg:row-start-3">
              <CompanyUpcomingDeadlines items={upcomingDeadlines} />
            </div>
            <div className="min-h-0 lg:col-span-3 lg:row-start-3">
              <CompanyRecentActivities items={recentActivities} />
            </div>
            <div className="min-h-0 lg:col-span-3 lg:row-start-3">
              <CompanyTeamPerformanceTable items={teamPerformance} />
            </div>
            <div className="min-h-0 lg:col-span-3 lg:row-start-3">
              <CompanyStaffPerformanceTable items={staffPerformance} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CompanyOverviewSkeleton() {
  return (
    <div
      className="grid h-full min-h-0 gap-2 lg:grid-cols-12 lg:grid-rows-3"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="animate-pulse rounded-card bg-muted lg:col-span-12" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-4" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-4" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-4" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-3" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-3" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-3" />
      <div className="animate-pulse rounded-card bg-muted lg:col-span-3" />
    </div>
  );
}
