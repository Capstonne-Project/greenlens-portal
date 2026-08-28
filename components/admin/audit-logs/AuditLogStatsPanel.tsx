'use client';

import { AdminRetryButton } from '@/components/admin/shared/AdminRetryButton';
import { useAuditLogsStats } from '@/hooks/useAuditLogs';
import type { AuditLogsStatsParams } from '@/lib/api/models/auditLog';
import { cn } from '@/lib/utils';
import { formatAuditDateTime } from '@/utils/auditLogUi';
import { BarChart3, Loader2 } from 'lucide-react';

interface AuditLogStatsPanelProps {
  params: AuditLogsStatsParams | null;
}

export function AuditLogStatsPanel({ params }: AuditLogStatsPanelProps) {
  const statsQuery = useAuditLogsStats(params);

  if (!params?.fromDate || !params?.toDate) {
    return (
      <section className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-center text-sm text-emerald-900/70">
        Chọn khoảng <strong>Từ ngày</strong> và <strong>Đến ngày</strong> để xem thống kê hoạt động.
      </section>
    );
  }

  if (statsQuery.isPending) {
    return (
      <section className="flex min-h-[120px] items-center justify-center rounded-2xl border border-emerald-100 bg-white">
        <Loader2 className="size-5 animate-spin text-emerald-600" aria-hidden />
      </section>
    );
  }

  if (statsQuery.isError) {
    return (
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
        Không tải được thống kê. <AdminRetryButton onClick={() => void statsQuery.refetch()} />
      </section>
    );
  }

  const stats = statsQuery.data;
  if (!stats) return null;

  const maxDayCount = Math.max(1, ...stats.byDay.map(d => d.count));

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
        <BarChart3 className="size-4 text-emerald-700" aria-hidden />
        Thống kê trong khoảng đã chọn
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70">
            Tổng bản ghi
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-950">
            {stats.totalCount.toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/70">
            Top action
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.byAction.length === 0 ? (
              <li className="text-sm text-muted-foreground">Không có dữ liệu</li>
            ) : (
              stats.byAction.slice(0, 5).map(item => (
                <li
                  key={item.action}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900"
                >
                  {item.action}
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold">
                    {item.count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {stats.byDay.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-emerald-800/70">
            Theo ngày
          </p>
          <ul className="space-y-1.5">
            {stats.byDay.map(day => (
              <li key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                  {formatAuditDateTime(`${day.date}T12:00:00Z`).slice(0, 10)}
                </span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className={cn('h-full rounded-full bg-emerald-600 transition-all')}
                    style={{ width: `${Math.round((day.count / maxDayCount) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-emerald-900">
                  {day.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
