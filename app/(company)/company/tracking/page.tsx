import { CompanyTrackingView } from '@/components/company/tracking/CompanyTrackingView';
import { Suspense } from 'react';

export default function CompanyTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Đang tải…
        </div>
      }
    >
      <CompanyTrackingView />
    </Suspense>
  );
}
