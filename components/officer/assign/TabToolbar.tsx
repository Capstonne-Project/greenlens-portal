'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';

interface TabToolbarProps {
  /** Left side: tab-specific action buttons (New, Assign, etc.) */
  actionSlot?: React.ReactNode;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  /** Number of active filters to show on the badge */
  filterCount?: number;
  filterOpen?: boolean;
  onFilterToggle?: () => void;
}

export function TabToolbar({
  actionSlot,
  search,
  onSearch,
  searchPlaceholder = 'Tìm kiếm...',
  isRefreshing = false,
  onRefresh,
  filterCount = 0,
  filterOpen = false,
  onFilterToggle,
}: TabToolbarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
      {/* Left: per-tab action buttons */}
      {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: shared search + refresh + filter */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 text-sm"
          />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>

        {/* Filter */}
        <Button
          variant={filterOpen || filterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          onClick={onFilterToggle}
          className={`gap-1.5 ${filterOpen || filterCount > 0 ? 'border-primary/30 text-primary' : ''}`}
        >
          <SlidersHorizontal className="size-4" />
          Bộ lọc
          {filterCount > 0 && (
            <Badge className="ml-0.5 size-5 rounded-full p-0 text-center text-[10px] leading-5">
              {filterCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
