'use client';

import { isDeoOfficer } from '@/lib/constants/officerRoles';
import { useAuthStore } from '@/lib/store/authStore';
import dynamic from 'next/dynamic';
import { useState } from 'react';

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
  const systemRole = useAuthStore(s => s.user?.systemRole);
  const isDeo = isDeoOfficer(systemRole);
  const [, setDetailReportId] = useState<string | null>(null);

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
