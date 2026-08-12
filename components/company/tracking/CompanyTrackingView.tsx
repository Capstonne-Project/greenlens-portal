'use client';

import { CompanyTrackingDetailTab } from '@/components/company/tracking/CompanyTrackingDetailTab';
import { CompanyTrackingListTab } from '@/components/company/tracking/CompanyTrackingListTab';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

/**
 * List ↔ detail via `?reportId=`.
 *
 * Performance:
 * - Hard reload / deep-link với `reportId` → chỉ mount detail (không gọi list API).
 * - Đi từ list → detail trong session → giữ list mounted (hidden) để giữ filter/page.
 * - Back từ deep-link detail → mount list lần đầu.
 */
export function CompanyTrackingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId')?.trim() || null;

  const [keepListMounted, setKeepListMounted] = useState(() => !reportId);

  const openDetail = useCallback(
    (id: string) => {
      setKeepListMounted(true);
      router.replace(`/company/tracking?reportId=${encodeURIComponent(id)}`, { scroll: false });
    },
    [router]
  );

  const backToList = useCallback(() => {
    setKeepListMounted(true);
    router.replace('/company/tracking', { scroll: false });
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
          <CompanyTrackingListTab onSelectReport={openDetail} />
        </div>
      ) : null}

      {reportId ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <CompanyTrackingDetailTab reportId={reportId} onBack={backToList} />
        </div>
      ) : null}
    </div>
  );
}
