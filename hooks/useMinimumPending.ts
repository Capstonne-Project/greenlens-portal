'use client';

import { useEffect, useRef, useState } from 'react';

/** Thời gian tối thiểu hiện spinner lookup — tránh chớp tắt khi BE trả < 100ms. */
export const LOOKUP_SPINNER_MIN_MS = 450;

/**
 * Giữ `true` ít nhất `minMs` kể từ lúc `pending` lần đầu bật.
 * - `pending === true` → hiện ngay
 * - `pending === false` → chỉ tắt sau khi đã đủ minMs (UX “thấy được đang load”)
 *
 * Dùng cho spinner / skeleton khi API nhanh hơn nhận thức người dùng.
 */
export function useMinimumPending(pending: boolean, minMs = LOOKUP_SPINNER_MIN_MS): boolean {
  const [hold, setHold] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let id: number;

    if (pending) {
      if (startedAtRef.current == null) {
        startedAtRef.current = Date.now();
      }
      // Defer setState — tránh react-hooks/set-state-in-effect (cascading render sync).
      id = window.setTimeout(() => setHold(true), 0);
      return () => window.clearTimeout(id);
    }

    if (startedAtRef.current == null) {
      id = window.setTimeout(() => setHold(false), 0);
      return () => window.clearTimeout(id);
    }

    const remain = Math.max(0, minMs - (Date.now() - startedAtRef.current));
    id = window.setTimeout(() => {
      startedAtRef.current = null;
      setHold(false);
    }, remain);

    return () => window.clearTimeout(id);
  }, [pending, minMs]);

  return pending || hold;
}
