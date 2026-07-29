'use client';

import { CalendarClock, X } from 'lucide-react';

import { cn } from '@/lib/utils';

function toInputValue(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function toIso(inputValue: string): string {
  if (!inputValue) return '';
  const parsed = new Date(inputValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

function toMinInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface DateTimePickerProps {
  /** ISO datetime, hoặc chuỗi rỗng nếu chưa chọn. */
  value: string;
  onChange: (isoOrEmpty: string) => void;
  placeholder?: string;
  /** Cho phép xoá lựa chọn (dùng cho field tuỳ chọn). */
  clearable?: boolean;
  /** Chặn chọn thời điểm trước mốc này (vd. không cho endsAt trước startsAt). */
  minDate?: Date;
  className?: string;
  id?: string;
}

/**
 * Input datetime-local gốc — không dùng Popover nổi để tránh xung đột
 * hit-testing với các canvas WebGL (bản đồ MapLibre) render trong cùng dialog.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày giờ',
  clearable = false,
  minDate,
  className,
  id,
}: DateTimePickerProps) {
  return (
    <div className={cn('relative', className)}>
      <CalendarClock
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id={id}
        type="datetime-local"
        value={toInputValue(value)}
        min={minDate ? toMinInputValue(minDate) : undefined}
        onChange={e => onChange(toIso(e.target.value))}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition',
          'focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10',
          clearable && value && 'pr-9'
        )}
      />
      {clearable && value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xoá"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
