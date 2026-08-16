'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { format, startOfDay } from 'date-fns';
import { vi as dateFnsVi } from 'date-fns/locale';
import { CalendarClock, X } from 'lucide-react';
import { vi as dayPickerVi } from 'react-day-picker/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateTimePickerProps {
  /** ISO datetime, hoặc chuỗi rỗng nếu chưa chọn. */
  value: string;
  onChange: (isoOrEmpty: string) => void;
  placeholder?: string;
  /** Cho phép xoá lựa chọn (dùng cho field tuỳ chọn). */
  clearable?: boolean;
  /** Chặn chọn thời điểm trước mốc này (vd. không cho endsAt trước startsAt). */
  minDate?: Date;
  /** Chặn chọn thời điểm sau mốc này (vd. đóng đăng ký phải trước giờ bắt đầu). */
  maxDate?: Date;
  className?: string;
  id?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
/** Mỗi phút 00–59 — chọn độc lập bằng scroll/click. */
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

/** Chiều rộng 2 cột giờ + phút (absolute overlay khớp chiều cao calendar). */
const TIME_PANEL_WIDTH = 'w-[7.5rem]';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function emitIso(date: Date, minDate?: Date, maxDate?: Date): string {
  let t = date.getTime();
  if (minDate && t < minDate.getTime()) t = minDate.getTime();
  if (maxDate && t > maxDate.getTime()) t = maxDate.getTime();
  return new Date(t).toISOString();
}

