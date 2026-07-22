'use client';

import { NotificationTemplateFormDialog } from '@/components/admin/notification-templates/NotificationTemplateFormDialog';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Loader2, Pencil, Plus, Power, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type PublishFilter = 'all' | 'published' | 'draft';

type NotificationTemplateColumnKey =
  | 'template'
  | 'channel'
  | 'type'
  | 'publish'
  | 'status'
  | 'updated'
  | 'actions';

const FIRST_COL: NotificationTemplateColumnKey = 'template';
const LAST_COL: NotificationTemplateColumnKey = 'actions';

function columnPad(colKey: NotificationTemplateColumnKey, layer: 'head' | 'body' = 'body') {
  if (colKey === FIRST_COL) return adminTableCellPad('first', layer);
  if (colKey === LAST_COL) return adminTableCellPad('last', layer);
  return adminTableCellPad('middle', layer);
}

const COLUMN_DEFS: {
  key: NotificationTemplateColumnKey;
  label: string;
  className?: string;
}[] = [
  { key: 'template', label: 'Template', className: 'w-[22%]' },
  { key: 'channel', label: 'Kênh', className: 'w-[10%]' },
  { key: 'type', label: 'Loại', className: 'w-[14%]' },
  { key: 'publish', label: 'Publish', className: 'w-[10%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[10%]' },
  { key: 'updated', label: 'Cập nhật', className: 'w-[12%]' },
  { key: 'actions', label: 'Hành động', className: 'w-[18%]' },
];

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
          <Select
            value={channel || 'all'}
            onValueChange={v => {
              setChannel(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-9 w-[9.5rem] rounded-lg"
              aria-label="Lọc theo kênh thông báo"
            >
              <SelectValue placeholder="Tất cả" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="all">Tất cả</SelectItem>
              {NOTIFICATION_TEMPLATE_CHANNELS.map(ch => (
                <SelectItem key={ch} value={ch}>
                  {notificationChannelLabel(ch)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      columnPad(col.key, 'head'),
                      ADMIN_TABLE_HEAD_CELL,
                      col.key === LAST_COL && 'text-right',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isPending ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" aria-hidden />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{listErrorMessage}</p>
                    <button
                      type="button"
                      onClick={() => listQuery.refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có template phù hợp</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => {
                  const rowBusy = busyRowId === item.id;
                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        ADMIN_TABLE_ROW_BORDER,
                        'transition-[opacity,background-color] hover:bg-sky-50/40'
                      )}
                    >
                      <TableCell
                        className={cn(
                          columnPad('template', 'body'),
                          'align-middle',
                          COLUMN_DEFS[0].className
                        )}
                      >
                        <p className="font-semibold text-foreground">{item.titleVi}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {item.templateKey}
                        </p>
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('channel', 'body'),
                          'align-middle',
                          COLUMN_DEFS[1].className
                        )}
                      >
                        {notificationChannelLabel(item.channel)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('type', 'body'),
                          'max-w-0 align-middle',
                          COLUMN_DEFS[2].className
                        )}
                      >
                        <span className="line-clamp-1" title={item.type}>
                          {notificationTypeLabel(item.type)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('publish', 'body'),
                          'align-middle',
                          COLUMN_DEFS[3].className
                        )}
                      >
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
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('status', 'body'),
                          'align-middle',
                          COLUMN_DEFS[4].className
                        )}
                      >
                        <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
                          Active
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('updated', 'body'),
                          'whitespace-nowrap align-middle text-muted-foreground',
                          COLUMN_DEFS[5].className
                        )}
                      >
                        {formatNotificationTemplateDate(item.updatedAt ?? item.createdAt)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          columnPad('actions', 'body'),
                          'align-middle text-right',
                          COLUMN_DEFS[6].className
                        )}
                      >
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
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

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
