'use client';

import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';

interface DepartmentLiveSearchProps {
  value: string;
  onChange: (trimmed: string) => void;
  resultCount?: number;
  className?: string;
}

export function DepartmentLiveSearch({
  value,
  onChange,
  resultCount,
  className = '',
}: DepartmentLiveSearchProps) {
  return (
    <AdminSearchField
      label="Tìm Sở, tỉnh"
      value={value}
      onCommit={onChange}
      placeholder="Tìm tên Sở, tỉnh…"
      className={className}
      enableShortcut
      inputClassName="bg-white dark:bg-zinc-950"
      footer={
        typeof resultCount === 'number' && value.trim() ? (
          <p className="text-right text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{resultCount}</span> kết quả
          </p>
        ) : null
      }
    />
  );
}
