import { Suspense } from 'react';
import { InspectionsPageClient } from '@/components/officer/inspections/InspectionsPageClient';

function InspectionsPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Đang tải…
    </div>
  );
}

export default function OfficerInspectionsPage() {
  return (
    <Suspense fallback={<InspectionsPageFallback />}>
      <InspectionsPageClient />
    </Suspense>
  );
}
