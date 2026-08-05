'use client';

/**
 * Seam realtime → React Query.
 *
 * Hub (SignalR) chỉ báo "có noti mới" / "đã connected".
 * Source of truth vẫn là REST (GET /v1/notifications).
 * Không đẩy list vào Zustand.
 */

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createNotificationHub } from '@/lib/realtime';
import type { RealTimeNotificationPayload } from '@/lib/realtime/types';
import type { NotificationItem, NotificationsList } from '@/lib/api/models/notification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { COMPANY_QUEUE_REFRESH_NOTIFICATION_TYPES, companyKeys } from '@/hooks/useCompany';
import { notificationKeys } from '@/hooks/useNotification';
import { showNotificationRealtimeToast } from '@/components/notification/NotificationRealtimeToast';

/** Dedupe at-least-once từ BE (theo id, TTL ngắn). */
const recentIds = new Map<string, number>();
const DEDUPE_TTL_MS = 60_000;

function rememberId(id: string): boolean {
  const now = Date.now();
  for (const [key, ts] of recentIds) {
    if (now - ts > DEDUPE_TTL_MS) recentIds.delete(key);
  }
  if (recentIds.has(id)) return false;
  recentIds.set(id, now);
  return true;
}

function toListItem(payload: RealTimeNotificationPayload): NotificationItem {
  return {
    id: payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    referenceId: payload.referenceId,
    createdAt: payload.createdAt,
    isRead: false,
    readAt: null,
    categoryName: null,
    thumbnailUrl: null,
  };
}

/** Badge tức thì + REST sync debounce. */
let restSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRestSync(queryClient: QueryClient) {
  if (restSyncTimer) clearTimeout(restSyncTimer);
  restSyncTimer = setTimeout(() => {
    restSyncTimer = null;
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, 500);
}

function refreshCompanyQueueBadge(queryClient: QueryClient, notificationType: string) {
  if (
    !COMPANY_QUEUE_REFRESH_NOTIFICATION_TYPES.includes(
      notificationType as (typeof COMPANY_QUEUE_REFRESH_NOTIFICATION_TYPES)[number]
    )
  ) {
    return;
  }
  void queryClient.invalidateQueries({ queryKey: companyKeys.queueCount() });
  void queryClient.invalidateQueries({ queryKey: [...companyKeys.all, 'queue'] });
}

/**
 * Cache React Query lưu `ApiEnvelope<NotificationsList>` (queryFn),
 * còn `useNotificationsPreview` chỉ `select` → `.data`.
 * Optimistic phải patch `envelope.data`, không ghi đè thành list trần.
 */
function patchEnvelopeList(
  old: ApiEnvelope<NotificationsList> | undefined,
  payload: RealTimeNotificationPayload,
  item: NotificationItem,
  capItems?: number
): ApiEnvelope<NotificationsList> | undefined {
  if (!old?.data) {
    return {
      code: 'SUCCESS',
      message: 'OK',
      status: 200,
      data: {
        items: [item],
        totalCount: 1,
        unreadCount: 1,
      },
    };
  }

  if (old.data.items.some(i => i.id === payload.id)) return old;

  const nextItems =
    capItems != null
      ? [item, ...old.data.items].slice(0, Math.max(capItems, 1))
      : [item, ...old.data.items];

  return {
    ...old,
    data: {
      ...old.data,
      unreadCount: old.data.unreadCount + 1,
      totalCount: old.data.totalCount + 1,
      items: nextItems,
    },
  };
}

function applyReceivedOptimistic(queryClient: QueryClient, payload: RealTimeNotificationPayload) {
  const item = toListItem(payload);

  queryClient.setQueriesData<ApiEnvelope<NotificationsList>>(
    { queryKey: [...notificationKeys.all, 'preview'] },
    old => patchEnvelopeList(old, payload, item, old?.data?.items.length ?? 1)
  );

  queryClient.setQueriesData<ApiEnvelope<NotificationsList>>(
    { queryKey: notificationKeys.lists() },
    old => patchEnvelopeList(old, payload, item)
  );

  scheduleRestSync(queryClient);
}

let lastRestSyncAt = 0;

function syncFromRest(queryClient: QueryClient) {
  const now = Date.now();
  if (now - lastRestSyncAt < 400) return;
  lastRestSyncAt = now;
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

/**
 * @param enabled — chỉ bật khi đã login (có JWT). Flag env nằm trong factory hub.
 */
export function useNotificationRealtime(enabled = true): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const hub = createNotificationHub();
    if (!hub) return;

    const unsubscribe = hub.subscribe(event => {
      if (event.kind === 'connected') {
        syncFromRest(queryClient);
        return;
      }

      if (event.kind === 'received') {
        if (!rememberId(event.notification.id)) return;

        showNotificationRealtimeToast({
          notificationId: event.notification.id,
          title: event.notification.title,
          message: event.notification.message,
        });
        applyReceivedOptimistic(queryClient, event.notification);
        refreshCompanyQueueBadge(queryClient, event.notification.type);
      }
    });

    return unsubscribe;
  }, [enabled, queryClient]);
}
