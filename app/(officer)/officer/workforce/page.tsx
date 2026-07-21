import { WorkforcePageClient } from '@/components/officer/workforce/WorkforcePageClient';
import { Suspense } from 'react';

function WorkforceFallback() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <div className="h-7 w-40 rounded bg-slate-200" />
      </div>
      <div className="h-10 w-56 rounded-full bg-slate-200" />
      <div className="h-96 rounded border border-slate-200 bg-white" />
    </div>
  );
}

export default function OfficerWorkforcePage() {
  return (
    <Suspense fallback={<WorkforceFallback />}>
      <WorkforcePageClient />
    </Suspense>
  );
}
