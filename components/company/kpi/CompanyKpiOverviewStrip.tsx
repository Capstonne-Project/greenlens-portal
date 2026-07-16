'use client';

import { useMyCompanyKpi } from '@/hooks/useCompany';
import { formatAvgResolutionHours, formatSlaComplianceRate } from '@/utils/companyUi';
import { Loader2, Target } from 'lucide-react';
import Link from 'next/link';

/** Compact KPI strip for company overview (default: tháng hiện tại). */
export function CompanyKpiOverviewStrip() {
  const { data: kpi, isPending, isError } = useMyCompanyKpi({});

  if (isError) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/90 shadow-sm backdrop-blur dark:border-border dark:bg-card/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 px-5 py-4 dark:border-border sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Target className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">KPI tháng này</h2>
            <p className="text-xs text-muted-foreground">Hiệu suất xử lý task công ty</p>
          </div>
        </div>
        <Link
          href="/company/kpi"
          className="text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
        >
          Xem chi tiết →
        </Link>
      </div>

      {isPending || !kpi ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Đang tải…
        </div>
      ) : (
        <dl className="grid grid-cols-2 gap-px bg-emerald-50/80 dark:bg-border sm:grid-cols-4">
          {[
            { label: 'Nhận', value: String(kpi.totalAssigned) },
            { label: 'Hoàn thành', value: String(kpi.totalCompleted) },
            { label: 'SLA', value: formatSlaComplianceRate(kpi.slaComplianceRate) },
            { label: 'TB xử lý', value: formatAvgResolutionHours(kpi.avgResolutionHours) },
          ].map(cell => (
            <div key={cell.label} className="bg-white px-4 py-4 dark:bg-card">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {cell.label}
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">{cell.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
