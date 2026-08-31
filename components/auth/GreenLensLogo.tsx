import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

type GreenLensLogoVariant = 'default' | 'onImage' | 'map';

export function GreenLensLogo({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: GreenLensLogoVariant;
}) {
  if (variant === 'map') {
    return (
      <span
        className={cn('inline-flex items-end font-bold tracking-tight', className)}
      >
        <span className="text-white">Green</span>
        <span className="text-emerald-400">
          Le
          <span className="relative inline-block min-w-[0.65ch] text-center">
            n
            <Leaf
              className="pointer-events-none absolute -top-2.5 left-1/2 size-[1.05em] max-h-5 -translate-x-1/2 text-emerald-400 sm:max-h-6"
              aria-hidden
              strokeWidth={2.5}
            />
          </span>
          s
        </span>
      </span>
    );
  }

  const text = variant === 'onImage' ? 'text-white' : 'text-emerald-600';
  const leaf = variant === 'onImage' ? 'text-emerald-300' : 'text-emerald-600';
  return (
    <span className={cn('inline-flex items-end font-bold tracking-tight', text, className)}>
      GreenLe
      <span className="relative inline-block min-w-[0.65ch] text-center">
        n
        <Leaf
          className={cn(
            'pointer-events-none absolute -top-2.5 left-1/2 size-[1.05em] max-h-5 -translate-x-1/2 sm:max-h-6',
            leaf
          )}
          aria-hidden
          strokeWidth={2.5}
        />
      </span>
      s
    </span>
  );
}
