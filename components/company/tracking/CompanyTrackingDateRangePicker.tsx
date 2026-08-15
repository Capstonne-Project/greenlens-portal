'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { vi as dateFnsVi } from 'date-fns/locale';
import { useDayPicker, type DateRange, type MonthCaptionProps } from 'react-day-picker';
import { vi as dayPickerVi } from 'react-day-picker/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/** Preset nhanh — khớp UX ảnh mẫu (tiếng Việt cho platform LEO). */
export type CompanyTrackingDatePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'last6months'
  | 'all';

export type CompanyTrackingDateRangeValue = {
  preset: CompanyTrackingDatePreset | 'custom';
  /** ISO UTC — gửi API `fromDate`. */
  fromDate?: string;
  /** ISO UTC — gửi API `toDate`. */
  toDate?: string;
};

type CompanyTrackingDateRangePickerProps = {
  value: CompanyTrackingDateRangeValue;
  onChange: (next: CompanyTrackingDateRangeValue) => void;
  className?: string;
};

const VN_TZ_OFFSET = '+07:00';
const pad2 = (n: number) => String(n).padStart(2, '0');

const PRESETS: { key: CompanyTrackingDatePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'last7', label: '7 ngày qua' },
  { key: 'last30', label: '30 ngày qua' },
  { key: 'last6months', label: '6 tháng qua' },
  { key: 'all', label: 'Tất cả' },
];

/** Ngày lịch VN (UTC+7) — không phụ thuộc DST. */
function getVnTodayParts(now = Date.now()): { y: number; m: number; d: number } {
  const vn = new Date(now + 7 * 60 * 60 * 1000);
  return { y: vn.getUTCFullYear(), m: vn.getUTCMonth() + 1, d: vn.getUTCDate() };
}

function partsToLocalDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function vnToday(): Date {
  const t = getVnTodayParts();
  return partsToLocalDate(t.y, t.m, t.d);
}

function vnStartIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00.000${VN_TZ_OFFSET}`).toISOString();
}

function vnEndIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T23:59:59.999${VN_TZ_OFFSET}`).toISOString();
}

/** Ngày người dùng chọn trên calendar → mốc VN ISO. */
function calendarDayToVnStartIso(date: Date): string {
  return vnStartIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function calendarDayToVnEndIso(date: Date): string {
  return vnEndIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function rangeFromPreset(preset: CompanyTrackingDatePreset): DateRange | undefined {
  if (preset === 'all') return undefined;

  const today = vnToday();

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const y = subDays(today, 1);
      return { from: y, to: y };
    }
    case 'last7':
      return { from: subDays(today, 6), to: today };
    case 'last30':
      return { from: subDays(today, 29), to: today };
    case 'last6months':
      return { from: subMonths(today, 6), to: today };
    default:
      return undefined;
  }
}

/**
 * Hai cột lịch độc lập:
 * - Có range → trái = tháng `from`, phải = tháng `to` (cùng tháng thì phải = from+1).
 * - Không range (Tất cả) → trái = tháng trước, phải = tháng hiện tại.
 */
function visibleMonthsForRange(range: DateRange | undefined): { left: Date; right: Date } {
  if (!range?.from) {
    const today = startOfMonth(vnToday());
    return { left: subMonths(today, 1), right: today };
  }
  const left = startOfMonth(range.from);
  const end = startOfMonth(range.to ?? range.from);
  const right = isSameMonth(left, end) ? addMonths(left, 1) : end;
  return { left, right };
}

function formatDayInput(date: Date | undefined): string {
  if (!date) return '';
  return format(date, 'd MMM', { locale: dateFnsVi });
}

function formatTriggerLabel(
  value: CompanyTrackingDateRangeValue,
  range: DateRange | undefined
): string {
  if (value.preset === 'all' || (!value.fromDate && !value.toDate)) return 'Tất cả thời gian';
  // Luôn hiện từ — đến (kể cả preset 7/30 ngày, 6 tháng) — không hiện nhãn preset
  if (range?.from && range?.to) {
    if (isSameDay(range.from, range.to)) {
      return format(range.from, 'd MMM', { locale: dateFnsVi });
    }
    return `${format(range.from, 'd MMM', { locale: dateFnsVi })} - ${format(range.to, 'd MMM', { locale: dateFnsVi })}`;
  }
  if (range?.from) return format(range.from, 'd MMM', { locale: dateFnsVi });
  return 'Chọn khoảng ngày';
}

