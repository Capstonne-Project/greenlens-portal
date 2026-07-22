'use client';

import { GamificationConfigEditDialog } from '@/components/admin/gamification-configs/GamificationConfigEditDialog';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import SaveIcon from '@/components/ui/save-icon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useGamificationConfigsList,
  useUpdateGamificationConfig,
} from '@/hooks/useGamificationConfigs';
import type { GamificationConfig } from '@/lib/api/models/gamificationConfig';
import { gamificationActionLabel } from '@/lib/constants/gamificationConfigs';
import { cn } from '@/lib/utils';
import {
  formatGamificationDate,
  formatGamificationPoints,
  getGamificationConfigMutationError,
} from '@/utils/gamificationConfigUi';
import { Loader2, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type GamificationColumnKey = 'action' | 'points' | 'description' | 'status' | 'updated' | 'actions';

const FIRST_COL: GamificationColumnKey = 'action';
const LAST_COL: GamificationColumnKey = 'actions';

function columnPad(colKey: GamificationColumnKey, layer: 'head' | 'body' = 'body') {
  if (colKey === FIRST_COL) return adminTableCellPad('first', layer);
  if (colKey === LAST_COL) return adminTableCellPad('last', layer);
  return adminTableCellPad('middle', layer);
}

const COLUMN_DEFS: {
  key: GamificationColumnKey;
  label: string;
  className?: string;
}[] = [
  { key: 'action', label: 'Hành động', className: 'w-[18%]' },
  { key: 'points', label: 'Điểm', className: 'w-[10%]' },
  { key: 'description', label: 'Mô tả', className: 'w-[28%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[12%]' },
  { key: 'updated', label: 'Cập nhật', className: 'w-[14%]' },
  { key: 'actions', label: 'Hành động', className: 'w-[12%]' },
];

export function AdminGamificationConfigsView() {
  const listQuery = useGamificationConfigsList();
  const updateMutation = useUpdateGamificationConfig();
  const [editTarget, setEditTarget] = useState<GamificationConfig | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const items = useMemo(() => {
    const raw = listQuery.data ?? [];
    const sorted = [...raw].sort((a, b) => a.actionType.localeCompare(b.actionType));
    if (statusFilter === 'active') return sorted.filter(i => i.isActive);
    if (statusFilter === 'inactive') return sorted.filter(i => !i.isActive);
    return sorted;
  }, [listQuery.data, statusFilter]);

  const activeCount = (listQuery.data ?? []).filter(i => i.isActive).length;
  const inactiveCount = (listQuery.data ?? []).length - activeCount;

  const onSave = (values: { points: number; description: string; isActive: boolean }) => {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, body: values },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật cấu hình điểm.');
          setEditTarget(null);
        },
        onError: err =>
          toast.error(getGamificationConfigMutationError(err, 'Không thể cập nhật cấu hình điểm.')),
      }
    );
  };

  const errorMessage =
    listQuery.error instanceof Error
      ? listQuery.error.message
      : 'Không tải được cấu hình gamification.';

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Cấu hình điểm cho từng hành động (verify, resolve, reject…). Thay đổi điểm và bật/tắt hành
          động theo BR-GAM.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Tổng cấu hình',
            value: String((listQuery.data ?? []).length),
            hint: 'Toàn bộ actionType',
          },
          {
            label: 'Đang bật',
            value: String(activeCount),
            hint: 'Cộng/trừ điểm đang áp dụng',
          },
          {
            label: 'Đã tắt',
            value: String(inactiveCount),
            hint: 'Tạm ngưng',
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

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'Tất cả' },
            { id: 'active', label: 'Đang bật' },
            { id: 'inactive', label: 'Đã tắt' },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              statusFilter === tab.id
                ? 'border-emerald-600/30 bg-emerald-600/10 text-emerald-900'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
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
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
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
                      <span>Không có cấu hình phù hợp</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      ADMIN_TABLE_ROW_BORDER,
                      'transition-[opacity,background-color] hover:bg-sky-50/40',
                      !item.isActive && 'opacity-60'
                    )}
                  >
                    <TableCell
                      className={cn(
                        columnPad('action', 'body'),
                        'align-middle',
                        COLUMN_DEFS[0].className
                      )}
                    >
                      <p className="font-semibold text-foreground">
                        {gamificationActionLabel(item.actionType)}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.actionType}
                      </p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('points', 'body'),
                        'align-middle',
                        COLUMN_DEFS[1].className
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold tabular-nums',
                          item.points > 0
                            ? 'bg-emerald-50 text-emerald-800'
                            : item.points < 0
                              ? 'bg-red-50 text-red-800'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {formatGamificationPoints(item.points)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('description', 'body'),
                        'max-w-0 align-middle text-muted-foreground',
                        COLUMN_DEFS[2].className
                      )}
                    >
                      <p className="line-clamp-2">{item.description || '—'}</p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('status', 'body'),
                        'align-middle',
                        COLUMN_DEFS[3].className
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          item.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {item.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('updated', 'body'),
                        'whitespace-nowrap align-middle text-muted-foreground',
                        COLUMN_DEFS[4].className
                      )}
                    >
                      {formatGamificationDate(item.updatedAt ?? item.createdAt)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('actions', 'body'),
                        'align-middle text-right',
                        COLUMN_DEFS[5].className
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setEditTarget(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Sửa
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!listQuery.isPending && !listQuery.isError && (listQuery.data ?? []).length > 0 ? (
          <div className="flex shrink-0 items-center justify-end gap-4 px-6 py-3">
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {items.length.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

      <GamificationConfigEditDialog
        open={editTarget != null}
        config={editTarget}
        busy={updateMutation.isPending}
        onClose={() => setEditTarget(null)}
        onSubmit={onSave}
      />
    </div>
  );
}
