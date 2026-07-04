import { CompanyAssignmentsView } from '@/components/company/assignments/CompanyAssignmentsView';
import { Suspense } from 'react';

export default function CompanyAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Đang tải…
        </div>
      }
    >
      <CompanyAssignmentsView />
    </Suspense>
  );
}
