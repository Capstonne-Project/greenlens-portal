import '@designcodeio/threeui/style.css';
import type { ReactNode } from 'react';
import { SylvaLivingWorldBackground } from '@/components/landing/SylvaLivingWorldBackground';
import { cn } from '@/lib/utils';

type PublicSiteShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared Sylva living-world shell for all public landing pages.
 * Canvas stays behind content; interactive areas use `landing-hit`.
 */
export function PublicSiteShell({ children, className }: PublicSiteShellProps) {
  return (
    <div className={cn('landing-sylva relative flex min-h-dvh flex-col text-stone-50', className)}>
      <div className="shader-frame landing-sylva-canvas" aria-hidden>
        <SylvaLivingWorldBackground />
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}