function combineDraft(day: Date, hour: number, minute: number): Date {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

/** Cuộn item trong cột — không dùng scrollIntoView (tránh kéo dialog). */
function scrollItemIntoColumn(el: HTMLElement | null) {
  if (!el) return;
  const viewport = el.closest('[data-time-col]');
  if (!(viewport instanceof HTMLElement)) return;
  const elRect = el.getBoundingClientRect();
  const vpRect = viewport.getBoundingClientRect();
  viewport.scrollTop += elRect.top - vpRect.top - vpRect.height / 2 + elRect.height / 2;
}

function TimeColumn({
  label,
  colKey,
  values,
  selected,
  onSelect,
  selectedRef,
  isDisabled,
}: {
  label: string;
  colKey: string;
  values: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
  selectedRef: RefObject<HTMLButtonElement | null>;
  isDisabled?: (value: number) => boolean;
}) {
  return (
    <div className="flex h-full min-h-0 w-1/2 flex-col border-l border-border first:border-l-0">
      <div className="flex h-8 shrink-0 items-center justify-center border-b border-border text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        data-time-col={colKey}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
      >
        <div className="flex flex-col gap-0.5">
          {values.map(value => {
            const isActive = value === selected;
            const disabled = isDisabled?.(value) ?? false;
            return (
              <button
                key={value}
                type="button"
                ref={isActive ? selectedRef : undefined}
                disabled={disabled}
                onClick={() => onSelect(value)}
                className={cn(
                  'flex h-8 w-full shrink-0 items-center justify-center rounded-md text-sm tabular-nums transition-colors',
                  disabled && 'cursor-not-allowed opacity-35',
                  !disabled && isActive && 'bg-primary text-primary-foreground',
                  !disabled &&
                    !isActive &&
                    'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {pad2(value)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * DateTime picker:
 * - Trái: Calendar full (không cắt ngày) — chiều cao tự nhiên
 * - Phải: 2 cột Giờ (0–23) + Phút (0–59), scroll độc lập, cao khớp calendar
 * - Footer: Huỷ | nhãn | Xác nhận
 * Màu primary đen shadcn. collisionBoundary = dialog.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày giờ',
  clearable = false,
  minDate,
  maxDate,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [boundary, setBoundary] = useState<Element | null>(null);

  const [draftDay, setDraftDay] = useState<Date | undefined>();
  const [draftHour, setDraftHour] = useState(DEFAULT_HOUR);
  const [draftMinute, setDraftMinute] = useState(DEFAULT_MINUTE);

  const selectedHourRef = useRef<HTMLButtonElement>(null);
  const selectedMinuteRef = useRef<HTMLButtonElement>(null);

  const committed = parseIso(value);

  const displayLabel = committed
    ? format(committed, 'dd/MM/yyyy HH:mm', { locale: dateFnsVi })
    : placeholder;

  const draftSummary = useMemo(() => {
    if (!draftDay) return 'Chưa chọn ngày';
    const datePart = format(draftDay, 'dd MMM yyyy', { locale: dateFnsVi });
    return `${datePart} · ${pad2(draftHour)}:${pad2(draftMinute)}`;
  }, [draftDay, draftHour, draftMinute]);

  const setTriggerNode = (node: HTMLButtonElement | null) => {
    const dialog = node?.closest('[role="dialog"]') ?? null;
    setBoundary(prev => (prev === dialog ? prev : dialog));
  };

  const syncDraftFromValue = () => {
    if (committed) {
      setDraftDay(committed);
      setDraftHour(committed.getHours());
      setDraftMinute(committed.getMinutes());
      return;
    }
    setDraftDay(undefined);
    setDraftHour(DEFAULT_HOUR);
    setDraftMinute(DEFAULT_MINUTE);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) syncDraftFromValue();
    setOpen(nextOpen);
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      scrollItemIntoColumn(selectedHourRef.current);
      scrollItemIntoColumn(selectedMinuteRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, draftHour, draftMinute]);

  const isDraftOutOfRange = (hour: number, minute: number) => {
    if (!draftDay) return false;
    const t = combineDraft(draftDay, hour, minute).getTime();
    if (minDate && t < minDate.getTime()) return true;
    if (maxDate && t > maxDate.getTime()) return true;
    return false;
  };

  const handleConfirm = () => {
    if (!draftDay || isDraftOutOfRange(draftHour, draftMinute)) return;
    onChange(emitIso(combineDraft(draftDay, draftHour, draftMinute), minDate, maxDate));
    setOpen(false);
  };

  const canConfirm = Boolean(draftDay) && !isDraftOutOfRange(draftHour, draftMinute);

  const calendarDisabled =
    minDate || maxDate
      ? [
          ...(minDate ? [{ before: startOfDay(minDate) }] : []),
          ...(maxDate ? [{ after: startOfDay(maxDate) }] : []),
        ]
      : undefined;

  return (
    <div className={cn('relative', className)}>
      <CalendarClock
        className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Popover modal open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={setTriggerNode}
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'h-10 w-full justify-start rounded-lg border border-input bg-background pl-9 pr-3 text-left text-sm font-normal shadow-none',
              'hover:bg-background',
              !committed && 'text-muted-foreground',
              clearable && value && 'pr-9'
            )}
          >
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="z-[100] w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          avoidCollisions
          collisionBoundary={boundary ?? undefined}
          collisionPadding={16}
          sticky="partial"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {/*
            Calendar tự co theo nội dung → thấy hết ngày tháng.
            Cột giờ/phút absolute inset-y khớp đúng chiều cao calendar + scroll nội bộ
            → không kéo dài / cắt popover.
          */}
          <div className="relative flex">
            <Calendar
              mode="single"
              locale={dayPickerVi}
              selected={draftDay}
              onSelect={day => {
                if (day) setDraftDay(day);
              }}
              disabled={calendarDisabled}
              className="rounded-none border-0 p-2"
            />

            {/* Giữ chỗ chiều ngang cho panel giờ */}
            <div className={cn(TIME_PANEL_WIDTH, 'shrink-0')} aria-hidden />

            <div
              className={cn(
                'absolute inset-y-0 right-0 flex border-l border-border bg-background',
                TIME_PANEL_WIDTH
              )}
            >
              <TimeColumn
                label="Giờ"
                colKey="hour"
                values={HOURS}
                selected={draftHour}
                onSelect={setDraftHour}
                selectedRef={selectedHourRef}
                isDisabled={hour => MINUTES.every(minute => isDraftOutOfRange(hour, minute))}
              />
              <TimeColumn
                label="Phút"
                colKey="minute"
                values={MINUTES}
                selected={draftMinute}
                onSelect={setDraftMinute}
                selectedRef={selectedMinuteRef}
                isDisabled={minute => isDraftOutOfRange(draftHour, minute)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 px-3"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>
            <div className="flex h-8 min-w-0 flex-1 items-center justify-center truncate rounded-md border border-input bg-background px-2 text-xs text-muted-foreground">
              {draftSummary}
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 px-3"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Xác nhận
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {clearable && value ? (
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onChange('');
          }}
          aria-label="Xoá"
          className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
