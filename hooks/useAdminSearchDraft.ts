'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const ADMIN_SEARCH_DEBOUNCE_MS = 320;

/**
 * Draft tìm kiếm admin: giữ chữ khi đang gõ, chỉ sync từ URL khi blur / clear.
 * Tránh remount `key={searchQ}` và `setLocal(searchQ)` ghi đè input.
 */
export function useAdminSearchDraft(
  committedValue: string,
  onCommit: (trimmed: string) => void,
  debounceMs: number = ADMIN_SEARCH_DEBOUNCE_MS
) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(committedValue);
  const [pendingClear, setPendingClear] = useState(false);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (!focused || debounceMs <= 0) return;
    const trimmed = draft.trim();
    if (trimmed === committedValue.trim()) return;
    const timer = window.setTimeout(() => onCommitRef.current(trimmed), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, committedValue, debounceMs, focused]);

  const local = focused
    ? draft
    : pendingClear && committedValue.trim() !== ''
      ? ''
      : committedValue;

  const onFocus = useCallback(() => {
    setDraft(committedValue);
    setPendingClear(false);
    setFocused(true);
  }, [committedValue]);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const clear = useCallback(() => {
    setDraft('');
    setPendingClear(true);
    onCommitRef.current('');
  }, []);

  return {
    local,
    setLocal: setDraft,
    focused,
    onFocus,
    onBlur,
    clear,
    hasQuery: local.trim().length > 0,
  };
}
