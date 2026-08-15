'use client';

import { OverviewPerformanceBars } from '@/components/admin/overview/OverviewAnalyticsCharts';
import type {
  DeoCompanyPerformanceItem,
  DeoOfficerPerformanceItem,
} from '@/lib/api/services/fetchDeoDashboard';

export function DeoPerformanceTab({
  companyPerformance,
  officerPerformance,
}: {
  companyPerformance: DeoCompanyPerformanceItem[] | undefined;
  officerPerformance: DeoOfficerPerformanceItem[] | undefined;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="min-h-[320px] lg:min-h-[420px]">
        <OverviewPerformanceBars companies={companyPerformance} officers={officerPerformance} />
      </div>
    </div>
  );
}
