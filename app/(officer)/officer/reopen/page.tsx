import { Suspense } from 'react';
import { ReopenPageClient } from '@/components/officer/reopen/ReopenPageClient';

function ReopenPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Đang tải…
    </div>
  );
}

export default function OfficerReopenPage() {
  return (
    <Suspense fallback={<ReopenPageFallback />}>
      <ReopenPageClient />
    </Suspense>
  );
}
