'use client';

/**
 * Card Tổng quan — trục luôn Thg 1–12.
 * Chart theo UI mẫu Xenity Overview:
 * - Track nền xám nhạt full-height mỗi tháng
 * - Cột stacked cùng width: dưới = Đã giải quyết (Checkup hatch), trên = Tạo mới (Consu xanh)
 */

import { formatOverviewNumber } from '@/components/admin/overview/adminDashboardFormat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type {
  DeoDashboardDateRangeParams,
  DeoReportTrendPoint,
} from '@/lib/api/services/fetchDeoDashboard';
import { DEO_TREND_RANGE_PRESETS, type DeoTrendRangePreset } from '@/lib/store/deoOverviewUiStore';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

const MONTH_SHORT = [
  'T1',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
  'T8',
  'T9',
  'T10',
  'T11',
  'T12',
] as const;

/** Xenity: Consultation = xanh, Medical Checkup = hatch, track cột = xám nhạt. */
const COLOR = {
  consuActive: '#3b82f6',
  consuIdle: '#c5d0e0',
  checkupBase: '#e8eef6',
  track: '#e8edf5',
} as const;

/** Hatch Checkup — sọc rõ trên nền đặc, không lộ xanh tạo mới. */
const CHECKUP_HATCH = 'repeating-linear-gradient(-45deg, #c5d4e8 0 2px, #f4f7fb 2px 5.5px)';

function monthKey(date: string): string {
  const match = /^(\d{4})-(\d{1,2})/.exec(date);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}`;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }
  return date;
}

function parseIso(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/**
 * Trục luôn đủ Thg 1–Thg 12 năm hiện tại.
 * Filter chỉ quyết định data API merge vào đúng tháng — tháng không có data = 0 (vẫn hiện cột).
 */
export function fillYearMonthBuckets(
  points: DeoReportTrendPoint[],
  dateParams: DeoDashboardDateRangeParams | undefined
): DeoReportTrendPoint[] {
  const now = new Date();
  const to = parseIso(dateParams?.to, now);
  const year = to.getFullYear();

  const byMonth = new Map<string, DeoReportTrendPoint>();
  for (const p of points) {
    const key = monthKey(p.date);
    if (!key.startsWith(`${year}-`)) continue;
    const prev = byMonth.get(key);
    if (prev) {
      byMonth.set(key, {
        date: prev.date,
        created: prev.created + p.created,
        resolved: prev.resolved + p.resolved,
      });
    } else {
      byMonth.set(key, {
        date: `${key}-01`,
        created: p.created,
        resolved: p.resolved,
      });
    }
  }

  const filled: DeoReportTrendPoint[] = [];
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    filled.push(byMonth.get(key) ?? { date: `${key}-01`, created: 0, resolved: 0 });
  }
  return filled;
}

function isMonthInFilterRange(
  date: string,
  dateParams: DeoDashboardDateRangeParams | undefined
): boolean {
  if (!dateParams?.from && !dateParams?.to) return true;
  const now = new Date();
  const from = parseIso(dateParams?.from, new Date(now.getFullYear(), 0, 1));
  const to = parseIso(dateParams?.to, now);
  const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
  const toKey = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}`;
  const key = monthKey(date);
  return key >= fromKey && key <= toKey;
}

function formatTooltipMonth(date: string): string {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(d);
    }
  } catch {
    /* fallthrough */
  }
  return date;
}

/**
 * Cột tháng giống UI mẫu:
 * - Track xám full-height (12 tháng luôn hiện)
 * - Tạo mới = fill xanh từ đáy (thường cao hơn)
 * - Đã giải quyết = hatch overlay cùng đáy, che xanh ở vùng chồng
 */
