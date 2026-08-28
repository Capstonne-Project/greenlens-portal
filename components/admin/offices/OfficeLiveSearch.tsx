'use client';

import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';

interface OfficeLiveSearchProps {
  value: string;
  onChange: (trimmed: string) => void;
  matchHint?: string;
  className?: string;
}

export function OfficeLiveSearch({
  value,
  onChange,
  matchHint,
  className = '',
}: OfficeLiveSearchProps) {
  return (
    <AdminSearchField
      label="Tìm tỉnh / ủy ban"
      value={value}
      onCommit={onChange}
      placeholder="HCM, Đồng Nai, Vĩnh Long…"
      className={className}
      enableShortcut
      inputClassName="bg-white dark:bg-zinc-950"
      footer={
        matchHint ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{matchHint}</span>
          </p>
        ) : null
      }
    />
  );
}
