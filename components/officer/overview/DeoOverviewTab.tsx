'use client';

import { OverviewAlertsCard } from '@/components/admin/overview/OverviewAlertsCard';
import {
  OverviewRecentActivities,
  OverviewStatusDonut,
} from '@/components/admin/overview/OverviewAnalyticsCharts';
import { DeoKpiSparkCards } from '@/components/officer/overview/DeoKpiSparkCards';
import { DeoReportTrendChart } from '@/components/officer/overview/DeoReportTrendChart';
import type {
  DeoDashboardAlert,
  DeoDashboardDateRangeParams,
  DeoDashboardOverview,
  DeoRecentActivityItem,
  DeoReportStatusItem,
  DeoReportTrendGroupBy,
  DeoReportTrendPoint,
} from '@/lib/api/services/fetchDeoDashboard';
import type { DeoTrendRangePreset } from '@/lib/store/deoOverviewUiStore';

export function DeoOverviewTab({
  overview,
  reportTrend,
  reportStatus,
  alerts,
  recentActivities,
  groupBy,
  trendRangePreset,
  trendDateParams,
  onTrendRangeChange,
  isAlertsError,
  alertsError,
  onRetryAlerts,
}: {
  overview: DeoDashboardOverview;
  reportTrend: DeoReportTrendPoint[] | undefined;
  reportStatus: DeoReportStatusItem[] | undefined;
  alerts: DeoDashboardAlert[] | undefined;
  recentActivities: DeoRecentActivityItem[] | undefined;
  groupBy: DeoReportTrendGroupBy;
  trendRangePreset: DeoTrendRangePreset;
  trendDateParams?: DeoDashboardDateRangeParams;
  onTrendRangeChange: (preset: DeoTrendRangePreset) => void;
  isAlertsError?: boolean;
  alertsError?: Error | null;
  onRetryAlerts?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto lg:overflow-hidden">
      <DeoKpiSparkCards overview={overview} trendPoints={reportTrend} />

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="min-h-0 lg:col-span-8 lg:min-h-0">
          <DeoReportTrendChart
            points={reportTrend}
            groupBy={groupBy}
            trendRangePreset={trendRangePreset}
            trendDateParams={trendDateParams}
            onTrendRangeChange={onTrendRangeChange}
            fillHeight
          />
        </div>
        <div className="min-h-0 lg:col-span-4 lg:min-h-0">
          <OverviewStatusDonut
            items={reportStatus}
            className="h-full min-h-0 !rounded-md border-0 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          />
        </div>
        <div className="min-h-0 lg:col-span-8 lg:min-h-0">
          <OverviewAlertsCard
            alerts={alerts}
            isError={isAlertsError}
            error={alertsError}
            onRetry={onRetryAlerts}
            className="h-full min-h-0 !rounded-md border-0 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          />
        </div>
        <div className="min-h-0 lg:col-span-4 lg:min-h-0">
          <OverviewRecentActivities
            items={recentActivities}
            className="h-full min-h-0 !rounded-md border-0 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          />
        </div>
      </section>
    </div>
  );
}
