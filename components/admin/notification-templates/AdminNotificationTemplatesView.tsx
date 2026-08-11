'use client';

import { NotificationTemplateFormDialog } from '@/components/admin/notification-templates/NotificationTemplateFormDialog';
import { NotificationTemplateTestDialog } from '@/components/admin/notification-templates/NotificationTemplateTestDialog';
import { AdminSearchField } from '@/components/admin/shared/AdminSearchField';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  ADMIN_TABLE_PAGINATION_FOOTER,
  ADMIN_TABLE_PAGINATION_META,
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
  useDeleteNotificationTemplate,
  useNotificationTemplateDetail,
  useNotificationTemplatesList,
  usePublishNotificationTemplate,
  useTestNotificationTemplate,
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
import { resolveApiToastMessage } from '@/utils/apiToastMessage';
import {
  formatNotificationTemplateDate,
  getNotificationTemplateMutationError,
} from '@/utils/notificationTemplateUi';
import { Loader2, Pencil, Power, Send, Upload } from 'lucide-react';
import { useCallback, useMemo, useState, type CSSProperties } from 'react';
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
  { key: 'template', label: 'Mẫu', className: 'w-[22%]' },
  { key: 'channel', label: 'Kênh', className: 'w-[10%]' },
  { key: 'type', label: 'Loại', className: 'w-[14%]' },
  { key: 'publish', label: 'Xuất bản', className: 'w-[10%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[10%]' },
  { key: 'updated', label: 'Cập nhật', className: 'w-[12%]' },
  { key: 'actions', label: 'Hành động', className: 'w-[18%]' },
];

