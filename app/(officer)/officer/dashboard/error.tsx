'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function OfficerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[officer/dashboard]', error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Không tải được tổng quan</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Vui lòng thử lại hoặc quay về trang trước.
      </p>
      <Button
        type="button"
        className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500"
        onClick={() => reset()}
      >
        Thử lại
      </Button>
    </div>
  );
}
