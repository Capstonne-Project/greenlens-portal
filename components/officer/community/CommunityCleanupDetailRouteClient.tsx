'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  CommunityCleanupDetailClient,
  type CommunityCleanupBackContext,
} from '@/components/officer/community/CommunityCleanupDetailClient';
import type { CommunityCleanupStatus } from '@/lib/api/models/communityCleanup';
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { resolveSafeOfficerFrom } from '@/utils/officerNavigation';

const COMMUNITY_QUEUE_TABS = new Set<string>([
  'All',
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

type CommunityCleanupDetailRouteClientProps = {
  eventId: string;
};

/** Route client — `/officer/community/[eventId]`. Chỉ mount detail; không fetch queue. */
export function CommunityCleanupDetailRouteClient({
  eventId,
}: CommunityCleanupDetailRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const from = resolveSafeOfficerFrom(searchParams.get('from'));

  const handleBack = (ctx?: CommunityCleanupBackContext) => {
    goBackWithListSoftReload({
      router,
      queryClient,
      from,
      fallbackHref: communityListHref(eventId, ctx?.status),
      method: 'replace',
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <CommunityCleanupDetailClient eventId={eventId} onBack={handleBack} />
    </div>
  );
}
