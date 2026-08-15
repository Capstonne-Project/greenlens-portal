'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  CommunityCleanupDetailClient,
  type CommunityCleanupBackContext,
} from './CommunityCleanupDetailClient';
import type { CommunityCleanupStatus } from '@/lib/api/models/communityCleanup';
import {
  goBackWithListSoftReload,
  softReloadNotificationDestination,
} from '@/utils/notificationNavigation';

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

const COMMUNITY_QUEUE_TABS = new Set<string>([
  'OpenForJoin',
  'JoinClosed',
  'InProgress',
  'PendingVerification',
  'Completed',
  'Cancelled',
]);

function communityListHref(eventId: string, status?: CommunityCleanupStatus) {
  const params = new URLSearchParams();
  params.set('highlight', eventId);
  if (status && COMMUNITY_QUEUE_TABS.has(status)) {
    params.set('tab', status);
  }
  return `/officer/community?${params.toString()}`;
}

/** ACL LEO do proxy — không render Access Denied trên client. */
export function CommunityQueuePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailFromQuery = searchParams.get('eventId')?.trim() || null;
  const activeDetailId = detailFromQuery ?? detailId;

  const handleOpenDetail = (id: string) => setDetailId(id);

  const handleBackFromDetail = (ctx?: CommunityCleanupBackContext) => {
    const id = activeDetailId;
    const listHref = id ? communityListHref(id, ctx?.status) : '/officer/community';

    if (detailFromQuery) {
      goBackWithListSoftReload({
        router,
        queryClient,
        from: null,
        fallbackHref: listHref,
        method: 'replace',
      });
      return;
    }
    void softReloadNotificationDestination(queryClient, '/officer/community');
    setDetailId(null);
    if (id) router.replace(listHref, { scroll: false });
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
