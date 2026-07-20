/**
 * L2 — Notifications (BR-NTF-001).
 */
import {
  adaptMarkAllNotificationsRead,
  adaptMarkNotificationRead,
  adaptNotificationPreferences,
  adaptNotificationsList,
  adaptUpdateNotificationPreferences,
} from '@/lib/api/adapters/notification.adapter';
import type {
  MarkAllNotificationsReadResult,
  NotificationPreferences,
  NotificationsList,
  NotificationsListParams,
  UpdateNotificationPreferencesInput,
} from '@/lib/api/models/notification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  MarkAllNotificationsReadResult,
  NotificationItem,
  NotificationPreference,
  NotificationPreferences,
  NotificationsList,
  NotificationsListParams,
  NotificationType,
  UpdateNotificationPreferencesInput,
} from '@/lib/api/models/notification';

/** GET /v1/notifications */
export async function fetchNotifications(
  params?: NotificationsListParams
): Promise<ApiEnvelope<NotificationsList>> {
  return adaptNotificationsList(params);
}

/** PUT /v1/notifications/{id}/read */
export async function markNotificationRead(id: string): Promise<ApiEnvelope<null>> {
  return adaptMarkNotificationRead(id);
}

/** PUT /v1/notifications/read-all */
export async function markAllNotificationsRead(): Promise<
  ApiEnvelope<MarkAllNotificationsReadResult>
> {
  return adaptMarkAllNotificationsRead();
}

/** GET /v1/notifications/preferences */
export async function fetchNotificationPreferences(): Promise<
  ApiEnvelope<NotificationPreferences>
> {
  return adaptNotificationPreferences();
}

/** PUT /v1/notifications/preferences */
export async function updateNotificationPreferences(
  body: UpdateNotificationPreferencesInput
): Promise<ApiEnvelope<null>> {
  return adaptUpdateNotificationPreferences(body);
}

const notificationService = {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
};

export default notificationService;
