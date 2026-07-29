'use client';

import {
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '@/lib/api/services/fetchNotification';
import type {
  NotificationPreferences,
  NotificationsList,
  NotificationsListParams,
  UpdateNotificationPreferencesInput,
} from '@/lib/api/models/notification';
import { NOTIFICATION_PAGE_SIZE } from '@/lib/api/models/notification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationsListParams) => [...notificationKeys.lists(), params] as const,
  preview: (pageSize: number) => [...notificationKeys.all, 'preview', pageSize] as const,
  /** @deprecated dùng `preview(pageSize)` — giữ alias tránh phá bell cũ. */
  unreadPreview: () => notificationKeys.preview(8),
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

const STALE_MS = 60 * 1000;

type ListQueryOptions = {
  enabled?: boolean;
};

/** GET /v1/notifications — list có page / pageSize / isRead. */
export function useNotificationsList(params: NotificationsListParams, options?: ListQueryOptions) {
  const normalized: NotificationsListParams = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? NOTIFICATION_PAGE_SIZE,
    isRead: params.isRead,
  };

  return useQuery({
    queryKey: notificationKeys.list(normalized),
    queryFn: () => fetchNotifications(normalized),
    select: (envelope: ApiEnvelope<NotificationsList>) => envelope.data,
    staleTime: STALE_MS,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Badge / bell preview — page 1.
 * Không truyền isRead → BE trả mixed list + unreadCount.
 */
export function useNotificationsPreview(pageSize = 8, options?: ListQueryOptions) {
  const size = pageSize > 0 ? pageSize : NOTIFICATION_PAGE_SIZE;
  return useQuery({
    queryKey: notificationKeys.preview(size),
    queryFn: () => fetchNotifications({ page: 1, pageSize: size }),
    select: (envelope: ApiEnvelope<NotificationsList>) => envelope.data,
    staleTime: STALE_MS,
    enabled: options?.enabled ?? true,
  });
}

export function useNotificationPreferences(options?: ListQueryOptions) {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => fetchNotificationPreferences(),
    select: (envelope: ApiEnvelope<NotificationPreferences>) => envelope.data,
    staleTime: 3 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateNotificationPreferencesInput) => updateNotificationPreferences(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
