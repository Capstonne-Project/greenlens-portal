'use client';

import { DEO_DASHBOARD_TABS, type DeoDashboardTab } from '@/lib/store/deoOverviewUiStore';
import { cn } from '@/lib/utils';
import { BarChart3, ClipboardList, Gauge, MapPinned } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TAB_ICONS: Record<DeoDashboardTab, LucideIcon> = {
  overview: Gauge,
  reports: ClipboardList,
  performance: BarChart3,
  map: MapPinned,
};

export function DeoDashboardTabs({
  activeTab,
  onChange,
  ariaLabel = 'Mục tổng quan Sở',
}: {
  activeTab: DeoDashboardTab;
  onChange: (tab: DeoDashboardTab) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 border-b border-border"
      role="tablist"
      aria-label={ariaLabel}
    >
      {DEO_DASHBOARD_TABS.map(tab => {
        const Icon = TAB_ICONS[tab.value];
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition sm:text-sm',
              isActive
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5 sm:size-4" aria-hidden />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
