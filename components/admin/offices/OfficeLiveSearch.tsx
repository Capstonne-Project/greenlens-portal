'use client';

import { ValidatedSearchInput } from '@/components/common/ValidatedField';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
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

      <div className="relative">
        <Search
          className={`pointer-events-none absolute left-3 top-[13px] z-10 size-4 shrink-0 ${focused ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400'}`}
          aria-hidden
        />
        <ValidatedSearchInput
          id={inputId}
          value={local}
          onChange={e => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={SEARCH_INPUT_MAX_LENGTH}
          placeholder="HCM, Đồng Nai, Vĩnh Long…"
          autoComplete="off"
          className="bg-white pl-9 pr-9 dark:bg-zinc-950"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setLocal('');
              onChange('');
            }}
            className="absolute right-2 top-[9px] z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            aria-label="Xóa từ khóa"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2 top-[11px] z-10 hidden shrink-0 rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            /
          </kbd>
        )}
      </div>

      {matchHint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">{matchHint}</span>
        </p>
      ) : null}
    </div>
  );
}