function TrendMonthBar({
  created,
  resolved,
  maxValue,
  isActive,
}: {
  created: number;
  resolved: number;
  maxValue: number;
  isActive: boolean;
}) {
  const pct = (value: number) => {
    if (value <= 0) return 0;
    return Math.min(88, Math.max(8, Math.round((value / maxValue) * 88)));
  };

  const createdH = pct(created);
  const resolvedH = pct(resolved);
  const tipH = Math.max(createdH, resolvedH);
  const consuColor = isActive ? COLOR.consuActive : COLOR.consuIdle;
  const resolvedRoundsTop = resolvedH > 0 && resolvedH >= createdH;

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-y-0 left-1/2 w-[62%] max-w-7 min-w-3.5 -translate-x-1/2 overflow-hidden rounded-t-md"
        style={{ backgroundColor: COLOR.track }}
      >
        {createdH > 0 ? (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: `${createdH}%`,
              backgroundColor: consuColor,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
            }}
          />
        ) : null}
        {resolvedH > 0 ? (
          <div
            className="absolute inset-x-0 bottom-0 z-1"
            style={{
              height: `${resolvedH}%`,
              backgroundColor: '#d7e0ec',
              backgroundImage: CHECKUP_HATCH,
              borderTopLeftRadius: resolvedRoundsTop ? 6 : 0,
              borderTopRightRadius: resolvedRoundsTop ? 6 : 0,
            }}
          />
        ) : null}
      </div>
      {isActive && tipH > 0 ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-10 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#ef4444] ring-[2.5px] ring-white"
          style={{ bottom: `${tipH}%` }}
        />
      ) : null}
    </div>
  );
}

