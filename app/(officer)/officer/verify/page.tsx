import { Suspense } from 'react';
import { VerifyPageClient } from '@/components/officer/verify/VerifyPageClient';

function VerifyPageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Đang tải…
    </div>
  );
}

export default function OfficerVerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageClient />
    </Suspense>
  );
}
