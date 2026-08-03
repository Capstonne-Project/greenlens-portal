'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeoTrackingReportDetail } from './LeoTrackingReportDetail';

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

/**
 * Chỉ cho phép back về route nội bộ officer — chống open-redirect.
 * `from` là path+query tương đối (vd. `/officer/duplicates`).
 */
function resolveSafeOfficerFrom(raw: string | null): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (!path.startsWith('/officer/') && path !== '/officer') return null;
  return path;
}

/** ACL LEO do proxy — không render Access Denied trên client. */
export function TrackingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const detailFromQuery = searchParams.get('reportId')?.trim() || null;
  const activeDetailReportId = detailFromQuery ?? detailReportId;

  const handleBackFromDetail = () => {
    if (detailFromQuery) {
      const from = resolveSafeOfficerFrom(searchParams.get('from'));
      router.replace(from ?? '/officer/tracking', { scroll: false });
      return;
    }
    setDetailReportId(null);
  };

  if (activeDetailReportId) {
    return (
      <LeoTrackingReportDetail reportId={activeDetailReportId} onBack={handleBackFromDetail} />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <LeoTrackingPageClient onOpenDetail={setDetailReportId} />
    </div>
  );
}
