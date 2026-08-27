'use client';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function QueueFallback() {
  return (
    <div className="flex h-full min-h-0 flex-1 animate-pulse flex-col gap-3 p-4">
      <div className="h-7 w-56 rounded bg-slate-200" />
      <div className="h-10 w-full max-w-md rounded bg-slate-200" />
      <div className="min-h-0 flex-1 rounded-xl bg-slate-100" />
    </div>
  );
}

const CommunityQueueBoard = dynamic(
  () => import('./CommunityQueueBoard').then(m => m.CommunityQueueBoard),
  { ssr: false, loading: QueueFallback }
);

/**
 * List hub — `/officer/community`.
 * Detail sống ở `/officer/community/[eventId]` (không overlay state trên cùng URL).
 * Legacy `?eventId=` → redirect sang path detail để reload chỉ call API detail.
 */
export function CommunityQueuePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyEventId = searchParams.get('eventId')?.trim() || null;

  useEffect(() => {
    if (!legacyEventId) return;
    router.replace(`/officer/community/${encodeURIComponent(legacyEventId)}`);
  }, [legacyEventId, router]);

  if (legacyEventId) {
    return <QueueFallback />;
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <CommunityQueueBoard
        onOpenDetail={id => router.push(`/officer/community/${encodeURIComponent(id)}`)}
      />
    </div>
  );
}
