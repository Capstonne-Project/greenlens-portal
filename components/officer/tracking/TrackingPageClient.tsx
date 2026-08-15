'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { officerTrackingDetailHref } from '@/utils/officerNavigation';

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
  const legacyReportId = searchParams.get('reportId')?.trim() || null;

  useEffect(() => {
    if (!legacyReportId) return;
    router.replace(officerTrackingDetailHref(legacyReportId, searchParams.get('from')));
  }, [legacyReportId, router, searchParams]);

  if (legacyReportId) {
    return <TrackingFallback />;
  }

  return <LeoTrackingPageClient onOpenDetail={id => router.push(officerTrackingDetailHref(id))} />;
}
