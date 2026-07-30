'use client';

import { useOutsideClick } from '@/hooks/useOutsideClick';
import { cn } from '@/lib/utils';
import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type AuditSearchOption = {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
};

const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

interface AuditSearchPickerProps {
  inputId: string;
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (id: string | null) => void;
  options: AuditSearchOption[];
  isLoading?: boolean;
  resolved?: AuditSearchOption | null;
  disabled?: boolean;
  emptyMessage?: string;
  onPageReset?: () => void;
  /** Gọi khi user gõ — parent dùng để query API. */
  onSearchChange?: (search: string) => void;
}

export function AuditSearchPicker({
  inputId,
  label,
  hint,
  placeholder,
  value,
  onChange,
  options,
  isLoading = false,
  resolved = null,
  disabled = false,
  emptyMessage = 'Không tìm thấy kết quả.',
  onPageReset,
  onSearchChange,
}: AuditSearchPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = resolved ?? (value ? (options.find(o => o.id === value) ?? null) : null);

  useOutsideClick(rootRef, () => setOpen(false));

  useEffect(() => {
    onSearchChange?.(search);
  }, [search, onSearchChange]);

  const pick = useCallback(
    (option: AuditSearchOption) => {
      onChange(option.id);
      onPageReset?.();
      setSearch('');
      setOpen(false);
    },
    [onChange, onPageReset]
  );

  const clear = () => {
    onChange(null);
    onPageReset?.();
    setSearch('');
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <input
          id={inputId}
          disabled
          placeholder="Chọn entity type trước"
          className={cn(fieldClass, 'cursor-not-allowed opacity-60')}
        />
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    );
  }

  if (selected && !open) {
    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-emerald-950">{selected.label}</p>
            {selected.sublabel ? (
              <p className="truncate text-xs text-emerald-900/65">{selected.sublabel}</p>
            ) : null}
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {selected.id}
            </p>
          </div>
          {selected.badge ? (
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {selected.badge}
            </span>
          ) : null}
          <button
            type="button"
            onClick={clear}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100"
            aria-label="Bỏ chọn"
          >
            <X className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-xs font-medium text-emerald-700 hover:underline"
          >
            Đổi
          </button>
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(fieldClass, 'pl-9 pr-9')}
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Xóa từ khóa"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {open ? (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {isLoading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tìm…
            </div>
          ) : options.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            <ul>
              {options.map(option => (
                <li key={option.id}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => pick(option)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-emerald-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{option.label}</span>
                      {option.sublabel ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.sublabel}
                        </span>
                      ) : null}
                    </span>
                    {option.badge ? (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                        {option.badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface AuditGuidInputProps {
  inputId: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string | null) => void;
  onPageReset?: () => void;
}

/** Fallback khi entity type chưa có API tìm kiếm thân thiện. */
export function AuditGuidInput({
  inputId,
  label,
  hint,
  value,
  onChange,
  onPageReset,
}: AuditGuidInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value.trim() || null);
          onPageReset?.();
        }}
        placeholder="Dán GUID từ trang chi tiết"
        className={cn(fieldClass, 'font-mono text-xs')}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
