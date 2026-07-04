'use client';

import { useUiStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';

interface SidebarCollapseToggleProps {
  className?: string;
}

export function SidebarCollapseToggle({ className }: SidebarCollapseToggleProps) {
  const collapsed = useUiStore(s => s.sidebarCollapsed);
  const toggle = useUiStore(s => s.toggleSidebarCollapsed);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        className
      )}
      aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      aria-expanded={!collapsed}
    >
      <PanelLeft className={cn('size-4 transition', collapsed && 'scale-x-[-1]')} aria-hidden />
    </button>
  );
}
