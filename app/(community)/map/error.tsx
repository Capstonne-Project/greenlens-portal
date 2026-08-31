'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function PublicMapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public-map]', error);
  }, [error]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">Không tải được bản đồ</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Vui lòng thử lại. Nếu sự cố tiếp diễn, quay lại sau khi máy chủ bản đồ công khai sẵn sàng.
      </p>
      <Button
        type="button"
        className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500"
        onClick={() => reset()}
      >
        Thử lại
      </Button>
    </main>
  );
}
