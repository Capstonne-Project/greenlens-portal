'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeoTrackingReportDetail } from './LeoTrackingReportDetail';
import {
  goBackWithListSoftReload,
  softReloadNotificationDestination,
} from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';
import { cn } from '@/lib/utils';

function TrackingFallback() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <div className="h-7 w-48 rounded bg-slate-200" />
      </div>
      <div className="h-10 w-full max-w-md rounded bg-slate-200" />
      <div className="flex-1 rounded border border-slate-200 bg-white" />
    </div>
  );
}

const LeoTrackingPageClient = dynamic(
  () => import('./LeoTrackingPageClient').then(m => m.LeoTrackingPageClient),
  { ssr: false, loading: TrackingFallback }
);

/** ACL LEO do proxy — không render Access Denied trên client. */
export function TrackingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const detailFromQuery = searchParams.get('reportId')?.trim() || null;
  const activeDetailReportId = detailFromQuery ?? detailReportId;

  const handleBackFromDetail = () => {
    if (detailFromQuery) {
      const from = resolveSafeOfficerFrom(searchParams.get('from'));
      goBackWithListSoftReload({
        router,
        queryClient,
        from,
        fallbackHref: '/officer/tracking',
        method: 'replace',
      });
      return;
    }
    /** Detail mở in-place — soft-reload board rồi ẩn detail. */
    void softReloadNotificationDestination(queryClient, '/officer/tracking');
    setDetailReportId(null);
  };

  /**
   * Giữ LeoTrackingPageClient mounted khi mở detail để filter/search/page
   * không bị reset. Chỉ ẩn UI + `queriesEnabled=false` để không gọi my/reports
   * khi đang xem / reload detail (chỉ progress).
   */
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
          activeDetailReportId && 'hidden'
        )}
        aria-hidden={Boolean(activeDetailReportId)}
        {...(activeDetailReportId ? { inert: true } : {})}
      >
        <LeoTrackingPageClient
          onOpenDetail={setDetailReportId}
          queriesEnabled={!activeDetailReportId}
        />
      </div>

      {activeDetailReportId ? (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <LeoTrackingReportDetail reportId={activeDetailReportId} onBack={handleBackFromDetail} />
        </div>
      ) : null}
    </div>
  );
}
