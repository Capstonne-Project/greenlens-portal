'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { CommunityCleanupDetailClient } from './CommunityCleanupDetailClient';
import {
  goBackWithListSoftReload,
  softReloadNotificationDestination,
} from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

function QueueFallback() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-7 w-56 rounded bg-slate-200" />
      <div className="h-10 w-full max-w-md rounded bg-slate-200" />
      <div className="h-64 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

const CommunityQueueBoard = dynamic(
  () => import('./CommunityQueueBoard').then(m => m.CommunityQueueBoard),
  { ssr: false, loading: QueueFallback }
);

/** ACL LEO do proxy — không render Access Denied trên client. */
export function CommunityQueuePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailFromQuery = searchParams.get('eventId')?.trim() || null;
  const activeDetailId = detailFromQuery ?? detailId;

  const handleOpenDetail = (id: string) => setDetailId(id);

  const handleBackFromDetail = () => {
    if (detailFromQuery) {
      const from = resolveSafeOfficerFrom(searchParams.get('from'));
      goBackWithListSoftReload({
        router,
        queryClient,
        from,
        fallbackHref: '/officer/community',
        method: 'replace',
      });
      return;
    }
    void softReloadNotificationDestination(queryClient, '/officer/community');
    setDetailId(null);
  };

  if (activeDetailId) {
    return <CommunityCleanupDetailClient eventId={activeDetailId} onBack={handleBackFromDetail} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <CommunityQueueBoard onOpenDetail={handleOpenDetail} />
    </div>
  );
}
