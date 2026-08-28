'use client';

import {
  ADMIN_SEARCH_INPUT_CLASS,
  ADMIN_TOOLBAR_LABEL,
} from '@/components/admin/shared/adminUiTokens';
import { ValidatedSearchInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import { ADMIN_SEARCH_DEBOUNCE_MS, useAdminSearchDraft } from '@/hooks/useAdminSearchDraft';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useId, type ReactNode } from 'react';

export interface AdminSearchFieldProps {
  label: string;
  /** Giá trị đã commit (URL hoặc filter state). */
  value: string;
  onCommit: (trimmed: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  debounceMs?: number;
  footer?: ReactNode;
  enableShortcut?: boolean;
  inputClassName?: string;
}

/** Ô tìm kiếm admin — label, debounce khi gõ, một nút X để xóa. */
export function AdminSearchField({
  label,
  value,
  onCommit,
  placeholder,
  className = '',
  id: idProp,
  debounceMs = ADMIN_SEARCH_DEBOUNCE_MS,
  footer,
  enableShortcut = false,
  inputClassName = '',
}: AdminSearchFieldProps) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const { local, setLocal, onFocus, onBlur, clear, hasQuery } = useAdminSearchDraft(
    value,
    onCommit,
    debounceMs
  );

  const applyNow = useCallback(() => {
    onCommit(local.trim());
  }, [local, onCommit]);

  useEffect(() => {
    if (!enableShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      document.getElementById(inputId)?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableShortcut, inputId]);

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={inputId} className={ADMIN_TOOLBAR_LABEL}>
          {label}
        </label>
      ) : null}
      <div className="relative min-w-0">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <ValidatedSearchInput
          id={inputId}
          type="text"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyNow();
            }
          }}
          maxLength={SEARCH_INPUT_MAX_LENGTH}
          showCounter={false}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(ADMIN_SEARCH_INPUT_CLASS, inputClassName)}
        />
        {hasQuery ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={e => e.preventDefault()}
            onClick={clear}
            className="absolute right-1 top-1/2 z-10 size-8 -translate-y-1/2 text-muted-foreground"
            aria-label="Xóa từ khóa"
          >
            <X className="size-3.5" />
          </Button>
        ) : enableShortcut ? (
          <kbd className="pointer-events-none absolute right-2 top-1/2 z-10 hidden shrink-0 -translate-y-1/2 rounded-md border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
            /
          </kbd>
        ) : null}
      </div>
      {footer}
    </div>
  );
}
