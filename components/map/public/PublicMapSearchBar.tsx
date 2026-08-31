'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { PublicMapProvinceCount } from '@/lib/api/services/fetchMap';
import { cn } from '@/lib/utils';

export type PublicMapProvincePick = {
  code: string | null;
  name?: string;
  longitude?: number;
  latitude?: number;
};

interface PublicMapSearchBarProps {
  provinces: PublicMapProvinceCount[];
  onSelect: (province: PublicMapProvincePick) => void;
  className?: string;
}

function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function PublicMapSearchBar({ provinces, onSelect, className }: PublicMapSearchBarProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = normalizeQuery(query);
    if (!q) return provinces.slice(0, 8);
    return provinces
      .filter(p => normalizeQuery(p.name).includes(q) || p.code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [provinces, query]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(0);
  }, []);

  const pick = useCallback(
    (province: PublicMapProvinceCount) => {
      onSelect({
        code: province.code,
        name: province.name,
        longitude: province.centerLongitude ?? undefined,
        latitude: province.centerLatitude ?? undefined,
      });
      setQuery(province.name);
      close();
      inputRef.current?.blur();
    },
    [close, onSelect]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [close]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close();
      inputRef.current?.blur();
      return;
    }
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(i => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(i => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) pick(item);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <label htmlFor={listId} className="sr-only">
        Tìm tỉnh hoặc thành phố trên bản đồ
      </label>
      <div className="flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white px-3 shadow-lg sm:h-10 sm:px-3.5">
        <Search className="size-4 shrink-0 text-slate-500" strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          id={listId}
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          placeholder="Tìm tỉnh, thành phố và hơn thế nữa"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
        />
        <kbd
          className="hidden shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline"
          aria-hidden
        >
          /
        </kbd>
      </div>

      {open && results.length > 0 ? (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-50 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/95 py-1 shadow-xl backdrop-blur-md"
        >
          {results.map((province, index) => (
            <li key={province.code} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10',
                  index === activeIndex && 'bg-white/10'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(province)}
              >
                <span className="line-clamp-1">{province.name}</span>
                <span className="shrink-0 tabular-nums text-xs text-white/45">
                  {province.count.toLocaleString('vi-VN')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && query && results.length === 0 ? (
        <p className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-50 rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2.5 text-sm text-white/60 shadow-xl backdrop-blur-md">
          Không tìm thấy tỉnh phù hợp.
        </p>
      ) : null}
    </div>
  );
}
