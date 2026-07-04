'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

const DEBOUNCE_MS = 320;

interface OfficeLiveSearchProps {
  value: string;
  onChange: (trimmed: string) => void;
  matchHint?: string;
  className?: string;
}

/** Tìm debounce — không nút Tìm. */
export function OfficeLiveSearch({
  value,
  onChange,
  matchHint,
  className = '',
}: OfficeLiveSearchProps) {
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
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Tìm tỉnh / ủy ban
      </label>

      <div
        className={`relative flex h-11 items-center gap-2.5 rounded-xl border bg-background/90 px-3 shadow-sm backdrop-blur-sm transition-all ${
          focused
            ? 'border-emerald-600/45 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]'
            : 'border-border/80 hover:border-emerald-600/25'
        }`}
      >
        <span
          className={`absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent transition-opacity ${
            focused || hasQuery ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />
        <Search
          className={`size-4 shrink-0 transition-colors ${focused ? 'text-emerald-700' : 'text-muted-foreground'}`}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="HCM, Đồng Nai, Vĩnh Long…"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            aria-label="Xóa từ khóa"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            /
          </kbd>
        )}
      </div>

      {matchHint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-emerald-800">{matchHint}</span>
        </p>
      ) : null}
    </div>
  );
}
