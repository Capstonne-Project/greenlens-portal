'use client';

import { ValidatedSearchInput } from '@/components/common/ValidatedField';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
import { Search, X } from 'lucide-react';
import { useId, useState } from 'react';

interface WasteTagLiveSearchProps {
  value: string;
  onChange: (query: string) => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export function WasteTagLiveSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  className = '',
}: WasteTagLiveSearchProps) {
  const inputId = useId();
  const [local, setLocal] = useState(() => value);
  const [focused, setFocused] = useState(false);

  const hasQuery = local.trim().length > 0;

  return (
    <div className={`flex min-w-[240px] flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-medium">
        Tìm thẻ rác thải
      </label>
      <div className="relative">
        <Search
          className={`pointer-events-none absolute left-3 top-[13px] z-10 size-4 shrink-0 ${focused ? 'text-emerald-700' : 'text-muted-foreground'}`}
          aria-hidden
        />
        <ValidatedSearchInput
          id={inputId}
          value={local}
          onChange={e => {
            const next = e.target.value;
            setLocal(next);
            onChange(next.trim());
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={SEARCH_INPUT_MAX_LENGTH}
          placeholder="Tự tìm liền — tên, mã, mô tả…"
          autoComplete="off"
          className="pl-9 pr-9"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            className="absolute right-2 top-[9px] z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Xóa từ khóa"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      {hasQuery && typeof resultCount === 'number' ? (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-emerald-800">{resultCount}</span>
          {typeof totalCount === 'number' ? ` / ${totalCount}` : null} kết quả
        </p>
      ) : null}
    </div>
  );
}
