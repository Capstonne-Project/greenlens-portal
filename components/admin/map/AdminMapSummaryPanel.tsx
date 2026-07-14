'use client';

import type { MapSummaryData } from '@/lib/api/services/fetchMap';
import { cn } from '@/lib/utils';
import { Info, Loader2 } from 'lucide-react';

const DAY_OPTIONS = [7, 30] as const;

interface AdminMapSummaryPanelProps {
  summary: MapSummaryData | undefined;
  isLoading: boolean;
  isError: boolean;
  days: number;
  onDaysChange: (days: number) => void;
  pinCount: number;
}

function formatPeriodDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DailyBars({ dailyCounts }: { dailyCounts: MapSummaryData['dailyCounts'] }) {
  const max = Math.max(1, ...dailyCounts.map(d => d.count));

  if (dailyCounts.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">Chưa có dữ liệu theo ngày.</p>
    );
  }

  return (
    <div className="space-y-2" role="img" aria-label="Biểu đồ số báo cáo theo ngày">
      <div className="flex h-32 items-end gap-0.5">
        {dailyCounts.map(point => {
          const heightPct = (point.count / max) * 100;
          const label = point.date.slice(5); // MM-DD
          return (
            <div
              key={point.date}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${formatPeriodDate(point.date)}: ${point.count}`}
            >
              <span className="pointer-events-none absolute -top-5 hidden rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background group-hover:block">
                {point.count}
              </span>
              <div
                className="w-full max-w-[14px] rounded-t-sm bg-emerald-600/80 transition group-hover:bg-emerald-600"
                style={{ height: `${Math.max(heightPct, point.count > 0 ? 4 : 0)}%` }}
              />
              {dailyCounts.length <= 14 ? (
                <span className="mt-1 truncate text-[9px] text-muted-foreground">{label}</span>
              ) : null}
            </div>
          );
        })}
      </div>
      {dailyCounts.length > 14 ? (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{dailyCounts[0]?.date.slice(5)}</span>
          <span>{dailyCounts[dailyCounts.length - 1]?.date.slice(5)}</span>
        </div>
      ) : null}
    </div>
  );
}

export function AdminMapSummaryPanel({
  summary,
  isLoading,
  isError,
  days,
  onDaysChange,
  pinCount,
}: AdminMapSummaryPanelProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:w-80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Tóm tắt viewport</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Verified trở lên trong khung nhìn</p>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {DAY_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => onDaysChange(option)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                days === option
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option} ngày
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          Không tải được tóm tắt. Di chuyển bản đồ để thử lại.
        </p>
      ) : null}

      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Tổng trong viewport
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          {isLoading && !summary ? (
            <Loader2 className="size-5 animate-spin text-emerald-600" aria-hidden />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300">
              {new Intl.NumberFormat('vi-VN').format(summary?.reportCount ?? 0)}
            </p>
          )}
          <span className="text-xs text-muted-foreground">{pinCount} ghim đang hiện</span>
        </div>
      </div>

      {summary ? (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Kỳ thống kê
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatPeriodDate(summary.periodStart)}
            <span className="mx-1.5 text-muted-foreground">→</span>
            {formatPeriodDate(summary.periodEnd)}
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Báo cáo theo ngày
        </p>
        {isLoading && !summary ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-emerald-600" aria-hidden />
          </div>
        ) : (
          <DailyBars dailyCounts={summary?.dailyCounts ?? []} />
        )}
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
        Pan hoặc zoom bản đồ để cập nhật số liệu và ghim trong khung nhìn hiện tại.
      </p>
    </aside>
  );
}
