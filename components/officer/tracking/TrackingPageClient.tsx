'use client';

import { VerifyDetailClient } from '@/components/officer/VerifyDetailClient';
import { isDeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import dynamic from 'next/dynamic';
import { useState } from 'react';

/**
 * Router mỏng cho mục Theo dõi xử lý.
 *
 * - Token role nào → chỉ tải bundle của role đó (next/dynamic, ssr:false).
 * - State `detailReportId` ở router: DEO → `VerifyDetailClient`, LEO → `LeoTrackingReportDetail`.
 */

function TrackingFallback() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
      <div className="shrink-0">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted/70" />
      </div>
      <div className="flex-1 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

const LeoTrackingPageClient = dynamic(
  () => import('./LeoTrackingPageClient').then(m => m.LeoTrackingPageClient),
  { ssr: false, loading: TrackingFallback }
);

export function TrackingPageClient() {
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const systemRole = useAuthStore(s => s.user?.systemRole);
  const isDeo = isDeoOfficer(systemRole);

  if (detailReportId) {
    return (
      <div
        className={
          isDeo ? 'flex min-h-0 flex-1 flex-col gap-4 sm:gap-6' : 'flex min-h-0 flex-1 flex-col'
        }
      >
        {isDeo ? (
          <div className="shrink-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Theo dõi xử lý</h1>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
          {isDeo ? (
            <VerifyDetailClient
              id={detailReportId}
              onBack={() => setDetailReportId(null)}
              detailMode="tracking"
            />
          ) : (
            <h1>HELLO</h1>
          )}
        </div>
      </div>
    );
  }

  if (isDeo) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-lg font-semibold text-foreground">Theo dõi xử lý</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Giao diện theo dõi DEO đang được chuyển sang bố cục bản đồ. Vui lòng dùng mục Bản đồ hoặc
          Tổng quan trên sidebar.
        </p>
      </div>
    );
  }

  return <LeoTrackingPageClient onOpenDetail={setDetailReportId} />;
}
