'use client';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { isLeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import dynamic from 'next/dynamic';
import { useState } from 'react';
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

export function TrackingPageClient() {
  const user = useAuthStore(s => s.user);
  const [detailReportId, setDetailReportId] = useState<string | null>(null);

  if (!isLeoOfficer(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Theo dõi xử lý chỉ dành cho cán bộ văn phòng MT phường (LEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

  if (detailReportId) {
    return (
      <LeoTrackingReportDetail reportId={detailReportId} onBack={() => setDetailReportId(null)} />
    );
  }

  return <LeoTrackingPageClient onOpenDetail={setDetailReportId} />;
}
