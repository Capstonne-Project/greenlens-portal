'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MapShellContentProps = {
  children: ReactNode;
  variant?: 'map' | 'panel';
  /** Panel scroll — `hidden` for viewport-fit dashboards (DEO overview). */
  overflow?: 'auto' | 'hidden';
  /**
   * Chỉ `/officer/dashboard` (Tổng quan DEO): nền gần trắng `#fbfbfc`.
   * Layout khác giữ `bg-app-panel`.
   */
  panelTone?: 'default' | 'deo-overview';
};

/**
 * Floating content panel over `bg-app-canvas` (Prody-style):
 * - Thin 1px border on all sides
 * - Soft ambient shadow
 * - Stronger soft shadow on the left edge (casts right) so that edge reads darker/thicker
 */
export function MapShellContent({
  children,
  variant = 'map',
  overflow = 'auto',
  panelTone = 'default',
}: MapShellContentProps) {
  if (variant === 'map') {
    return <div className="absolute inset-0 z-0 size-full">{children}</div>;
  }

  return (
    <div className="app-shell-gutter">
      <div
        className={cn(
          'flex h-full w-full min-w-0 flex-1 flex-col rounded-2xl p-2 md:p-6',
          panelTone === 'deo-overview' ? 'bg-[#fbfbfc]' : 'bg-app-panel',
          overflow === 'hidden' ? 'overflow-hidden' : 'overflow-auto',
          'border-l-2',
          // Left edge emphasis via shadow (not thicker stroke) — matches sample
          'shadow-[2px_0_10px_-2px_rgb(0_0_0/10%),0_1px_3px_rgb(0_0_0/4%)]'
        )}
      >
        {children}
      </div>
    </div>
  );
}
