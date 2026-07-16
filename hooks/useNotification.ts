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
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationsListParams) => [...notificationKeys.lists(), params] as const,
  unreadPreview: () => [...notificationKeys.all, 'preview'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

const STALE_MS = 60 * 1000;

export function useNotificationsList(params: NotificationsListParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    select: (envelope: ApiEnvelope<NotificationsList>) => envelope.data,
    staleTime: STALE_MS,
  });
}

/** Header bell — page 1, unread badge + recent items. */
export function useNotificationsPreview(pageSize = 8) {
  return useQuery({
    queryKey: notificationKeys.unreadPreview(),
    queryFn: () => fetchNotifications({ page: 1, pageSize }),
    select: (envelope: ApiEnvelope<NotificationsList>) => envelope.data,
    staleTime: STALE_MS,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => fetchNotificationPreferences(),
    select: (envelope: ApiEnvelope<NotificationPreferences>) => envelope.data,
    staleTime: 3 * 60 * 1000,
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
