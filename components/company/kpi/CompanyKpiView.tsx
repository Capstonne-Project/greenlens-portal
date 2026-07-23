'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyCompanyKpi } from '@/hooks/useCompany';
import type { MyCompanyKpiParams } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import {
  formatAvgResolutionHours,
  formatCompanyDate,
  formatSlaComplianceRate,
} from '@/utils/companyUi';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  RefreshCw,
  Target,
  ThumbsDown,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type PeriodPreset = 'month' | '7d' | '30d' | 'custom';

function startOfMonthUtc(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

function daysAgoUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function toDateInputValue(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fromDateInputToIsoStart(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

function fromDateInputToIsoEnd(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

export function CompanyKpiView() {
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(startOfMonthUtc()));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(new Date().toISOString()));

  const params: MyCompanyKpiParams = useMemo(() => {
    if (preset === 'month') return {};
    if (preset === '7d') return { from: daysAgoUtc(7), to: new Date().toISOString() };
    if (preset === '30d') return { from: daysAgoUtc(30), to: new Date().toISOString() };
    if (customFrom && customTo) {
      return {
        from: fromDateInputToIsoStart(customFrom),
        to: fromDateInputToIsoEnd(customTo),
      };
    }
    return {};
  }, [preset, customFrom, customTo]);

  const { data: kpi, isPending, isError, refetch, isFetching } = useMyCompanyKpi(params);

  const completionRate =
    kpi && kpi.totalAssigned > 0
      ? Math.round((kpi.totalCompleted / kpi.totalAssigned) * 1000) / 10
      : null;

  const onTimeRate =
    kpi && kpi.totalCompleted > 0
      ? Math.round((kpi.completedOnTime / kpi.totalCompleted) * 1000) / 10
      : null;

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#e8e8e8] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Hiệu suất xử lý task LEO điều phối về công ty trong kỳ đã chọn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={preset} onValueChange={v => setPreset(v as PeriodPreset)}>
            <SelectTrigger
              id="kpi-period-filter"
              className="h-10 w-[12rem] rounded-lg"
              aria-label="Kỳ báo cáo"
            >
              <SelectValue placeholder="Kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="7d">7 ngày</SelectItem>
              <SelectItem value="30d">30 ngày</SelectItem>
              <SelectItem value="custom">Tuỳ chọn</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            aria-label="Làm mới"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 border-b border-[#e8e8e8] pb-5">
          <div>
            <label
              htmlFor="kpi-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Từ ngày
            </label>
            <input
              id="kpi-from"
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <div>
            <label
              htmlFor="kpi-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Đến ngày
            </label>
            <input
              id="kpi-to"
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
        </div>
      )}

      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải KPI…
        </div>
      ) : isError || !kpi ? (
        <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
          <div className="space-y-3">
            <p className="font-semibold text-destructive">Không tải được KPI công ty</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      ) : kpi.totalAssigned === 0 ? (
        <EmptyKpiPeriod
          companyName={kpi.companyName}
          periodFrom={kpi.periodFrom}
          periodTo={kpi.periodTo}
        />
      ) : (
        <>
          {/* One composition: outcome hero + volume funnel */}
          <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-[#f0fdf4] dark:border-border dark:bg-emerald-950/30">
            <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8 lg:gap-10">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800/70 dark:text-emerald-400/80">
                  {kpi.companyName}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatCompanyDate(kpi.periodFrom)} → {formatCompanyDate(kpi.periodTo)}
                </p>

                <div className="mt-8 flex flex-wrap items-end gap-2">
                  <p className="text-5xl font-bold tabular-nums tracking-tight text-emerald-950 dark:text-foreground md:text-6xl">
                    {completionRate != null ? `${completionRate}` : '—'}
                    {completionRate != null && (
                      <span className="ml-1 text-2xl font-semibold text-emerald-700/80 dark:text-emerald-400 md:text-3xl">
                        %
                      </span>
                    )}
                  </p>
                  <p className="pb-1.5 text-sm font-medium text-muted-foreground">
                    tỷ lệ hoàn thành
                  </p>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-[width] duration-500 dark:bg-emerald-400"
                    style={{ width: `${Math.min(100, completionRate ?? 0)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {kpi.totalCompleted}/{kpi.totalAssigned} task đã hoàn thành
                  {onTimeRate != null ? ` · ${onTimeRate}% đúng hạn SLA` : ''}
                </p>
              </div>

              <div className="flex flex-col justify-center gap-1 border-t border-emerald-900/10 pt-6 dark:border-border md:border-t-0 md:border-l md:pl-8 md:pt-0">
                <VolumeRow icon={Target} label="Đã nhận" value={kpi.totalAssigned} />
                <VolumeRow icon={CheckCircle2} label="Hoàn thành" value={kpi.totalCompleted} />
                <VolumeRow icon={ThumbsDown} label="Từ chối" value={kpi.totalDeclined} />
                <VolumeRow icon={Timer} label="Đúng hạn" value={kpi.completedOnTime} />
              </div>
            </div>
          </section>

          {/* Secondary quality metrics — one surface, not six cards */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chất lượng xử lý
            </h2>
            <dl className="grid divide-y divide-[#e8e8e8] overflow-hidden rounded-2xl border border-[#e8e8e8] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <QualityCell
                icon={TrendingUp}
                label="Tuân thủ SLA"
                value={formatSlaComplianceRate(kpi.slaComplianceRate)}
                hint="Tỷ lệ đạt hạn xử lý"
              />
              <QualityCell
                icon={Clock3}
                label="TB thời gian xử lý"
                value={formatAvgResolutionHours(kpi.avgResolutionHours)}
                hint="Trung bình đến hoàn thành"
              />
              <QualityCell
                icon={Timer}
                label="Hoàn thành đúng hạn"
                value={String(kpi.completedOnTime)}
                hint={onTimeRate != null ? `${onTimeRate}% trên tổng hoàn thành` : 'Trong hạn SLA'}
              />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyKpiPeriod({
  companyName,
  periodFrom,
  periodTo,
}: {
  companyName: string;
  periodFrom: string;
  periodTo: string;
}) {
  return (
    <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d4d4d4] bg-[#fafaf9] px-6 py-16 text-center dark:border-border dark:bg-muted/20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Inbox className="size-8" aria-hidden />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {companyName}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
        Chưa có task trong kỳ này
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {formatCompanyDate(periodFrom)} → {formatCompanyDate(periodTo)}. Khi LEO điều phối báo cáo,
        tỷ lệ hoàn thành và SLA sẽ hiện tại đây.
      </p>
    </section>
  );
}

function VolumeRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/60 dark:hover:bg-muted/40">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums tracking-tight text-foreground">{value}</span>
    </div>
  );
}

function QualityCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-[#fffdfc] px-5 py-5 dark:bg-card">
      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
