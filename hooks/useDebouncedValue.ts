'use client';

import { useEffect, useRef, useState } from 'react';

/** Debounce mặc định cho ô tìm kiếm (API + lọc client). */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Trả về bản sao của `value` sau `delayMs` ms không đổi.
 * State nhập liệu cập nhật ngay; filter/API dùng giá trị debounced.
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs: number,
  /** Gọi sau khi giá trị debounce ổn định (trong timeout, không đồng bộ trong effect). */
  onDebounced?: (value: T) => void
): T {
  const [debounced, setDebounced] = useState(value);
  const onDebouncedRef = useRef(onDebounced);

  useEffect(() => {
    onDebouncedRef.current = onDebounced;
  }, [onDebounced]);

  useEffect(() => {
    const commit = () => {
      setDebounced(value);
      onDebouncedRef.current?.(value);
    };
    if (delayMs <= 0) {
      commit();
      return;
    }
    const id = window.setTimeout(commit, delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
