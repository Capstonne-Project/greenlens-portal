import { Leaf } from 'lucide-react';

export function GreenLensLogo({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'onImage';
}) {
  const text = variant === 'onImage' ? 'text-white' : 'text-emerald-600';
  const leaf = variant === 'onImage' ? 'text-emerald-300' : 'text-emerald-600';
  return (
    <span className={`inline-flex items-end font-bold tracking-tight ${text} ${className ?? ''}`}>
      GreenLe
      <span className="relative inline-block min-w-[0.65ch] text-center">
        n
        <Leaf
          className={`pointer-events-none absolute -top-2.5 left-1/2 size-[1.05em] max-h-5 -translate-x-1/2 sm:max-h-6 ${leaf}`}
          aria-hidden
          strokeWidth={2.5}
        />
      </span>
      s
    </span>
  );
}
