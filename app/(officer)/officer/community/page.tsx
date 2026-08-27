import { Suspense } from 'react';

import { CommunityQueuePageClient } from '@/components/officer/community/CommunityQueuePageClient';

function CommunityListFallback() {
  return (
    <div className="flex h-full min-h-0 flex-1 animate-pulse flex-col gap-3 p-4">
      <div className="h-7 w-56 rounded bg-slate-200" />
      <div className="h-10 w-full max-w-md rounded bg-slate-200" />
      <div className="min-h-0 flex-1 rounded-xl bg-slate-100" />
    </div>
  );
}

/** List hub — chỉ mount queue board (office-queue API). Detail = `/officer/community/[eventId]`. */
export default function OfficerCommunityPage() {
  return (
    <Suspense fallback={<CommunityListFallback />}>
      <CommunityQueuePageClient />
    </Suspense>
  );
}
