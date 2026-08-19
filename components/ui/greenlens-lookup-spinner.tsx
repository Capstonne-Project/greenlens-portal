import type { ComponentProps } from 'react';

import { Leaf } from 'lucide-react';

import { cn } from '@/lib/utils';

type GreenLensLookupSpinnerProps = ComponentProps<'span'>;

/**
 * GreenLens lookup spinner — leaf inside an emerald spinning ring.
 * Default `size-5` matches the recruit email search input.
 * Tables: `className="size-8"` (or `size-6` for overlay).
 */
export function GreenLensLookupSpinner({ className, ...props }: GreenLensLookupSpinnerProps) {
  const labelled = props['aria-label'] != null || props['aria-labelledby'] != null;

  return (
    <span
      className={cn('relative inline-flex size-5 shrink-0 items-center justify-center', className)}
      aria-hidden={labelled ? undefined : true}
      {...props}
    >
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
      <Leaf className="size-[50%] text-emerald-600" strokeWidth={2.5} />
    </span>
  );
}
