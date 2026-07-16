import apiService from '@/lib/api/core';
import type {
  MarkAllNotificationsReadResult,
  NotificationPreferences,
  NotificationsList,
  NotificationsListParams,
  UpdateNotificationPreferencesInput,
} from '@/lib/api/models/notification';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

function buildListQuery(
  params?: NotificationsListParams
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.isRead !== undefined) query.isRead = params.isRead;
  return query;
}

/** GET /v1/notifications — danh sách thông báo của tôi. */
export async function adaptNotificationsList(
  params?: NotificationsListParams
): Promise<ApiEnvelope<NotificationsList>> {
  const res = await apiService.get<ApiEnvelope<NotificationsList>>(
    '/v1/notifications',
    buildListQuery(params)
  );
  return res.data;
}

/** PUT /v1/notifications/{id}/read — đánh dấu đã đọc. */
export async function adaptMarkNotificationRead(id: string): Promise<ApiEnvelope<null>> {
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/notifications/${encodeURIComponent(id)}/read`
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** PUT /v1/notifications/read-all — đánh dấu tất cả đã đọc. */
export async function adaptMarkAllNotificationsRead(): Promise<
  ApiEnvelope<MarkAllNotificationsReadResult>
> {
  const res = await apiService.put<ApiEnvelope<MarkAllNotificationsReadResult>>(
    '/v1/notifications/read-all'
  );
  return res.data;
}

/** GET /v1/notifications/preferences — preference push/email theo type. */
export async function adaptNotificationPreferences(): Promise<
  ApiEnvelope<NotificationPreferences>
> {
  const res = await apiService.get<ApiEnvelope<NotificationPreferences>>(
    '/v1/notifications/preferences'
  );
  return res.data;
}

/** PUT /v1/notifications/preferences — cập nhật preference. */
export async function adaptUpdateNotificationPreferences(
  body: UpdateNotificationPreferencesInput
): Promise<ApiEnvelope<null>> {
  const res = await apiService.put<ApiEnvelope<unknown>>('/v1/notifications/preferences', body);
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
