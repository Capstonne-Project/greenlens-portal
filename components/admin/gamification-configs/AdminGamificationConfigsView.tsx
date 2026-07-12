'use client';

import { GamificationConfigEditDialog } from '@/components/admin/gamification-configs/GamificationConfigEditDialog';
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
import { AlertTriangle, Loader2, Pencil, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        {listQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Đang tải cấu hình điểm…
          </div>
        ) : listQuery.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <AlertTriangle className="size-8 text-destructive" aria-hidden />
            <p className="text-sm text-destructive">{errorMessage}</p>
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
            <Trophy className="size-8 text-emerald-700/50" aria-hidden />
            <p className="text-sm font-medium text-foreground">Không có cấu hình phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                  <th className="px-4 py-3 font-medium">Điểm</th>
                  <th className="px-4 py-3 font-medium">Mô tả</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Cập nhật</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-muted/30',
                      !item.isActive && 'opacity-60'
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {gamificationActionLabel(item.actionType)}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {item.actionType}
                      </p>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-muted-foreground">
                      <p className="line-clamp-2">{item.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatGamificationDate(item.updatedAt ?? item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditTarget(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