export function AdminNotificationTemplatesView() {
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState<NotificationTemplateListItem | null>(null);

  const commitSearch = useCallback((q: string) => {
    setSearchQ(q);
    setPage(1);
  }, []);

  const listParams = useMemo<NotificationTemplatesListParams>(() => {
    const params: NotificationTemplatesListParams = {
      page,
      pageSize: NOTIFICATION_TEMPLATE_PAGE_SIZE,
    };
    if (channel) params.channel = channel;
    if (publishFilter === 'published') params.isPublished = true;
    if (publishFilter === 'draft') params.isPublished = false;
    if (searchQ.trim()) params.search = searchQ.trim();
    return params;
  }, [page, channel, publishFilter, searchQ]);

  const listQuery = useNotificationTemplatesList(listParams);
  const detailQuery = useNotificationTemplateDetail(editId, Boolean(editId));
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();
  const publishMutation = usePublishNotificationTemplate();
  const testMutation = useTestNotificationTemplate();

  const items = (listQuery.data?.items ?? []).filter(i => i.isActive);
  const pagination = listQuery.data?.pagination;
  const publishedCount = items.filter(i => i.isPublished).length;
  const draftCount = items.filter(i => !i.isPublished).length;

  const busyRowId =
    (deleteMutation.isPending && deleteMutation.variables) ||
    (publishMutation.isPending && publishMutation.variables?.id) ||
    (testMutation.isPending && testMutation.variables?.id) ||
    null;

  const onUpdate = (values: NotificationTemplateWriteInput) => {
    if (!editId) return;
    updateMutation.mutate(
      { id: editId, body: values },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật mẫu (đã về nháp).');
          setEditId(null);
        },
        onError: err =>
          toast.error(getNotificationTemplateMutationError(err, 'Không thể cập nhật mẫu.')),
      }
    );
  };

  const onTogglePublish = (item: NotificationTemplateListItem) => {
    const next = !item.isPublished;
    publishMutation.mutate(
      { id: item.id, body: { publish: next } },
      {
        onSuccess: env => {
          toast.success(env.message || (next ? 'Đã xuất bản mẫu.' : 'Đã gỡ xuất bản mẫu.'));
        },
        onError: err =>
          toast.error(
            getNotificationTemplateMutationError(
              err,
              next ? 'Không thể xuất bản.' : 'Không thể gỡ xuất bản.'
            )
          ),
      }
    );
  };

  const onDeactivate = (item: NotificationTemplateListItem) => {
    const ok = window.confirm(
      `Vô hiệu hóa mẫu "${item.templateKey}"?\nMẫu sẽ không còn dùng được.`
    );
    if (!ok) return;
    deleteMutation.mutate(item.id, {
      onSuccess: env => {
        toast.success(env.message || 'Đã vô hiệu hóa mẫu.');
      },
      onError: err =>
        toast.error(getNotificationTemplateMutationError(err, 'Không thể vô hiệu hóa mẫu.')),
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
      ? getNotificationTemplateMutationError(detailQuery.error, 'Không tải được chi tiết mẫu.')
      : null;

  const listErrorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được danh sách mẫu thông báo.';

  const emptyRowCount = Math.max(0, NOTIFICATION_TEMPLATE_PAGE_SIZE - items.length);
  const fillViewportRows =
    !listQuery.isPending && !listQuery.isError && items.length === NOTIFICATION_TEMPLATE_PAGE_SIZE;
  const rowSlotClass = fillViewportRows ? 'h-[calc((100%-2.5rem)/var(--template-rows,8))]' : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground sm:max-w-md">
          Quản lý mẫu push/email — chỉnh sửa rồi xuất bản để hệ thống dùng.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            Trang:{' '}
            <strong className="font-semibold tabular-nums text-foreground">{items.length}</strong>
          </span>
          <span>
            Xuất bản:{' '}
            <strong className="font-semibold tabular-nums text-emerald-800">
              {publishedCount}
            </strong>
          </span>
          <span>
            Nháp:{' '}
            <strong className="font-semibold tabular-nums text-amber-800">{draftCount}</strong>
          </span>
          {pagination ? (
            <span>
              Tổng:{' '}
              <strong className="font-semibold tabular-nums text-foreground">
                {pagination.totalItems.toLocaleString('vi-VN')}
              </strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div
          className="flex h-10 shrink-0 items-center rounded-lg border border-border bg-background p-0.5"
          role="group"
          aria-label="Lọc trạng thái xuất bản"
        >
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'published', label: 'Đã xuất bản' },
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
                'h-full rounded-md px-3 text-xs font-medium transition',
                publishFilter === tab.id
                  ? 'bg-emerald-600/10 text-emerald-900'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AdminSearchField
          label="Tìm mẫu"
          value={searchQ}
          onCommit={commitSearch}
          placeholder="Tên, mã mẫu, loại..."
          className="h-10 min-w-[12rem] flex-1 gap-0 self-center sm:max-w-sm [&>div]:h-10 [&>label]:sr-only"
        />

        <label className="flex h-10 shrink-0 items-center gap-2 text-xs">
          <span className="text-muted-foreground">Kênh</span>
          <Select
            value={channel || 'all'}
            onValueChange={v => {
              setChannel(v === 'all' ? '' : v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="h-10 w-[9rem] rounded-lg text-xs"
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

      <div
        className={cn(
          ADMIN_TABLE_SHELL,
          'flex flex-col overflow-hidden border-t border-slate-200',
          fillViewportRows ? 'min-h-0 flex-1' : 'shrink-0'
        )}
      >
        <div
          className={cn(
            ADMIN_TABLE_SCROLL,
            fillViewportRows
              ? 'min-h-0 flex-1 overflow-x-auto overflow-y-hidden [&>div]:h-full'
              : 'overflow-x-auto'
          )}
          style={
            fillViewportRows
              ? ({ '--template-rows': NOTIFICATION_TEMPLATE_PAGE_SIZE } as CSSProperties)
              : undefined
          }
        >
          <Table className={cn(ADMIN_TABLE_CLASS, fillViewportRows && 'h-full table-fixed')}>
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
            <TableBody className={fillViewportRows ? 'h-[calc(100%-2.5rem)]' : undefined}>
              {listQuery.isPending ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, rowSlotClass)}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-full px-6 py-3 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-slate-400" aria-hidden />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, rowSlotClass)}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-full px-6 py-3 text-center">
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
                <TableRow
                  className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent', rowSlotClass)}
                >
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-full px-6 py-3 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-sm text-slate-500">
                      <SaveIcon size={24} className="opacity-30" />
                      <span>Không có mẫu phù hợp</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {items.map(item => {
                    const rowBusy = busyRowId === item.id;
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          ADMIN_TABLE_ROW_BORDER,
                          rowSlotClass,
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
                          <p className="text-sm font-semibold leading-tight text-foreground">
                            {item.titleVi}
                          </p>
                          <p className="font-mono text-[10px] leading-tight text-muted-foreground">
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
                            {item.isPublished ? 'Đã xuất bản' : 'Nháp'}
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
                            Hoạt động
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
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={rowBusy || !item.isActive}
                              onClick={() => setTestTarget(item)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50"
                              aria-label="Thử gửi"
                              title="Thử gửi"
                            >
                              {rowBusy && testMutation.variables?.id === item.id ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Send className="size-3.5" aria-hidden />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy}
                              onClick={() => setEditId(item.id)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50"
                              aria-label="Sửa mẫu"
                              title="Sửa"
                            >
                              <Pencil className="size-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy || !item.isActive}
                              onClick={() => onTogglePublish(item)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-50"
                              aria-label={item.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                              title={item.isPublished ? 'Gỡ xuất bản' : 'Xuất bản'}
                            >
                              {rowBusy && publishMutation.variables?.id === item.id ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Upload className="size-3.5" aria-hidden />
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy || !item.isActive}
                              onClick={() => onDeactivate(item)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-red-200 text-red-800 hover:bg-red-50 disabled:opacity-50"
                              aria-label="Vô hiệu hóa mẫu"
                              title="Vô hiệu"
                            >
                              {rowBusy && deleteMutation.variables === item.id ? (
                                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                              ) : (
                                <Power className="size-3.5" aria-hidden />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {fillViewportRows && emptyRowCount > 0
                    ? Array.from({ length: emptyRowCount }, (_, index) => (
                        <TableRow
                          key={`empty-row-${index}`}
                          className={cn(
                            ADMIN_TABLE_ROW_BORDER,
                            rowSlotClass,
                            'hover:bg-transparent'
                          )}
                          aria-hidden
                        >
                          <TableCell colSpan={COLUMN_DEFS.length} className="p-0" />
                        </TableRow>
                      ))
                    : null}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div
            className={cn(
              ADMIN_TABLE_PAGINATION_FOOTER,
              'shrink-0 border-t border-slate-200 py-1.5',
              fillViewportRows && 'mt-auto'
            )}
          >
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="w-auto"
              />
            ) : null}
            <p className={ADMIN_TABLE_PAGINATION_META}>
              {pagination.totalItems.toLocaleString('vi-VN')} mẫu
            </p>
          </div>
        ) : null}
      </div>

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

      <NotificationTemplateTestDialog
        open={Boolean(testTarget)}
        templateTitle={testTarget?.titleVi ?? ''}
        busy={testMutation.isPending}
        onClose={() => {
          if (!testMutation.isPending) setTestTarget(null);
        }}
        onSubmit={email => {
          if (!testTarget) return;
          testMutation.mutate(
            { id: testTarget.id, body: { recipientEmail: email } },
            {
              onSuccess: env => {
                toast.success(
                  resolveApiToastMessage(
                    env.data?.message ?? env.message,
                    'Đã gửi thử mẫu thông báo.'
                  )
                );
                setTestTarget(null);
              },
              onError: err =>
                toast.error(getNotificationTemplateMutationError(err, 'Không thể gửi thử mẫu.')),
            }
          );
        }}
      />
    </div>
  );
}
