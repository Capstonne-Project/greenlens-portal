'use client';

import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  fetchNotificationTemplateDetail,
  fetchNotificationTemplates,
  publishNotificationTemplate,
  updateNotificationTemplate,
  type NotificationTemplateWriteInput,
  type NotificationTemplatesList,
  type NotificationTemplatesListParams,
  type PublishNotificationTemplateInput,
} from '@/lib/api/services/fetchNotificationTemplate';
import type { ApiEnvelope } from '@/lib/api/types/envelope';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const notificationTemplateKeys = {
  all: ['admin', 'notification-templates'] as const,
  list: (params: NotificationTemplatesListParams) =>
    [...notificationTemplateKeys.all, 'list', params] as const,
  detail: (id: string) => [...notificationTemplateKeys.all, 'detail', id] as const,
};

const LIST_STALE_MS = 3 * 60 * 1000;

export function useNotificationTemplatesList(params: NotificationTemplatesListParams) {
  return useQuery({
    queryKey: notificationTemplateKeys.list(params),
    queryFn: () => fetchNotificationTemplates(params),
    select: (envelope: ApiEnvelope<NotificationTemplatesList>) => envelope.data,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useNotificationTemplateDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: notificationTemplateKeys.detail(id ?? ''),
    queryFn: () => fetchNotificationTemplateDetail(id!),
    select: envelope => envelope.data,
    enabled: Boolean(id) && enabled,
    staleTime: LIST_STALE_MS,
  });
}

export function useCreateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationTemplateWriteInput) => createNotificationTemplate(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.all });
    },
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: NotificationTemplateWriteInput }) =>
      updateNotificationTemplate(id, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.all });
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.detail(vars.id) });
    },
  });
}

export function useDeleteNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotificationTemplate(id),
    onSuccess: (_data, id) => {
      qc.setQueriesData<ApiEnvelope<NotificationTemplatesList>>(
        { queryKey: [...notificationTemplateKeys.all, 'list'] },
        old => {
          if (!old?.data?.items) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.filter(item => item.id !== id),
            },
          };
        }
      );
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.all });
    },
  });
}

export function usePublishNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PublishNotificationTemplateInput }) =>
      publishNotificationTemplate(id, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.all });
      void qc.invalidateQueries({ queryKey: notificationTemplateKeys.detail(vars.id) });
    },
  });
}
