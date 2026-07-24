'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  /** Gọi khi panel dropdown mở/đóng — dùng lazy-fetch options. */
  onOpenChange?: (open: boolean) => void;
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
  onOpenChange,
}: SearchableSelectProps) {
  const autoId = useId();
  const listboxId = `${idProp ?? autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    setCoords(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const updateCoords = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    const onReposition = () => updateCoords();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeDropdown();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, closeDropdown]);

  const handleSelect = (next: string) => {
    onChange(next);
    closeDropdown();
  };

  const dropdown =
    open &&
    coords &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        ref={panelRef}
        id={listboxId}
        role="listbox"
        className="fixed z-[100] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
        }}
      >
        <div className="border-b border-border p-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40"
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
                  o.value === value ? 'bg-zinc-100 font-medium text-zinc-900' : ''
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      </div>,
      document.body
    );

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
            const next = !v;
            if (next) {
              const el = rootRef.current;
              if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                  top: rect.bottom + 4,
                  left: rect.left,
                  width: rect.width,
                });
              }
            } else {
              setQuery('');
              setCoords(null);
            }
            onOpenChange?.(next);
            return next;
          });
        }}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60"
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
      {dropdown}
    </div>
  );
}
