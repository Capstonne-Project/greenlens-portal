'use client';

import {
  OverviewLifecycleFunnel,
  OverviewPollutionAnalytics,
  OverviewQueueAging,
  OverviewResolutionBars,
} from '@/components/admin/overview/OverviewAnalyticsCharts';
import type {
  DeoPollutionAnalyticsItem,
  DeoQueueAgingItem,
  DeoReportFunnelStage,
  DeoResolutionDistributionItem,
} from '@/lib/api/services/fetchDeoDashboard';

export function DeoReportsTab({
  reportFunnel,
  pollutionAnalytics,
  resolutionDistribution,
  queueAging,
}: {
  reportFunnel: DeoReportFunnelStage[] | undefined;
  pollutionAnalytics: DeoPollutionAnalyticsItem[] | undefined;
  resolutionDistribution: DeoResolutionDistributionItem[] | undefined;
  queueAging: DeoQueueAgingItem[] | undefined;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:auto-rows-[minmax(200px,1fr)] lg:grid-rows-2">
        <OverviewLifecycleFunnel stages={reportFunnel} />
        <OverviewPollutionAnalytics items={pollutionAnalytics} />
        <OverviewResolutionBars items={resolutionDistribution} />
        <OverviewQueueAging items={queueAging} />
      </section>
    </div>
  );
}