function isoToLocalCalendarDate(iso: string): Date {
  const vn = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  return partsToLocalDate(vn.getUTCFullYear(), vn.getUTCMonth() + 1, vn.getUTCDate());
}

function valueToRange(value: CompanyTrackingDateRangeValue): DateRange | undefined {
  if (value.preset !== 'custom' && value.preset !== 'all') {
    return rangeFromPreset(value.preset);
  }
  if (!value.fromDate && !value.toDate) return undefined;
  return {
    from: value.fromDate ? isoToLocalCalendarDate(value.fromDate) : undefined,
    to: value.toDate ? isoToLocalCalendarDate(value.toDate) : undefined,
  };
}

function commitRange(
  preset: CompanyTrackingDatePreset | 'custom',
  range: DateRange | undefined
): CompanyTrackingDateRangeValue {
  if (preset === 'all' || !range?.from) {
    return { preset: 'all' };
  }
  const from = range.from;
  const to = range.to ?? range.from;
  return {
    preset,
    fromDate: calendarDayToVnStartIso(from),
    toDate: calendarDayToVnEndIso(to),
  };
}

/**
 * Caption ◀ tháng ▶ — mỗi Calendar instance có context riêng nên nav chỉ đổi cột đó.
 * Label tháng theo chuẩn VN: "Tháng 1 2026".
 */
function formatVnMonthCaption(date: Date): string {
  return format(date, "'Tháng' M yyyy", { locale: dateFnsVi });
}

function PerMonthCaption({
  calendarMonth,
  displayIndex: _displayIndex,
  className,
  ...divProps
}: MonthCaptionProps) {
  const {
    goToMonth,
    nextMonth,
    previousMonth,
    labels: { labelPrevious, labelNext },
  } = useDayPicker();

  const canPrev = Boolean(previousMonth);
  const canNext = Boolean(nextMonth);

  return (
    <div {...divProps} className={cn('flex items-center justify-between gap-1', className)}>
      <button
        type="button"
        disabled={!canPrev}
        aria-label={labelPrevious(previousMonth)}
        aria-disabled={!canPrev}
        tabIndex={canPrev ? undefined : -1}
        onClick={() => {
          if (previousMonth) goToMonth(previousMonth);
        }}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 shrink-0 bg-background p-0 opacity-70 hover:opacity-100 disabled:pointer-events-none disabled:opacity-40'
        )}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>

      <span
        className="min-w-0 flex-1 truncate text-center text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        {formatVnMonthCaption(calendarMonth.date)}
      </span>

      <button
        type="button"
        disabled={!canNext}
        aria-label={labelNext(nextMonth)}
        aria-disabled={!canNext}
        tabIndex={canNext ? undefined : -1}
        onClick={() => {
          if (nextMonth) goToMonth(nextMonth);
        }}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 shrink-0 bg-background p-0 opacity-70 hover:opacity-100 disabled:pointer-events-none disabled:opacity-40'
        )}
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}

const calendarPanelClassNames = {
  months: 'flex flex-col',
  month: 'space-y-4',
  month_caption: 'flex items-center justify-between gap-1',
} as const;

/**
 * Date range filter — layout giống ảnh mẫu:
 * preset trái | dual calendar | footer input + Huỷ / Áp dụng.
 * Chọn preset → calendar + input footer đồng bộ ngay; Áp dụng mới commit API.
 */
