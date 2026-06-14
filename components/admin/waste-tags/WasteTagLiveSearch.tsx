'use client';

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
      <div
        className={`flex h-10 items-center gap-2 rounded-lg border bg-background px-3 transition-colors ${
          focused
            ? 'border-emerald-600/40 ring-2 ring-emerald-500/15'
            : 'border-border hover:border-emerald-600/25'
        }`}
      >
        <Search
          className={`size-4 shrink-0 ${focused ? 'text-emerald-700' : 'text-muted-foreground'}`}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={local}
          onChange={e => {
            const next = e.target.value;
            setLocal(next);
            onChange(next.trim());
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Tự tìm liền — tên, mã, mô tả…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/75"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
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
