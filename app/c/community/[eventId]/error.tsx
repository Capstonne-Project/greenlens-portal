'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function CommunityCleanupPublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[public-community-cleanup]', error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-foreground">Không tải được chương trình</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Vui lòng thử lại sau. Nếu bạn vừa nhận link chia sẻ, đợi vài giây rồi tải lại trang.
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
