'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** Chuỗi bổ sung để lọc (mã, tên viết tắt, …) */
  keywords?: string;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  id: idProp,
  options,
  value,
  onChange,
  placeholder = '— Chọn —',
  searchPlaceholder = 'Gõ để tìm…',
  disabled = false,
  loading = false,
  emptyMessage = 'Không có kết quả.',
}: SearchableSelectProps) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => {
      const haystack = `${o.label} ${o.keywords ?? ''} ${o.value}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, closeDropdown]);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={idProp}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled || loading) return;
          setOpen(v => {
            if (v) setQuery('');
            return !v;
          });
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? 'truncate' : 'truncate text-muted-foreground'}>
          {loading ? 'Đang tải…' : (selected?.label ?? placeholder)}
        </span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border p-2">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              autoFocus
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            )}
            {filtered.map(o => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`flex w-full px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                    o.value === value ? 'bg-emerald-50 font-medium text-emerald-900' : ''
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
