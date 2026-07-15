'use client';

import { NotificationTemplateFormDialog } from '@/components/admin/notification-templates/NotificationTemplateFormDialog';
import {
  useCreateNotificationTemplate,
  useDeleteNotificationTemplate,
  useNotificationTemplateDetail,
  useNotificationTemplatesList,
  usePublishNotificationTemplate,
  useUpdateNotificationTemplate,
} from '@/hooks/useNotificationTemplates';
import type {
  NotificationTemplateListItem,
  NotificationTemplateWriteInput,
  NotificationTemplatesListParams,
} from '@/lib/api/models/notificationTemplate';
import {
  NOTIFICATION_TEMPLATE_CHANNELS,
  NOTIFICATION_TEMPLATE_PAGE_SIZE,
  notificationChannelLabel,
  notificationTypeLabel,
} from '@/lib/constants/notificationTemplates';
import { cn } from '@/lib/utils';
import {
  formatNotificationTemplateDate,
  getNotificationTemplateMutationError,
} from '@/utils/notificationTemplateUi';
import { AlertTriangle, Bell, Loader2, Pencil, Plus, Power, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type PublishFilter = 'all' | 'published' | 'draft';

export function AdminNotificationTemplatesView() {
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const listParams = useMemo<NotificationTemplatesListParams>(() => {
    const params: NotificationTemplatesListParams = {
      page,
      pageSize: NOTIFICATION_TEMPLATE_PAGE_SIZE,
    };
    if (channel) params.channel = channel;
    if (publishFilter === 'published') params.isPublished = true;
    if (publishFilter === 'draft') params.isPublished = false;
    return params;
  }, [page, channel, publishFilter]);

  const listQuery = useNotificationTemplatesList(listParams);
  const detailQuery = useNotificationTemplateDetail(editId, Boolean(editId));
  const createMutation = useCreateNotificationTemplate();
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();
  const publishMutation = usePublishNotificationTemplate();

  const items = (listQuery.data?.items ?? []).filter(i => i.isActive);
  const pagination = listQuery.data?.pagination;
  const publishedCount = items.filter(i => i.isPublished).length;
  const draftCount = items.filter(i => !i.isPublished).length;

  const busyRowId =
    (deleteMutation.isPending && deleteMutation.variables) ||
    (publishMutation.isPending && publishMutation.variables?.id) ||
    null;

  const onCreate = (values: NotificationTemplateWriteInput) => {
    createMutation.mutate(values, {
      onSuccess: env => {
        toast.success(env.message || 'Đã tạo template nháp.');
        setCreateOpen(false);
      },
      onError: err =>
        toast.error(getNotificationTemplateMutationError(err, 'Không thể tạo template.')),
    });
  };

  const onUpdate = (values: NotificationTemplateWriteInput) => {
    if (!editId) return;
    updateMutation.mutate(
      { id: editId, body: values },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật template (đã về nháp).');
          setEditId(null);
        },
        onError: err =>
          toast.error(getNotificationTemplateMutationError(err, 'Không thể cập nhật template.')),
      }
    );
  };

  const onTogglePublish = (item: NotificationTemplateListItem) => {
    const next = !item.isPublished;
    publishMutation.mutate(
      { id: item.id, body: { publish: next } },
      {
        onSuccess: env => {
          toast.success(env.message || (next ? 'Đã publish template.' : 'Đã unpublish template.'));
        },
        onError: err =>
          toast.error(
            getNotificationTemplateMutationError(
              err,
              next ? 'Không thể publish.' : 'Không thể unpublish.'
            )
          ),
      }
    );
  };

  const onDeactivate = (item: NotificationTemplateListItem) => {
    const ok = window.confirm(
      `Vô hiệu hóa template "${item.templateKey}"?\nTemplate sẽ không còn dùng được.`
    );
    if (!ok) return;
    deleteMutation.mutate(item.id, {
      onSuccess: env => {
        toast.success(env.message || 'Đã vô hiệu hóa template.');
      },
      onError: err =>
        toast.error(getNotificationTemplateMutationError(err, 'Không thể vô hiệu hóa template.')),
    });
  };

  const editInitial: NotificationTemplateWriteInput | null = detailQuery.data
    ? {
        templateKey: detailQuery.data.templateKey,
        titleVi: detailQuery.data.titleVi,
        bodyVi: detailQuery.data.bodyVi,
        titleEn: detailQuery.data.titleEn,
        bodyEn: detailQuery.data.bodyEn,
        channel: detailQuery.data.channel,
        type: detailQuery.data.type,
      }
    : null;

  const detailErrorMessage =
    detailQuery.isError && editId
      ? getNotificationTemplateMutationError(detailQuery.error, 'Không tải được chi tiết template.')
      : null;

  const listErrorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được danh sách template.';

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Quản lý mẫu thông báo (push/email). Tạo nháp → Publish để hệ thống dùng. Sửa xong sẽ tự về
          nháp.
        </p>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-medium text-white hover:bg-emerald-900"
        >
          <Plus className="size-4" aria-hidden />
          Tạo template
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Trang hiện tại',
            value: String(items.length),
            hint: pagination ? `${pagination.totalItems} tổng` : 'Đang tải…',
          },
          {
            label: 'Đã publish (trang)',
            value: String(publishedCount),
            hint: 'Đang dùng',
          },
          {
            label: 'Nháp (trang)',
            value: String(draftCount),
            hint: 'Chưa dùng',
          },
        ].map(card => (
          <article
            key={card.label}
            className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'published', label: 'Đã publish' },
              { id: 'draft', label: 'Nháp' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPublishFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                publishFilter === tab.id
                  ? 'border-emerald-600/30 bg-emerald-600/10 text-emerald-900'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Kênh</span>
          <select
            value={channel}
            onChange={e => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <option value="">Tất cả</option>
            {NOTIFICATION_TEMPLATE_CHANNELS.map(ch => (
              <option key={ch} value={ch}>
                {notificationChannelLabel(ch)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        {listQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải mẫu thông báo…
          </div>
        ) : listQuery.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <AlertTriangle className="size-8 text-destructive" aria-hidden />
            <p className="text-sm text-destructive">{listErrorMessage}</p>
            <button
              type="button"
              onClick={() => listQuery.refetch()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center text-muted-foreground">
            <Bell className="size-8 text-emerald-700/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">Không có template phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Template</th>
                  <th className="px-4 py-3 font-medium">Kênh</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Publish</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Cập nhật</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const rowBusy = busyRowId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{item.titleVi}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.templateKey}
                        </p>
                      </td>
                      <td className="px-4 py-3">{notificationChannelLabel(item.channel)}</td>
                      <td className="px-4 py-3">
                        <span className="line-clamp-1" title={item.type}>
                          {notificationTypeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            item.isPublished
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                              : 'border-amber-200 bg-amber-50 text-amber-950'
                          )}
                        >
                          {item.isPublished ? 'Published' : 'Nháp'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          Active
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatNotificationTemplateDate(item.updatedAt ?? item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={rowBusy}
                            onClick={() => setEditId(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            <Pencil className="size-3.5" aria-hidden />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy || !item.isActive}
                            onClick={() => onTogglePublish(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            {rowBusy && publishMutation.variables?.id === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Upload className="size-3.5" aria-hidden />
                            )}
                            {item.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            disabled={rowBusy || !item.isActive}
                            onClick={() => onDeactivate(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                          >
                            {rowBusy && deleteMutation.variables === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Power className="size-3.5" aria-hidden />
                            )}
                            Vô hiệu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Trang {pagination.page}/{pagination.totalPages} · {pagination.totalItems} template
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrev || listQuery.isFetching}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext || listQuery.isFetching}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <NotificationTemplateFormDialog
        open={createOpen}
        mode="create"
        busy={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreate}
      />

      <NotificationTemplateFormDialog
        open={Boolean(editId)}
        mode="edit"
        initial={editInitial}
        busy={updateMutation.isPending}
        loadingDetail={detailQuery.isPending && !detailQuery.data}
        detailError={detailErrorMessage}
        onClose={() => setEditId(null)}
        onSubmit={onUpdate}
        onRetryDetail={() => void detailQuery.refetch()}
      />
    </div>
  );
}
