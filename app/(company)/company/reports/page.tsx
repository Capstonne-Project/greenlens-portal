import { Suspense } from 'react';

import { CompanyReportsView } from '@/components/company/reports/CompanyReportsView';

export default function CompanyReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Đang tải…
        </div>
      }
    >
      <CompanyReportsView />
    </Suspense>
  );
}
