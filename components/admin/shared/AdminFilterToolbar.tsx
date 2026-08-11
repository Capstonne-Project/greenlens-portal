'use client';

import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';

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
      className={`min-w-[14rem] sm:w-72 ${className}`}
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
      <span className="text-sm font-medium leading-none">{label}</span>
      <div className="flex h-10 rounded-lg border border-border bg-background p-1">
        <button
          type="button"
          onClick={onActive}
          className={`rounded-md px-4 text-sm font-medium transition ${
            isActive ? 'bg-emerald-700 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {activeLabel}
          {activeBadge != null ? (
            <span className="ml-1 tabular-nums opacity-90">{activeBadge}</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onInactive}
          className={`rounded-md px-4 text-sm font-medium transition ${
            !isActive ? 'bg-emerald-700 text-white' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {inactiveLabel}
          {inactiveBadge != null ? (
            <span className="ml-1 tabular-nums opacity-90">{inactiveBadge}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
