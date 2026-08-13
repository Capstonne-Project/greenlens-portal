import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PostProcessingHubClient } from '@/components/officer/recurrence/PostProcessingHubClient';

export const metadata: Metadata = {
  title: 'Tái diễn',
};

function PostProcessingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2 pb-3">
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="h-3 w-72 max-w-full rounded bg-slate-200" />
      </div>
      <div className="flex gap-6 border-b border-slate-200 pb-2.5">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-4 w-28 rounded bg-slate-200" />
      </div>
      <div className="h-10 w-full max-w-md rounded bg-slate-200" />
      <div className="h-80 rounded border border-slate-200 bg-white" />
    </div>
  );
}

export default function OfficerRecurrencePage() {
  return (
    <Suspense fallback={<PostProcessingFallback />}>
      <PostProcessingHubClient />
    </Suspense>
  );
}
