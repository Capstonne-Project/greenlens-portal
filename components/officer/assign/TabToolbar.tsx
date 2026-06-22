'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TabToolbarProps {
  /** Left side: tab-specific action buttons (New, Assign, etc.) */
  actionSlot?: React.ReactNode;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  filterOpen?: boolean;
  onFilterToggle?: () => void;
}

export function TabToolbar({
  actionSlot,
  search,
  onSearch,
  searchPlaceholder = 'Tìm kiếm...',
}: TabToolbarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
      {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}

      <div className="flex-1" />

      <div className="relative w-full min-w-0 max-w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 text-sm"
        />
      </div>
    </div>
  );
}
