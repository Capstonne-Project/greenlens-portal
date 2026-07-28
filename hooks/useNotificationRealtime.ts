'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createNotificationHub } from '@/lib/realtime';
import { notificationKeys } from '@/hooks/useNotification';

/**
 * Seam realtime cho notification.
 * REST-first: no-op khi hub chưa cấu hình.
 * Khi SignalR bật: invalidate React Query — UI drawer tự refresh, không đụng component tree.
 */
export function useNotificationRealtime(enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const hub = createNotificationHub();
    if (!hub) return;

    let disposed = false;

    const unsub = hub.onEvent(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    void hub.start().catch(() => {
      // Hub fail → giữ REST polling / staleTime; không crash UI.
    });

    return () => {
      if (disposed) return;
      disposed = true;
      unsub();
      void hub.stop();
    };
  }, [enabled, queryClient]);
}
