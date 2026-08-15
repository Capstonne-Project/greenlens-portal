'use client';

import { CompanyActiveAssignmentsPanel } from '@/components/company/overview/CompanyActiveAssignmentsPanel';
import { CompanyDashboardWelcome } from '@/components/company/overview/CompanyDashboardWelcome';
import { CompanyKpiSparkCards } from '@/components/company/overview/CompanyKpiSparkCards';
import {
  CompanyTaskStatusDonut,
  CompanyTaskVolumeBarChart,
  CompanyUpcomingDeadlines,
  CompanyWorkloadTrend,
} from '@/components/company/overview/CompanyAnalyticsCharts';
import { useCompanyDashboardAssignments, useMyCompany } from '@/hooks/useCompany';
import { useCompanyOverviewPage } from '@/hooks/useCompanyOverviewPage';
import { useCompanyOverviewUiStore } from '@/lib/store/companyOverviewUiStore';
import {
  assignmentsToTaskStatusItems,
  assignmentsToUpcomingDeadlines,
  supplementOverviewFromAssignments,
} from '@/utils/companyAssignmentDashboard';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';

const CARD_CLASS =
  'h-full min-h-0 !rounded-md border-0 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]';

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
    isPending: dashPending,
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

  const handleRetryDash = () => {
    refetchDash();
    refetchAssignments();
  };

  if (companyPending && !company) {
    return <CompanyOverviewSkeleton />;
  }

  if (companyError || !company) {
    return (
      <CompanyErrorPanel
        title="Không tải được thông tin công ty"
        message={companyErr instanceof Error ? companyErr.message : 'Vui lòng thử lại sau.'}
        onRetry={() => refetchCompany()}
      />
    );
  }

  const showDashGate = dashPending && !overview;
  const showDashError = dashError && !overview;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-xl bg-[#fbfbfc] p-1.5 sm:p-2">
      <header className="flex shrink-0 flex-col gap-2">
        <CompanyDashboardWelcome company={company} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        {showDashGate ? (
          <CompanyOverviewSkeleton />
        ) : showDashError ? (
          <CompanyErrorPanel
            title="Không tải được bảng điều khiển"
            message={dashErr instanceof Error ? dashErr.message : 'Vui lòng thử lại sau.'}
            onRetry={handleRetryDash}
          />
        ) : mergedOverview ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto lg:overflow-hidden">
            <CompanyKpiSparkCards overview={mergedOverview} trendPoints={workloadTrend} />

            <section className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <div className="min-h-55 lg:col-span-3 lg:min-h-0">
                <CompanyTaskVolumeBarChart overview={mergedOverview} className={CARD_CLASS} />
              </div>
              <div className="min-h-55 lg:col-span-5 lg:min-h-0">
                <CompanyWorkloadTrend points={workloadTrend} className={CARD_CLASS} />
              </div>
              <div className="min-h-55 lg:col-span-4 lg:min-h-0">
                <CompanyTaskStatusDonut items={mergedTaskStatus} className={CARD_CLASS} />
              </div>
              <div className="min-h-0 lg:col-span-8 lg:min-h-0">
                <CompanyActiveAssignmentsPanel
                  items={assignmentItems}
                  totalItems={assignmentTotal}
                  isPending={assignmentsPending}
                  isError={assignmentsError}
                  className={CARD_CLASS}
                />
              </div>
              <div className="min-h-0 lg:col-span-4 lg:min-h-0">
                <CompanyUpcomingDeadlines items={mergedUpcomingDeadlines} className={CARD_CLASS} />
              </div>
            </section>
          </div>
        ) : (
          <CompanyOverviewSkeleton />
        )}
      </div>
    </div>
  );
}

function CompanyErrorPanel({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 space-y-3">
          <p className="font-semibold text-destructive">{title}</p>
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

function CompanyOverviewSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {['a', 'b', 'c', 'd'].map(key => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="h-48 animate-pulse rounded-xl bg-muted lg:col-span-3 lg:h-auto" />
        <div className="h-48 animate-pulse rounded-xl bg-muted lg:col-span-5 lg:h-auto" />
        <div className="h-48 animate-pulse rounded-xl bg-muted lg:col-span-4 lg:h-auto" />
        <div className="h-32 animate-pulse rounded-xl bg-muted lg:col-span-8 lg:h-auto" />
        <div className="h-32 animate-pulse rounded-xl bg-muted lg:col-span-4 lg:h-auto" />
      </div>
    </div>
  );
}
