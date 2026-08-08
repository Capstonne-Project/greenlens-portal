'use client';

import { CompanyKpiView } from '@/components/company/kpi/CompanyKpiView';
import { useMyCompanyKpi } from '@/hooks/useCompany';
import {
  companyOverviewDateParamsToKpiParams,
  getCompanyOverviewDatePresetLabel,
  useCompanyOverviewUiStore,
} from '@/lib/store/companyOverviewUiStore';
import { cn } from '@/lib/utils';
import { formatAvgResolutionHours, formatSlaComplianceRate } from '@/utils/companyUi';
import { ChevronDown, Loader2, Target } from 'lucide-react';
import { useMemo, useState } from 'react';

/** KPI công ty — thu gọn trên tổng quan, mở rộng xem báo cáo đầy đủ. */
export function CompanyKpiCollapsibleSection() {
  const [expanded, setExpanded] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#company-kpi'
  );
  const datePreset = useCompanyOverviewUiStore(s => s.datePreset);
  const dateParams = useCompanyOverviewUiStore(s => s.dateParams);
  const kpiParams = useMemo(
    () => companyOverviewDateParamsToKpiParams(datePreset, dateParams),
    [datePreset, dateParams]
  );
  const periodLabel = getCompanyOverviewDatePresetLabel(datePreset);

  const { data: kpi, isPending, isError } = useMyCompanyKpi(kpiParams);

  const completionRate =
    kpi && kpi.totalAssigned > 0
      ? Math.round((kpi.totalCompleted / kpi.totalAssigned) * 1000) / 10
      : null;

  return (
    <section
      id="company-kpi"
      className="scroll-mt-4 overflow-hidden rounded-card border border-border bg-card shadow-sm"
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-3 p-4 text-left transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Target className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground sm:text-base">
              Hiệu suất KPI công ty
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Kỳ {periodLabel}</p>
          </div>
        </div>

        {!expanded && !isPending && !isError && kpi ? (
          <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 sm:gap-x-8">
            {[
              { label: 'Nhận', value: String(kpi.totalAssigned) },
              { label: 'Hoàn thành', value: String(kpi.totalCompleted) },
              {
                label: 'Tỷ lệ HT',
                value: completionRate != null ? `${completionRate}%` : '—',
              },
              { label: 'SLA', value: formatSlaComplianceRate(kpi.slaComplianceRate) },
              { label: 'TB xử lý', value: formatAvgResolutionHours(kpi.avgResolutionHours) },
            ]
              .slice(0, 4)
              .map(cell => (
                <div key={cell.label}>
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {cell.label}
                  </dt>
                  <dd className="text-base font-bold tabular-nums text-foreground">{cell.value}</dd>
                </div>
              ))}
          </dl>
        ) : !expanded && isPending ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Đang tải…
          </span>
        ) : null}

        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 self-end text-xs font-semibold text-emerald-800 sm:self-center dark:text-emerald-400',
            expanded && 'sm:ml-4'
          )}
        >
          {expanded ? 'Thu gọn' : 'Chi tiết KPI'}
          <ChevronDown
            className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            aria-hidden
          />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
          <CompanyKpiView embedded kpiParams={kpiParams} />
        </div>
      ) : null}
    </section>
  );
}
