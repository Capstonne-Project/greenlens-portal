'use client';

import { CompanyActiveAssignmentsPanel } from '@/components/company/overview/CompanyActiveAssignmentsPanel';
import {
  CompanyTaskStatusDonut,
  CompanyTaskVolumeBarChart,
  CompanyUpcomingDeadlines,
  CompanyWorkloadTrend,
} from '@/components/company/overview/CompanyAnalyticsCharts';
import { formatUpdatedAt } from '@/components/admin/overview/adminDashboardFormat';
import { useCompanyDashboardAssignments, useMyCompany } from '@/hooks/useCompany';
import { useCompanyOverviewPage } from '@/hooks/useCompanyOverviewPage';
import { useCompanyOverviewUiStore } from '@/lib/store/companyOverviewUiStore';
import {
  assignmentsToTaskStatusItems,
  assignmentsToUpcomingDeadlines,
  supplementOverviewFromAssignments,
} from '@/utils/companyAssignmentDashboard';
import { CompanyKpiCollapsibleSection } from '@/components/company/overview/CompanyKpiCollapsibleSection';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

function pickWithFallback<T>(primary: T[] | undefined, fallback: T[]): T[] {
  if (primary && primary.length > 0) return primary;
  return fallback;
}

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
    taskStatus,
    workloadTrend,
    upcomingDeadlines,
    updatedAtMs,
    isPending: dashPending,
    isFetching,
    isError: dashError,
    error: dashErr,
    refetch: refetchDash,
  } = useCompanyOverviewPage(dateParams);

  const {
    data: assignmentsData,
    isPending: assignmentsPending,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useCompanyDashboardAssignments();

  const assignmentItems = useMemo(() => assignmentsData?.items ?? [], [assignmentsData?.items]);
  const assignmentTotal = assignmentsData?.pagination.totalItems ?? assignmentItems.length;

  const mergedOverview = useMemo(
    () =>
      overview
        ? supplementOverviewFromAssignments(overview, assignmentItems, assignmentTotal)
        : undefined,
    [overview, assignmentItems, assignmentTotal]
  );

  const mergedTaskStatus = useMemo(
    () => pickWithFallback(taskStatus, assignmentsToTaskStatusItems(assignmentItems)),
    [taskStatus, assignmentItems]
  );

  const mergedUpcomingDeadlines = useMemo(
    () => pickWithFallback(upcomingDeadlines, assignmentsToUpcomingDeadlines(assignmentItems)),
    [upcomingDeadlines, assignmentItems]
  );

  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;

  const handleRefreshAll = () => {
    refetchDash();
    refetchAssignments();
  };

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
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-4">
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
            onClick={handleRefreshAll}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Thử lại
          </button>
        </div>
      ) : mergedOverview ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}
              {isFetching || assignmentsPending ? ' · làm mới' : ''}
            </p>
          </div>

          <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <CompanyTaskVolumeBarChart overview={mergedOverview} />
            <CompanyWorkloadTrend points={workloadTrend} />
            <CompanyTaskStatusDonut items={mergedTaskStatus} />
          </section>

          <CompanyKpiCollapsibleSection />

          <CompanyActiveAssignmentsPanel
            items={assignmentItems}
            totalItems={assignmentTotal}
            isPending={assignmentsPending}
            isError={assignmentsError}
          />

          <CompanyUpcomingDeadlines items={mergedUpcomingDeadlines} />
        </>
      ) : null}
    </div>
  );
}

function CompanyOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải tổng quan">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[220px] animate-pulse rounded-card bg-muted" />
        ))}
      </div>
      <div className="h-[220px] animate-pulse rounded-card bg-muted" />
      <div className="h-24 animate-pulse rounded-card bg-muted" />
      <div className="h-32 animate-pulse rounded-card bg-muted" />
    </div>
  );
}
