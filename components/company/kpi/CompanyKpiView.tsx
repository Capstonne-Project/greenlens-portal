'use client';

import { useMyCompanyKpi } from '@/hooks/useCompany';
import type { MyCompanyKpiParams } from '@/lib/api/models/company';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  return (
    <div className="relative space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Hiệu suất xử lý task được LEO điều phối về công ty trong kỳ đã chọn.
          </p>
          {kpi && (
            <p className="mt-1 text-xs text-muted-foreground">
              {kpi.companyName} · {formatCompanyDate(kpi.periodFrom)} →{' '}
              {formatCompanyDate(kpi.periodTo)}
            </p>
          )}
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
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            aria-label="Làm mới"
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          </button>
        </div>
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-100/80 bg-white/90 p-4 dark:border-border dark:bg-card/90">
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
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-100/80 py-24 text-sm text-muted-foreground dark:border-border">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải KPI…
        </div>
      ) : isError || !kpi ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
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
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <KpiStatCard
              icon={Target}
              label="Đã nhận phân công"
              value={String(kpi.totalAssigned)}
              hint="Task LEO giao trong kỳ"
              accent="emerald"
            />
            <KpiStatCard
              icon={CheckCircle2}
              label="Hoàn thành"
              value={String(kpi.totalCompleted)}
              hint={
                completionRate != null ? `${completionRate}% trên tổng nhận` : 'Chưa có dữ liệu'
              }
              accent="teal"
            />
            <KpiStatCard
              icon={ThumbsDown}
              label="Từ chối"
              value={String(kpi.totalDeclined)}
              hint="Đội từ chối task"
              accent="amber"
            />
            <KpiStatCard
              icon={Timer}
              label="Hoàn thành đúng hạn"
              value={String(kpi.completedOnTime)}
              hint="Trong hạn SLA"
              accent="sky"
            />
            <KpiStatCard
              icon={TrendingUp}
              label="Tuân thủ SLA"
              value={formatSlaComplianceRate(kpi.slaComplianceRate)}
              hint="Tỷ lệ đạt hạn xử lý"
              accent="emerald"
            />
            <KpiStatCard
              icon={Clock3}
              label="TB thời gian xử lý"
              value={formatAvgResolutionHours(kpi.avgResolutionHours)}
              hint="Trung bình đến hoàn thành"
              accent="violet"
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/90 p-5 shadow-sm dark:border-border dark:bg-card/90 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-400">
              Tóm tắt kỳ
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Kỳ báo cáo</dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatCompanyDate(kpi.periodFrom)} → {formatCompanyDate(kpi.periodTo)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Công ty</dt>
                <dd className="mt-1 text-sm font-medium">{kpi.companyName}</dd>
              </div>
            </dl>

            {kpi.totalAssigned === 0 && (
              <p className="mt-5 rounded-xl bg-emerald-50/80 px-4 py-3 text-sm text-muted-foreground dark:bg-muted">
                Chưa có task nào trong kỳ này. Khi LEO điều phối báo cáo, chỉ số sẽ cập nhật tại
                đây.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function KpiStatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint: string;
  accent: 'emerald' | 'teal' | 'amber' | 'sky' | 'violet';
}) {
  const iconWrap: Record<typeof accent, string> = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
    amber: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
    sky: 'bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300',
    violet: 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
  };

  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-border dark:bg-card/90 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            iconWrap[accent]
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
