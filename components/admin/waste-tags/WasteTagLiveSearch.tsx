'use client';

import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';

interface WasteTagLiveSearchProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
}

export function WasteTagLiveSearch({ value, onChange, className = '' }: WasteTagLiveSearchProps) {
  return (
    <AdminSearchField
      label="Tìm thẻ rác thải"
      value={value}
      onCommit={onChange}
      placeholder="Tự tìm liền — tên, mã, mô tả…"
      className={`min-w-[14rem] sm:w-72 ${className}`}
    />
  );
}
