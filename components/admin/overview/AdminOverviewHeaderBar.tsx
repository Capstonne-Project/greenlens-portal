'use client';

import {
  formatHours,
  formatOverviewNumber,
  formatRatePercent,
  formatUpdatedAt,
} from '@/components/admin/overview/adminDashboardFormat';
import { ADMIN_META_TEXT, ADMIN_PRIMARY_BTN } from '@/components/admin/shared/adminUiTokens';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <p className={cn(ADMIN_META_TEXT, 'min-w-0 flex-1 leading-snug sm:truncate')}>
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
            <Button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={datePreset === option.value}
              variant="ghost"
              size="sm"
              onClick={() => setDatePreset(option.value)}
              className={cn(
                'h-8 rounded-md px-2 text-xs font-semibold',
                datePreset === option.value
                  ? cn(ADMIN_PRIMARY_BTN, 'shadow-sm hover:bg-emerald-800')
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 gap-1.5 text-xs font-semibold"
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
          Làm mới
        </Button>
      </div>
    </div>
  );
}
