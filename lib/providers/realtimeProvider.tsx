'use client';

import { isSignalREnabled } from '@/lib/realtime/getHubBaseUrl';
import {
  startNotificationHub,
  stopNotificationHub,
  type ReceiveNotificationPayload,
} from '@/lib/realtime/notificationHub';
import { useAuthStore } from '@/lib/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';

/** Query key prefix for future inbox — invalidate on SignalR push. */
export const notificationInboxKeys = {
  all: ['notifications'] as const,
};

/**
 * Connects to BE `/hubs/notifications` when authenticated and
 * `NEXT_PUBLIC_ENABLE_SIGNALR=true`. Does not replace React Query.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignalREnabled() || !isAuthenticated || !token) {
      void stopNotificationHub();
      return;
    }

    let cancelled = false;

    const onReceive = (payload: ReceiveNotificationPayload) => {
      void queryClient.invalidateQueries({ queryKey: notificationInboxKeys.all });
      const title = typeof payload.title === 'string' ? payload.title.trim() : '';
      const body = typeof payload.body === 'string' ? payload.body.trim() : '';
      if (title || body) {
        toast.message(title || 'Thông báo mới', {
          description: body || undefined,
        });
      }
    };

    void startNotificationHub(token, onReceive).catch(() => {
      if (!cancelled) {
        // Silent fail — REST still works; avoid noisy toasts on hub downtime
      }
    });

    return () => {
      cancelled = true;
      void stopNotificationHub();
    };
  }, [isAuthenticated, token, queryClient]);

  return <>{children}</>;
}
