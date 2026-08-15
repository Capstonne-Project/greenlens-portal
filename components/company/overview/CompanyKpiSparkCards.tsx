'use client';

import {
  formatHours,
  formatOverviewNumber,
  formatRatePercent,
} from '@/components/admin/overview/adminDashboardFormat';
import type {
  CompanyDashboardOverview,
  CompanyWorkloadTrendPoint,
} from '@/lib/api/services/fetchCompanyDashboard';
import { cn } from '@/lib/utils';

function MiniSpark({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) {
    return <div className={cn('h-4 w-9 rounded bg-slate-100', className)} aria-hidden />;
  }
  const max = Math.max(1, ...values);
  const w = 36;
  const h = 16;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 3) - 1}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-4 w-9 shrink-0', className)} aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function WowBadge({ percent }: { percent: number | null | undefined }) {
  if (percent == null || !Number.isFinite(percent)) {
    return (
      <span
        className="text-[10px] font-semibold tabular-nums text-slate-300"
        title="Chưa có % tuần trước"
      >
        —
      </span>
    );
  }

  const up = percent >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums sm:text-[11px]',
        up ? 'text-blue-500' : 'text-red-500'
      )}
    >
      {percent.toFixed(2).replace('.', ',')} % {up ? '↑' : '↓'}
    </span>
  );
}

function trendDispatched(point: CompanyWorkloadTrendPoint): number {
  if (Number.isFinite(point.dispatched)) return Math.max(0, point.dispatched);
  if (typeof point.assigned === 'number' && Number.isFinite(point.assigned)) {
    return Math.max(0, point.assigned);
  }
  return 0;
}

export function CompanyKpiSparkCards({
  overview,
  trendPoints,
}: {
  overview: CompanyDashboardOverview;
  trendPoints: CompanyWorkloadTrendPoint[] | undefined;
}) {
  const dispatchedSeries = (trendPoints ?? []).map(trendDispatched);
  const completedSeries = (trendPoints ?? []).map(p => Math.max(0, p.completed));

  const cards: {
    label: string;
    value: string;
    spark: number[];
    sparkClass: string;
    hint?: string;
  }[] = [
    {
      label: 'Tổng nhiệm vụ',
      value: formatOverviewNumber(overview.assignedTasks),
      spark: dispatchedSeries,
      sparkClass: 'text-blue-500',
    },
    {
      label: 'Đang chờ',
      value: formatOverviewNumber(overview.pendingTasks),
      spark: dispatchedSeries,
      sparkClass: 'text-blue-500',
    },
    {
      label: 'Hoàn thành',
      value: formatOverviewNumber(overview.completedTasks),
      spark: completedSeries,
      sparkClass: 'text-orange-500',
    },
    {
      label: 'SLA',
      value: formatRatePercent(overview.slaComplianceRate, 0),
      spark: completedSeries,
      sparkClass: 'text-blue-500',
      hint: `TB ${formatHours(overview.averageResolutionHours, 1)} · ${formatOverviewNumber(overview.activeTeams)} đội / ${formatOverviewNumber(overview.activeStaff)} NS`,
    },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
      {cards.map(card => (
        <article
          key={card.label}
          className="flex items-stretch justify-between gap-2 rounded-md bg-white px-3 py-2 shadow-[0_1px_3px_rgba(15,23,42,0.05)] sm:px-3.5 sm:py-2.5"
        >
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <p className="truncate text-[11px] font-medium leading-none text-slate-400">
              {card.label}
            </p>
            <p className="text-[18px] font-bold leading-none tracking-tight text-slate-900 tabular-nums sm:text-[20px]">
              {card.value}
            </p>
            <p className="truncate text-[10px] font-medium leading-none text-slate-400">
              {card.hint ?? 'Từ tuần trước'}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-between py-0.5">
            {card.spark.length > 1 ? (
              <MiniSpark values={card.spark} className={card.sparkClass} />
            ) : (
              <span className="h-4 w-9" aria-hidden />
            )}
            <WowBadge percent={null} />
          </div>
        </article>
      ))}
    </div>
  );
}