export function CompanyTrackingDateRangePicker({
  value,
  onChange,
  className,
}: CompanyTrackingDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState<CompanyTrackingDatePreset | 'custom'>(
    value.preset
  );
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(() => valueToRange(value));
  const [leftMonth, setLeftMonth] = useState<Date>(
    () => visibleMonthsForRange(valueToRange(value)).left
  );
  const [rightMonth, setRightMonth] = useState<Date>(
    () => visibleMonthsForRange(valueToRange(value)).right
  );

  const triggerLabel = useMemo(() => formatTriggerLabel(value, valueToRange(value)), [value]);

  /** Sync draft từ value đã commit — gọi trong event handler, không dùng effect. */
  const syncDraftFromValue = (next: CompanyTrackingDateRangeValue) => {
    const nextRange = valueToRange(next);
    const months = visibleMonthsForRange(nextRange);
    setDraftPreset(next.preset);
    setDraftRange(nextRange);
    setLeftMonth(months.left);
    setRightMonth(months.right);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) syncDraftFromValue(value);
    setOpen(nextOpen);
  };

  const handlePreset = (preset: CompanyTrackingDatePreset) => {
    const nextRange = rangeFromPreset(preset);
    const months = visibleMonthsForRange(nextRange);
    setDraftPreset(preset);
    setDraftRange(nextRange);
    setLeftMonth(months.left);
    setRightMonth(months.right);
  };

  const handleCalendarSelect = (next: DateRange | undefined) => {
    setDraftRange(next);
    if (!next?.from) {
      setDraftPreset('all');
      return;
    }
    const matched = PRESETS.find(p => {
      if (p.key === 'all') return false;
      const r = rangeFromPreset(p.key);
      if (!r?.from || !next.from) return false;
      const to = next.to ?? next.from;
      const rt = r.to ?? r.from;
      return isSameDay(r.from, next.from) && isSameDay(rt, to);
    });
    setDraftPreset(matched?.key ?? 'custom');
  };

  const handleCancel = () => {
    syncDraftFromValue(value);
    setOpen(false);
  };

  const handleApply = () => {
    onChange(commitRange(draftPreset, draftRange));
    setOpen(false);
  };

  const sharedCalendarProps = {
    mode: 'range' as const,
    selected: draftRange,
    onSelect: handleCalendarSelect,
    locale: dayPickerVi,
    weekStartsOn: 1 as const,
    hideNavigation: true,
    components: { MonthCaption: PerMonthCaption },
    className: 'p-0',
    classNames: calendarPanelClassNames,
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand',
            className
          )}
        >
          <CalendarIcon className="size-3.5 opacity-60" aria-hidden />
          <span className="max-w-44 truncate">{triggerLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto overflow-hidden rounded-lg border-border p-0 shadow-md sm:min-w-[44rem]"
      >
        {/*
          Mẫu: separator dọc xuyên suốt.
          Cột trái = presets | Cột phải = schedule + footer (input/nút) cùng bề ngang.
        */}
        <div className="flex min-h-0 items-stretch">
          <aside
            className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-border p-3"
            aria-label="Khoảng thời gian nhanh"
          >
            {PRESETS.map(preset => {
              const active = draftPreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-w-0 flex-1 divide-x divide-border p-3">
              {/* Hai DayPicker riêng — nav cột trái / phải độc lập */}
              <div className="min-w-0 flex-1 px-3 first:pl-0">
                <Calendar
                  {...sharedCalendarProps}
                  month={leftMonth}
                  onMonthChange={setLeftMonth}
                  aria-label="Lịch tháng bên trái"
                />
              </div>
              <div className="min-w-0 flex-1 px-3 last:pr-0">
                <Calendar
                  {...sharedCalendarProps}
                  month={rightMonth}
                  onMonthChange={setRightMonth}
                  aria-label="Lịch tháng bên phải"
                />
              </div>
            </div>

            {/* Footer cùng bề ngang cột calendar — song song với p-3 ở trên */}
            <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={formatDayInput(draftRange?.from)}
                  placeholder="Từ ngày"
                  className="h-9 w-28 bg-background text-sm tabular-nums"
                  aria-label="Ngày bắt đầu"
                />
                <span className="select-none text-muted-foreground" aria-hidden>
                  —
                </span>
                <Input
                  readOnly
                  value={formatDayInput(draftRange?.to ?? draftRange?.from)}
                  placeholder="Đến ngày"
                  className="h-9 w-28 bg-background text-sm tabular-nums"
                  aria-label="Ngày kết thúc"
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleCancel}
                >
                  Huỷ
                </Button>
                <Button type="button" size="sm" className="h-9" onClick={handleApply}>
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