export function DeoReportTrendChart({
  points,
  trendRangePreset,
  trendDateParams,
  onTrendRangeChange,
  fillHeight = false,
}: {
  points: DeoReportTrendPoint[] | undefined;
  groupBy?: string;
  trendRangePreset: DeoTrendRangePreset;
  trendDateParams?: DeoDashboardDateRangeParams;
  onTrendRangeChange: (preset: DeoTrendRangePreset) => void;
  fillHeight?: boolean;
}) {
  const list = useMemo(
    () => fillYearMonthBuckets(points ?? [], trendDateParams),
    [points, trendDateParams]
  );

  const filterMonths = useMemo(
    () => list.filter(p => isMonthInFilterRange(p.date, trendDateParams)),
    [list, trendDateParams]
  );

  /** Scale theo max từng metric — overlay độc lập chiều cao. */
  const maxValue = Math.max(1, ...list.map(p => Math.max(p.created, p.resolved)));

  const totalCreatedInFilter = filterMonths.reduce((sum, p) => sum + p.created, 0);
  const avgCreated = filterMonths.length > 0 ? totalCreatedInFilter / filterMonths.length : 0;

  const lastInFilter = filterMonths[filterMonths.length - 1];
  const prevInFilter = filterMonths.length > 1 ? filterMonths[filterMonths.length - 2] : undefined;
  const createdDelta =
    lastInFilter && prevInFilter
      ? lastInFilter.created - prevInFilter.created
      : lastInFilter
        ? lastInFilter.created
        : null;
  const roughDeltaPct =
    lastInFilter && prevInFilter && prevInFilter.created > 0
      ? ((lastInFilter.created - prevInFilter.created) / prevInFilter.created) * 100
      : null;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fallbackIndex = useMemo(() => {
    if (lastInFilter) {
      const idx = list.findIndex(p => monthKey(p.date) === monthKey(lastInFilter.date));
      if (idx >= 0) return idx;
    }
    return list.length > 0 ? list.length - 1 : null;
  }, [list, lastInFilter]);

  const activeIndex =
    hoveredIndex != null && hoveredIndex < list.length ? hoveredIndex : fallbackIndex;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-md bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5',
        fillHeight ? 'h-full min-h-0' : 'min-h-0'
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <h2 className="text-[18px] font-semibold leading-none text-slate-900">Tổng quan</h2>
        <div
          className="flex max-w-full flex-wrap items-center gap-1"
          role="radiogroup"
          aria-label="Khoảng thời gian"
        >
          {DEO_TREND_RANGE_PRESETS.map(option => {
            const selected = trendRangePreset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onTrendRangeChange(option.value)}
                className={cn(
                  'rounded-full px-2.5 py-1.5 text-[11px] font-medium leading-none whitespace-nowrap transition sm:px-3 sm:text-[12px]',
                  selected
                    ? 'bg-[#1e3a5f] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-500'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3 shrink-0 text-[13px] font-medium leading-none text-slate-400">
        Trung bình báo cáo tạo mới mỗi tháng
      </p>

      <div className="mt-2.5 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="text-[28px] font-bold leading-none tracking-tight text-slate-900 tabular-nums sm:text-[32px]">
            {formatOverviewNumber(Math.round(avgCreated))}
          </span>
          {roughDeltaPct != null && Number.isFinite(roughDeltaPct) ? (
            <span
              className={cn(
                'inline-flex max-w-full flex-wrap items-baseline gap-1 text-[12px] font-semibold leading-none sm:text-[13px]',
                roughDeltaPct >= 0 ? 'text-blue-500' : 'text-red-500'
              )}
              title="created tháng cuối vs tháng trước trong khoảng lọc"
            >
              <span>
                {roughDeltaPct >= 0 ? '+' : ''}
                {roughDeltaPct.toFixed(1)}% {roughDeltaPct >= 0 ? '↑' : '↓'}
              </span>
              {createdDelta != null ? (
                <span className="text-[11px] font-medium text-slate-500 sm:text-[12px]">
                  so với kỳ trước ({createdDelta >= 0 ? '+' : ''}
                  {formatOverviewNumber(createdDelta)} báo cáo tạo mới)
                </span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-500">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLOR.consuActive }}
              aria-hidden
            />
            Tạo mới
          </span>
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-500">
            <span
              className="size-2.5 shrink-0 rounded-full border border-slate-200/80"
              style={{
                backgroundColor: COLOR.checkupBase,
                backgroundImage: CHECKUP_HATCH,
              }}
              aria-hidden
            />
            Đã giải quyết
          </span>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="flex min-h-0 flex-1 items-center justify-center text-center text-sm text-slate-400">
          Chưa có dữ liệu xu hướng
        </p>
      ) : (
        <TooltipProvider delayDuration={0}>
          <div
            className="mt-3 grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)_20px] gap-x-1 gap-y-2 sm:gap-x-1.5"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {list.map((point, index) => {
              const isActive = index === activeIndex;
              return (
                <Tooltip key={`${point.date}-${index}`} open={isActive}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="h-full min-h-0 min-w-0 self-stretch"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onFocus={() => setHoveredIndex(index)}
                      onClick={() => setHoveredIndex(index)}
                      aria-label={`${MONTH_SHORT[index]}: ${point.created} mới, ${point.resolved} đã giải quyết`}
                    >
                      <TrendMonthBar
                        created={point.created}
                        resolved={point.resolved}
                        maxValue={maxValue}
                        isActive={isActive}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="rounded-xl border-0 bg-white px-3 py-2 text-center shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                  >
                    <p className="text-[11px] font-medium leading-none text-slate-400">
                      {formatTooltipMonth(point.date)}
                    </p>
                    <p className="mt-1.5 text-[13px] font-bold leading-snug text-slate-900 tabular-nums">
                      {formatOverviewNumber(point.created)} mới
                      <span className="mx-1 font-medium text-slate-300">·</span>
                      {formatOverviewNumber(point.resolved)} đã giải quyết
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {MONTH_SHORT.map((label, index) => (
              <span
                key={label}
                className={cn(
                  'flex h-5 items-center justify-center text-[10px] leading-none tabular-nums sm:text-[11px]',
                  index === activeIndex
                    ? 'font-semibold text-slate-900'
                    : 'font-medium text-slate-400'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </TooltipProvider>
      )}
    </article>
  );
}
