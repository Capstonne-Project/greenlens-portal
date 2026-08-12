import { Suspense } from 'react';

import { CompanyAssignView } from '@/components/company/assign/CompanyAssignView';

function CompanyAssignFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  );
}

export default function CompanyAssignPage() {
  return (
    <Suspense fallback={<CompanyAssignFallback />}>
      <CompanyAssignView />
    </Suspense>
  );
}
