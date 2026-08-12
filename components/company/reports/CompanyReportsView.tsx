'use client';

import { CompanyReportsListTab } from '@/components/company/reports/CompanyReportsListTab';
import { CompanyTrackingDetailTab } from '@/components/company/tracking/CompanyTrackingDetailTab';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

/**
 * Company reports:
 * - List uses GET /v1/reports/company-assignments (Closed/Rejected only).
 * - Detail reuses CompanyTrackingDetailTab.
 */
export function CompanyReportsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId')?.trim() || null;

  const [keepListMounted, setKeepListMounted] = useState(() => !reportId);

  const openDetail = useCallback(
    (id: string) => {
      setKeepListMounted(true);
      router.replace(`/company/reports?reportId=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const backToList = useCallback(() => {
    setKeepListMounted(true);
    router.replace('/company/reports', { scroll: false });
  }, [router]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {keepListMounted ? (
        <div
          className={cn(
            'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
            reportId && 'hidden'
          )}
          aria-hidden={Boolean(reportId)}
          {...(reportId ? { inert: true } : {})}
        >
          <CompanyReportsListTab onSelectReport={openDetail} />
        </div>
      ) : null}

      {reportId ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-2 md:px-6">
          <CompanyTrackingDetailTab reportId={reportId} onBack={backToList} />
        </div>
      ) : null}
    </div>
  );
}
