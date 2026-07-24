'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

const DEBOUNCE_MS = 320;

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
  const inputId = useId();
  const [local, setLocal] = useState(() => value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const trimmed = local.trim();
    if (trimmed === value.trim()) return;
    const timer = window.setTimeout(() => onChange(trimmed), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [local, value, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      document.getElementById(inputId)?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputId]);

  const hasQuery = local.trim().length > 0;

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Tìm ủy ban, tỉnh hoặc mã tỉnh
      </label>

      <div
        className={`flex h-10 items-center gap-2 rounded-xl border bg-white px-3 transition-colors dark:bg-zinc-950 ${
          focused
            ? 'border-zinc-400 ring-2 ring-zinc-200/80 dark:border-zinc-500 dark:ring-zinc-700/50'
            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
        }`}
      >
        <Search
          className={`size-4 shrink-0 ${focused ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400'}`}
          aria-hidden
        />
        <input
          id={inputId}
          type="text"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Tìm Sở, tỉnh…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
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
        ) : (
          <kbd className="hidden shrink-0 rounded border border-border bg-muted/50 px-1 font-mono text-[10px] text-muted-foreground sm:inline">
            /
          </kbd>
        )}
      </div>

      {typeof resultCount === 'number' && hasQuery ? (
        <p className="absolute -bottom-5 right-0 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{resultCount}</span> kết quả
        </p>
      ) : null}
    </div>
  );
}
