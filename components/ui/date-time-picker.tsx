'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi as dateFnsVi } from 'date-fns/locale';
import { vi as dayPickerVi } from 'react-day-picker/locale';
import { CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function parseIso(iso: string): { date: Date | undefined; hour: string; minute: string } {
  if (!iso) return { date: undefined, hour: '00', minute: '00' };
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: undefined, hour: '00', minute: '00' };
  return {
    date: new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    hour: String(parsed.getHours()).padStart(2, '0'),
    minute: String(Math.round(parsed.getMinutes() / 5) * 5).padStart(2, '0'),
  };
}

function composeIso(date: Date, hour: string, minute: string): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hour),
    Number(minute),
    0,
    0
  ).toISOString();
}

export interface DateTimePickerProps {
  /** ISO datetime, hoặc chuỗi rỗng nếu chưa chọn. */
  value: string;
  onChange: (isoOrEmpty: string) => void;
  placeholder?: string;
  /** Cho phép xoá lựa chọn (dùng cho field tuỳ chọn). */
  clearable?: boolean;
  /** Chặn chọn ngày trước mốc này (vd. không cho endsAt trước startsAt). */
  minDate?: Date;
  className?: string;
  id?: string;
}

/** Popover Calendar + giờ:phút (bước 5’) — thay input[type=datetime-local] thô. */
export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày giờ',
  clearable = false,
  minDate,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(() => parseIso(value).date);
  const [draftHour, setDraftHour] = useState(() => parseIso(value).hour);
  const [draftMinute, setDraftMinute] = useState(() => parseIso(value).minute);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const parsed = parseIso(value);
      setDraftDate(parsed.date);
      setDraftHour(parsed.hour);
      setDraftMinute(parsed.minute);
    }
    setOpen(next);
  };

  const handleApply = () => {
    if (!draftDate) return;
    onChange(composeIso(draftDate, draftHour, draftMinute));
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  const current = parseIso(value);
  const label =
    value && current.date
      ? `${format(current.date, 'dd/MM/yyyy', { locale: dateFnsVi })} · ${current.hour}:${current.minute}`
      : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'h-10 w-full justify-start gap-2 px-3 font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarClock className="size-4 shrink-0 opacity-60" aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={draftDate}
          onSelect={setDraftDate}
          locale={dayPickerVi}
          weekStartsOn={1}
          disabled={minDate ? { before: minDate } : undefined}
        />

        <div className="flex items-center gap-2 border-t border-border px-3 py-3">
          <Select value={draftHour} onValueChange={setDraftHour}>
            <SelectTrigger className="h-9 w-[4.25rem]" aria-label="Giờ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {HOURS.map(h => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={draftMinute} onValueChange={setDraftMinute}>
            <SelectTrigger className="h-9 w-[4.25rem]" aria-label="Phút">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {MINUTES.map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            {clearable && value ? (
              <Button type="button" size="sm" variant="ghost" onClick={handleClear}>
                Xoá
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={handleApply} disabled={!draftDate}>
              Xong
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
