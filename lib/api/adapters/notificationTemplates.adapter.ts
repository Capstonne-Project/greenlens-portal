import type {
  CreateNotificationTemplateDataDto,
  NotificationTemplateDetailDto,
  NotificationTemplateWriteBodyDto,
  NotificationTemplatesListDataDto,
  NotificationTemplatesListParamsDto,
  PublishNotificationTemplateBodyDto,
} from '@/lib/api/dto/notificationTemplate.dto';
import {
  mapCreateNotificationTemplateDataDto,
  mapNotificationTemplateDetailDto,
  mapNotificationTemplatesListDataDto,
} from '@/lib/api/mappers/notificationTemplate.mapper';
import type {
  CreateNotificationTemplateResult,
  NotificationTemplateDetail,
  NotificationTemplateWriteInput,
  NotificationTemplatesList,
  NotificationTemplatesListParams,
  PublishNotificationTemplateInput,
} from '@/lib/api/models/notificationTemplate';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

function buildQuery(
  params?: NotificationTemplatesListParamsDto
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.channel?.trim()) query.channel = params.channel.trim();
  if (params?.isPublished === true) query.isPublished = true;
  if (params?.isPublished === false) query.isPublished = false;
  return query;
}

function toWriteBody(body: NotificationTemplateWriteInput): NotificationTemplateWriteBodyDto {
  return {
    templateKey: body.templateKey.trim(),
    titleVi: body.titleVi.trim(),
    bodyVi: body.bodyVi.trim(),
    titleEn: body.titleEn.trim(),
    bodyEn: body.bodyEn.trim(),
    channel: body.channel.trim(),
    type: body.type.trim(),
  };
}

/** GET /v1/admin/notification-templates */
export async function adaptNotificationTemplatesList(
  params?: NotificationTemplatesListParams
): Promise<ApiEnvelope<NotificationTemplatesList>> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 20);
  const query = buildQuery({
    page,
    pageSize,
    channel: params?.channel,
    isPublished: params?.isPublished,
  });

  const res = await apiService.get<ApiEnvelope<NotificationTemplatesListDataDto>>(
    '/v1/admin/notification-templates',
    query
  );

  return mapApiEnvelope(res.data, data =>
    mapNotificationTemplatesListDataDto(data, page, pageSize)
  );
}

/** GET /v1/admin/notification-templates/{id} */
export async function adaptNotificationTemplateDetail(
  id: string
): Promise<ApiEnvelope<NotificationTemplateDetail>> {
  const res = await apiService.get<ApiEnvelope<NotificationTemplateDetailDto>>(
    `/v1/admin/notification-templates/${encodeURIComponent(id)}`
  );
  return mapApiEnvelope(res.data, mapNotificationTemplateDetailDto);
}

/** POST /v1/admin/notification-templates */
export async function adaptCreateNotificationTemplate(
  body: NotificationTemplateWriteInput
): Promise<ApiEnvelope<CreateNotificationTemplateResult>> {
  const res = await apiService.post<ApiEnvelope<CreateNotificationTemplateDataDto>>(
    '/v1/admin/notification-templates',
    toWriteBody(body)
  );
  return mapApiEnvelope(res.data, mapCreateNotificationTemplateDataDto);
}

/** PUT /v1/admin/notification-templates/{id} — BE tự set IsPublished = false */
export async function adaptUpdateNotificationTemplate(
  id: string,
  body: NotificationTemplateWriteInput
): Promise<ApiEnvelope<null>> {
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/admin/notification-templates/${encodeURIComponent(id)}`,
    toWriteBody(body)
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** DELETE /v1/admin/notification-templates/{id} — deactivate */
export async function adaptDeleteNotificationTemplate(id: string): Promise<ApiEnvelope<null>> {
  const res = await apiService.delete<ApiEnvelope<unknown>>(
    `/v1/admin/notification-templates/${encodeURIComponent(id)}`
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}

/** PATCH /v1/admin/notification-templates/{id}/publish */
export async function adaptPublishNotificationTemplate(
  id: string,
  body: PublishNotificationTemplateInput
): Promise<ApiEnvelope<null>> {
  const payload: PublishNotificationTemplateBodyDto = { publish: body.publish };
  const res = await apiService.patch<ApiEnvelope<unknown>>(
    `/v1/admin/notification-templates/${encodeURIComponent(id)}/publish`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
