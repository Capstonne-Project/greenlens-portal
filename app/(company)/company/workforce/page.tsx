import { CompanyWorkforcePageClient } from '@/components/company/workforce/CompanyWorkforcePageClient';
import { Suspense } from 'react';

function WorkforceFallback() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <div className="h-7 w-36 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-100" />
      </div>
      <div className="h-8 w-56 rounded-md bg-slate-100" />
      <div className="h-64 rounded-md border border-slate-200 bg-white" />
    </div>
  );
}

export default function CompanyWorkforcePage() {
  return (
    <Suspense fallback={<WorkforceFallback />}>
      <CompanyWorkforcePageClient />
    </Suspense>
  );
}
