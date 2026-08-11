'use client';

import {
  formatHours,
  formatOverviewNumber,
  formatRatePercent,
  formatUpdatedAt,
} from '@/components/admin/overview/adminDashboardFormat';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import {
  ADMIN_OVERVIEW_DATE_PRESETS,
  useAdminOverviewUiStore,
} from '@/lib/store/adminOverviewUiStore';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

/** Metrics + date range + refresh — rendered inside AdminTopHeader on `/admin` only. */
export function AdminOverviewHeaderBar() {
  const datePreset = useAdminOverviewUiStore(s => s.datePreset);
  const dateParams = useAdminOverviewUiStore(s => s.dateParams);
  const setDatePreset = useAdminOverviewUiStore(s => s.setDatePreset);

  const { overview, updatedAtMs, isFetching, refetch } = useAdminOverview(dateParams);
  const updatedAt = updatedAtMs > 0 ? new Date(updatedAtMs) : null;

  return (
    <div className="flex flex-col gap-2 border-t border-[#e8e8e8] pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <p className="min-w-0 flex-1 text-[10px] leading-snug text-muted-foreground sm:truncate sm:text-[11px]">
        {overview
          ? `${updatedAt ? `Cập nhật ${formatUpdatedAt(updatedAt)}` : 'Đang đồng bộ…'}${
              isFetching ? ' · làm mới' : ''
            } · ${formatOverviewNumber(overview.totalUsers)} người dùng · ${formatOverviewNumber(overview.totalReports)} báo cáo · SLA ${formatRatePercent(overview.slaComplianceRate, 0)} · TB ${formatHours(overview.averageResolutionHours, 1)}`
          : isFetching
            ? 'Đang tải tổng quan…'
            : '—'}
      </p>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <div
          className="flex flex-wrap rounded-lg border border-border bg-muted/30 p-0.5"
          role="radiogroup"
          aria-label="Khoảng thời gian"
        >
          {ADMIN_OVERVIEW_DATE_PRESETS.map(option => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={datePreset === option.value}
              onClick={() => setDatePreset(option.value)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-semibold transition',
                datePreset === option.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold transition hover:bg-muted disabled:opacity-60"
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
          Làm mới
        </button>
      </div>
    </div>
  );
}
