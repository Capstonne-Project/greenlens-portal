/**
 * L2 — Admin notification templates (thin).
 */
import {
  adaptCreateNotificationTemplate,
  adaptDeleteNotificationTemplate,
  adaptNotificationTemplateDetail,
  adaptNotificationTemplatesList,
  adaptPublishNotificationTemplate,
  adaptUpdateNotificationTemplate,
} from '@/lib/api/adapters/notificationTemplates.adapter';
import type {
  CreateNotificationTemplateResult,
  NotificationTemplateDetail,
  NotificationTemplateWriteInput,
  NotificationTemplatesList,
  NotificationTemplatesListParams,
  PublishNotificationTemplateInput,
} from '@/lib/api/models/notificationTemplate';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CreateNotificationTemplateResult,
  NotificationTemplateDetail,
  NotificationTemplateListItem,
  NotificationTemplateWriteInput,
  NotificationTemplatesList,
  NotificationTemplatesListParams,
  PublishNotificationTemplateInput,
} from '@/lib/api/models/notificationTemplate';

export async function fetchNotificationTemplates(
  params?: NotificationTemplatesListParams
): Promise<ApiEnvelope<NotificationTemplatesList>> {
  return adaptNotificationTemplatesList(params);
}

export async function fetchNotificationTemplateDetail(
  id: string
): Promise<ApiEnvelope<NotificationTemplateDetail>> {
  return adaptNotificationTemplateDetail(id);
}

export async function createNotificationTemplate(
  body: NotificationTemplateWriteInput
): Promise<ApiEnvelope<CreateNotificationTemplateResult>> {
  return adaptCreateNotificationTemplate(body);
}

export async function updateNotificationTemplate(
  id: string,
  body: NotificationTemplateWriteInput
): Promise<ApiEnvelope<null>> {
  return adaptUpdateNotificationTemplate(id, body);
}

export async function deleteNotificationTemplate(id: string): Promise<ApiEnvelope<null>> {
  return adaptDeleteNotificationTemplate(id);
}

export async function publishNotificationTemplate(
  id: string,
  body: PublishNotificationTemplateInput
): Promise<ApiEnvelope<null>> {
  return adaptPublishNotificationTemplate(id, body);
}

export default {
  fetchNotificationTemplates,
  fetchNotificationTemplateDetail,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  publishNotificationTemplate,
};
