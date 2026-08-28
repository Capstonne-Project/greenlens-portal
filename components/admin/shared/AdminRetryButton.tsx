'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminRetryButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/** Nút thử lại chuẩn admin — shadcn link variant, emerald. */
export function AdminRetryButton({ onClick, label = 'Thử lại', className }: AdminRetryButtonProps) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      className={cn(
        'h-auto p-0 text-sm font-medium text-emerald-700 hover:text-emerald-800',
        className
      )}
    >
      {label}
    </Button>
  );
}
