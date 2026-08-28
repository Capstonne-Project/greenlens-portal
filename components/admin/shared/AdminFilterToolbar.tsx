'use client';

import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';
import { ADMIN_TOOLBAR_CTA, ADMIN_TOOLBAR_LABEL } from '@/components/admin/shared/adminUiTokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminFilterSearchProps {
  id: string;
  label: string;
  /** Giá trị đã commit (URL hoặc filter state). */
  value: string;
  onCommit: (trimmed: string) => void;
  placeholder?: string;
  className?: string;
}

/** Ô tìm kiếm toolbar admin — alias của AdminSearchField. */
export function AdminFilterSearch({
  id,
  label,
  value,
  onCommit,
  placeholder,
  className = '',
}: AdminFilterSearchProps) {
  return (
    <AdminSearchField
      id={id}
      label={label}
      value={value}
      onCommit={onCommit}
      placeholder={placeholder}
      className={cn('min-w-[14rem] sm:w-72', className)}
    />
  );
}

interface AdminFilterStatusToggleProps {
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  isActive: boolean;
  onActive: () => void;
  onInactive: () => void;
  activeBadge?: number;
  inactiveBadge?: number;
}

/** Segmented trạng thái — cùng chiều cao h-10 với ô search. */
export function AdminFilterStatusToggle({
  label = 'Trạng thái',
  activeLabel = 'Đang dùng',
  inactiveLabel = 'Ngưng',
  isActive,
  onActive,
  onInactive,
  activeBadge,
  inactiveBadge,
}: AdminFilterStatusToggleProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <span className={ADMIN_TOOLBAR_LABEL}>{label}</span>
      <div className="flex h-10 rounded-md border border-border bg-background p-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onActive}
          className={cn('h-8 flex-1 rounded-sm px-4 font-medium', isActive && ADMIN_TOOLBAR_CTA)}
        >
          {activeLabel}
          {activeBadge != null ? (
            <span className="ml-1 tabular-nums opacity-90">{activeBadge}</span>
          ) : null}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onInactive}
          className={cn('h-8 flex-1 rounded-sm px-4 font-medium', !isActive && ADMIN_TOOLBAR_CTA)}
        >
          {inactiveLabel}
          {inactiveBadge != null ? (
            <span className="ml-1 tabular-nums opacity-90">{inactiveBadge}</span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
