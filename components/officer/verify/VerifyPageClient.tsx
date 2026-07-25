'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  Cloud,
  Copy,
  Droplets,
  Eye,
  Filter,
  FlaskConical,
  ImageIcon,
  Leaf,
  Loader2,
  Search,
  Trash2,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LayoutGroup, motion } from 'motion/react';

import { DuplicateSuspectDialog } from '@/components/officer/verify/DuplicateSuspectDialog';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useReportQueue, useVerifyReport } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import type { ReportSeverity } from '@/lib/api/models/report';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const VERIFY_PAGE_SIZE = 10;

type ColumnKey =
  | 'image'
  | 'code'
  | 'category'
  | 'severity'
  | 'status'
  | 'priority'
  | 'address'
  | 'created'
  | 'verifySla'
  | 'actions';

/** Vertical rhythm; symmetric edge inset (`ps-6` / `pe-6`) matches page shell `p-6`. */
const FIRST_COL: ColumnKey = 'image';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y = layer === 'head' ? 'py-3.5' : 'py-4';
  if (colKey === FIRST_COL) return cn('px-0', y, 'ps-12 pe-3');
  if (colKey === LAST_COL) return cn('px-0', y, 'ps-3 pe-6');
  return cn(y, 'px-3 sm:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

/**
 * Proportional widths (`table-fixed`) so column gaps stay even across viewports.
 * Image stays rem-sized; text columns use % of table width.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'image', label: 'Image', className: 'w-20' },
  { key: 'code', label: 'Report Code', className: 'w-[10%]' },
  { key: 'category', label: 'Category', className: 'w-[11%]' },
  { key: 'severity', label: 'Severity', className: 'w-[9%]' },
  { key: 'status', label: 'Status', className: 'w-[9%]' },
  { key: 'priority', label: 'Priority', className: 'w-[7%]' },
  { key: 'address', label: 'Address', className: 'w-[16%]' },
  { key: 'created', label: 'Created', className: 'w-[10%]' },
  { key: 'verifySla', label: 'Verify SLA', className: 'w-[11%]' },
  { key: 'actions', label: 'Action', className: 'w-[5.5rem]' },
];
const BADGE_BASE =
  'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium';

// ── Filter presets (lọc theo `createdAt`, tính theo lịch VN UTC+7) ─────────────

type DatePreset = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear';
type SeverityFilter = 'all' | ReportSeverity;

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'thisYear', label: 'Năm nay' },
];

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Critical', label: REPORT_SEVERITY_LABEL_VI.Critical },
  { key: 'High', label: REPORT_SEVERITY_LABEL_VI.High },
  { key: 'Medium', label: REPORT_SEVERITY_LABEL_VI.Medium },
  { key: 'Low', label: REPORT_SEVERITY_LABEL_VI.Low },
];

/** Preset thời gian trong drawer — khớp layout pill 4 nút. */
const DRAWER_TIME_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
];

const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  SMOKE: Cloud,
  WASTEWATER: Droplets,
  TRASH: Trash2,
  CHEMICAL: FlaskConical,
  NOISE: Volume2,
  SOIL: Leaf,
};

/** VN không có DST — cố định offset để mốc ngày không lệch theo máy người dùng. */
const VN_TZ_OFFSET = '+07:00';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** ISO UTC cho 00:00:00 (giờ VN) của ngày y-m-d (m: 1-based). */
function vnStartIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00.000${VN_TZ_OFFSET}`).toISOString();
}

/** ISO UTC cho 23:59:59.999 (giờ VN) của ngày y-m-d (m: 1-based). */
function vnEndIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T23:59:59.999${VN_TZ_OFFSET}`).toISOString();
}

function dateInputToVnStartIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return vnStartIso(y, m, d);
}

function dateInputToVnEndIso(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return vnEndIso(y, m, d);
}

/** Ngày đủ DD/MM/YYYY mới gửi API; chỉ năm (UX) không tính là filter. */
function isCompleteDateInput(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Boolean(y && m && d);
}

/** Khoảng ngày gửi API; custom from/to đủ ngày ưu tiên hơn preset. */
function getDateRange(
  preset: DatePreset,
  customFrom: string,
  customTo: string
): { fromDate?: string; toDate?: string } {
  const fromComplete = isCompleteDateInput(customFrom);
  const toComplete = isCompleteDateInput(customTo);

  if (fromComplete || toComplete) {
    return {
      ...(fromComplete ? { fromDate: dateInputToVnStartIso(customFrom) } : {}),
      ...(toComplete ? { toDate: dateInputToVnEndIso(customTo) } : {}),
    };
  }

  if (preset === 'all') return {};

  // Dịch field UTC +7h để đọc y/m/d đúng theo lịch VN.
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1;
  const d = vnNow.getUTCDate();

  switch (preset) {
    case 'today':
      return { fromDate: vnStartIso(y, m, d), toDate: vnEndIso(y, m, d) };
    case 'thisWeek': {
      const mondayOffset = (vnNow.getUTCDay() + 6) % 7;
      const weekStart = new Date(Date.UTC(y, m - 1, d - mondayOffset));
      return {
        fromDate: vnStartIso(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth() + 1,
          weekStart.getUTCDate()
        ),
        toDate: vnEndIso(y, m, d),
      };
    }
    case 'thisMonth':
      return { fromDate: vnStartIso(y, m, 1), toDate: vnEndIso(y, m, d) };
    case 'lastMonth': {
      const prev = new Date(Date.UTC(y, m - 2, 1));
      const py = prev.getUTCFullYear();
      const pm = prev.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return { fromDate: vnStartIso(py, pm, 1), toDate: vnEndIso(py, pm, lastDay) };
    }
    case 'thisYear':
      return { fromDate: vnStartIso(y, 1, 1), toDate: vnEndIso(y, m, d) };
    default:
      return {};
  }
}

function toDateInput(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** YYYY-MM-DD cho ô Từ ngày / Đến ngày theo preset (lịch VN). */
function getPresetDateInputs(preset: DatePreset): { from: string; to: string } {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1;
  const d = vnNow.getUTCDate();

  if (preset === 'all') {
    // Chỉ prefill năm (UX) — chưa đủ ngày nên không filter API.
    return { from: `${y}--`, to: `${y}--` };
  }

  switch (preset) {
    case 'today':
      return { from: toDateInput(y, m, d), to: toDateInput(y, m, d) };
    case 'thisWeek': {
      const mondayOffset = (vnNow.getUTCDay() + 6) % 7;
      const weekStart = new Date(Date.UTC(y, m - 1, d - mondayOffset));
      return {
        from: toDateInput(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth() + 1,
          weekStart.getUTCDate()
        ),
        to: toDateInput(y, m, d),
      };
    }
    case 'thisMonth':
      return { from: toDateInput(y, m, 1), to: toDateInput(y, m, d) };
    case 'lastMonth': {
      const prev = new Date(Date.UTC(y, m - 2, 1));
      const py = prev.getUTCFullYear();
      const pm = prev.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
      return { from: toDateInput(py, pm, 1), to: toDateInput(py, pm, lastDay) };
    }
    case 'thisYear':
      return { from: toDateInput(y, 1, 1), to: toDateInput(y, m, d) };
    default:
      return { from: `${y}--`, to: `${y}--` };
  }
}

function parseDateParts(dateStr: string): { d: string; m: string; y: string } {
  if (!dateStr) return { d: '', m: '', y: '' };
  const [y, m, d] = dateStr.split('-');
  return {
    d: d ? String(Number(d)) : '',
    m: m ? String(Number(m)) : '',
    y: y ?? '',
  };
}

/** Cho phép partial (chỉ năm / năm+tháng) để UX select; chỉ full mới filter. */
function buildDateFromParts(d: string, m: string, y: string): string {
  if (!d && !m && !y) return '';
  return `${y}-${m ? pad2(Number(m)) : ''}-${d ? pad2(Number(d)) : ''}`;
}

function DrawerFilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section className={cn('space-y-3 py-5', !last && 'border-b border-slate-100')}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function drawerOptionClass(selected: boolean, className?: string) {
  return cn(
    'flex cursor-pointer items-center justify-center rounded-lg border bg-white text-center text-sm font-medium text-slate-700',
    selected ? 'border-2 border-emerald-600 text-emerald-700' : 'border border-slate-200',
    className
  );
}

function GridOption<T extends string>({
  value,
  selected,
  children,
  onSelect,
}: {
  value: T;
  selected: boolean;
  children: ReactNode;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={drawerOptionClass(selected, 'h-11 px-2')}
    >
      {children}
    </button>
  );
}

function TimePresetPills({
  value,
  onChange,
}: {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo thời gian"
      className="flex flex-wrap items-center gap-2"
    >
      {DRAWER_TIME_PRESETS.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-9 w-fit shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs font-medium',
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-900'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const DATE_PART_TRIGGER_CLASS =
  'h-10 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-600 shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:line-clamp-none [&>svg]:ml-1.5 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:opacity-50 data-[placeholder]:text-slate-400';

const DATE_PART_CONTENT_CLASS =
  'z-[120] max-h-56 min-w-[4.5rem] rounded-xl border-slate-200 bg-white shadow-lg';

function DatePartsRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { d, m, y } = parseDateParts(value);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const update = (nextD: string, nextM: string, nextY: string) => {
    onChange(buildDateFromParts(nextD, nextM, nextY));
  };

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <div className="flex w-fit max-w-full items-center gap-1.5">
        <Select value={d} onValueChange={v => update(v, m, y)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-[4.25rem]')}
            aria-label={`${label} — ngày`}
          >
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={DATE_PART_CONTENT_CLASS}>
            {days.map(day => (
              <SelectItem
                key={day}
                value={String(day)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {pad2(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 text-sm text-slate-400">/</span>
        <Select value={m} onValueChange={v => update(d, v, y)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-[4.25rem]')}
            aria-label={`${label} — tháng`}
          >
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={DATE_PART_CONTENT_CLASS}>
            {months.map(month => (
              <SelectItem
                key={month}
                value={String(month)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {pad2(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 text-sm text-slate-400">/</span>
        <Select value={y} onValueChange={v => update(d, m, v)}>
          <SelectTrigger
            className={cn(DATE_PART_TRIGGER_CLASS, 'w-28')}
            aria-label={`${label} — năm`}
          >
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className={cn(DATE_PART_CONTENT_CLASS, 'min-w-28')}
          >
            {years.map(year => (
              <SelectItem
                key={year}
                value={String(year)}
                className="cursor-pointer justify-center pl-2 pr-2"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DateToolbarFilter({
  value,
  onChange,
}: {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo thời gian tạo"
      className="inline-flex shrink-0 select-none items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {DATE_PRESETS.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={cn(
              'h-7 select-none rounded-md px-2.5 text-[0.8125rem] font-medium transition-colors',
              active ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function VerifyFilterDrawer({
  open,
  onOpenChange,
  activeCount,
  severity,
  datePreset,
  customFrom,
  customTo,
  categoryId,
  categories,
  categoriesLoading,
  onReset,
  onApply,
  onSeverityChange,
  onDatePresetChange,
  onCustomFromChange,
  onCustomToChange,
  onCategoryChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  severity: SeverityFilter;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  categoryId: string;
  categories: PollutionCategory[];
  categoriesLoading: boolean;
  onReset: () => void;
  onApply: () => void;
  onSeverityChange: (severity: SeverityFilter) => void;
  onDatePresetChange: (preset: DatePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
}) {
  const drawerCategories = categories.slice(0, 3);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-none flex-col bg-white">
        <DrawerHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 text-left">
          <DrawerTitle className="text-base font-bold text-slate-900">Bộ lọc tìm kiếm</DrawerTitle>
          <DrawerClose asChild>
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Đóng bộ lọc"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-5">
          <DrawerFilterSection title="Mức độ nghiêm trọng">
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_FILTERS.map(opt => (
                <GridOption
                  key={opt.key}
                  value={opt.key}
                  selected={severity === opt.key}
                  onSelect={onSeverityChange}
                >
                  {opt.label}
                </GridOption>
              ))}
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Thời gian">
            <div className="space-y-4">
              <TimePresetPills value={datePreset} onChange={onDatePresetChange} />
              <div className="space-y-4">
                <DatePartsRow label="Từ ngày" value={customFrom} onChange={onCustomFromChange} />
                <DatePartsRow label="Đến ngày" value={customTo} onChange={onCustomToChange} />
              </div>
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Loại ô nhiễm" last>
            <div className="grid grid-cols-3 gap-2">
              {drawerCategories.map(cat => {
                const selected = categoryId === cat.id;
                const CategoryIcon = CATEGORY_LUCIDE_ICONS[cat.code.toUpperCase()] ?? Leaf;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(selected ? '' : cat.id)}
                    className={cn(
                      'flex min-h-24 cursor-pointer flex-col items-start justify-start gap-4 rounded-lg border bg-white p-4 text-left text-slate-900',
                      selected ? 'border-2 border-emerald-600 text-emerald-700' : 'border-slate-200'
                    )}
                    title={cat.code}
                  >
                    <CategoryIcon className="size-5 shrink-0" aria-hidden />
                    <span className="line-clamp-2 text-base font-normal leading-snug">
                      {cat.nameVi}
                    </span>
                  </button>
                );
              })}
              {categoriesLoading ? (
                <div className="col-span-3 flex h-[6.5rem] items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden />
                </div>
              ) : null}
            </div>
          </DrawerFilterSection>
        </div>

        <DrawerFooter className="grid grid-cols-2 gap-3 bg-white px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={onReset}
          >
            Đặt lại
          </Button>
          <Button
            type="button"
            className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onApply}
          >
            Xem kết quả{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function formatSla(isoString: string): { text: string; overdue: boolean } {
  const due = new Date(isoString);
  const now = new Date();
  if (due < now) {
    const diffH = Math.floor((now.getTime() - due.getTime()) / 3600000);
    return { text: `Quá hạn ${diffH}h`, overdue: true };
  }
  const diffH = Math.floor((due.getTime() - now.getTime()) / 3600000);
  const diffM = Math.floor(((due.getTime() - now.getTime()) % 3600000) / 60000);
  return {
    text: `${String(diffH).padStart(2, '0')}:${String(diffM).padStart(2, '0')}`,
    overdue: false,
  };
}

function formatCreatedParts(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function CreatedCell({ iso }: { iso: string }) {
  const { date, time } = formatCreatedParts(iso);
  return (
    <span className="whitespace-nowrap text-xs tabular-nums" title={`${date} ${time}`}>
      <span className="font-medium text-slate-800">{date}</span>{' '}
      <span className="text-slate-400">{time}</span>
    </span>
  );
}

function SlaCell({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const sla = formatSla(dueAt);
  return (
    <span className={cn('text-xs font-medium', sla.overdue ? 'text-red-600' : 'text-slate-700')}>
      {sla.text}
    </span>
  );
}

/** Đưa báo cáo nghi trùng ngay dưới báo cáo gốc (cùng trang). */
function placeChildBesideParent(
  list: ReportQueueItem[],
  childId: string,
  parentId: string
): ReportQueueItem[] {
  const childIdx = list.findIndex(item => item.id === childId);
  if (childIdx < 0) return list;

  const next = [...list];
  const [child] = next.splice(childIdx, 1);
  const parentIdx = next.findIndex(item => item.id === parentId);

  if (parentIdx < 0) {
    return [child, ...next];
  }

  next.splice(parentIdx + 1, 0, child);
  return next;
}

/** Row actions — luôn hiện BadgeCheck (xác minh) + Eye (chi tiết → VerifyDetailClient). */
function VerifyRowActions({
  row,
  isVerifying,
  onVerify,
  detailHref,
}: {
  row: ReportQueueItem;
  isVerifying: boolean;
  onVerify: () => void;
  detailHref: string;
}) {
  return (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        disabled={isVerifying}
        title={row.isPossibleDuplicate ? 'Kiểm tra trùng trước khi xác minh' : 'Xác minh ngay'}
        aria-label={`Xác minh ${row.code}`}
        onClick={e => {
          e.stopPropagation();
          onVerify();
        }}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md',
          'bg-emerald-600 text-white shadow-sm',
          'transition-[background-color,box-shadow,transform] duration-150',
          'hover:bg-emerald-500 hover:shadow',
          'active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-1',
          'disabled:pointer-events-none disabled:opacity-60'
        )}
      >
        {isVerifying ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <BadgeCheck className="size-4" aria-hidden strokeWidth={2.25} />
        )}
      </button>
      <Link
        href={detailHref}
        title="Xem chi tiết"
        aria-label={`Xem chi tiết ${row.code}`}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md',
          'text-slate-600 transition-colors',
          'hover:bg-slate-100 hover:text-slate-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <Eye className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export function VerifyPageClient() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [duplicateDialogRow, setDuplicateDialogRow] = useState<ReportQueueItem | null>(null);
  const [pairFocus, setPairFocus] = useState<{ childId: string; parentId: string } | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const highlightClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyMutation = useVerifyReport();

  const yearOnlyDefaults = getPresetDateInputs('all');

  /** Filter nhanh trên toolbar — apply ngay, độc lập với drawer. */
  const [toolbarDatePreset, setToolbarDatePreset] = useState<DatePreset>('all');

  /** Filter đã apply từ drawer (severity, date, category). */
  const [applied, setApplied] = useState({
    severity: 'all' as SeverityFilter,
    datePreset: 'all' as DatePreset,
    customFrom: yearOnlyDefaults.from,
    customTo: yearOnlyDefaults.to,
    categoryId: '',
  });

  /** Filter đang chỉnh trong drawer — chỉ apply khi bấm "Xem kết quả". */
  const [draft, setDraft] = useState(applied);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      const yearDefaults = getPresetDateInputs('all');
      setDraft({
        ...applied,
        customFrom:
          applied.datePreset === 'all' && !parseDateParts(applied.customFrom).y
            ? yearDefaults.from
            : applied.customFrom,
        customTo:
          applied.datePreset === 'all' && !parseDateParts(applied.customTo).y
            ? yearDefaults.to
            : applied.customTo,
      });
    }
    setFilterOpen(open);
  };

  /** Toolbar ngoài drawer — apply ngay, reset drawer date filters. */
  const handleToolbarPresetChange = (preset: DatePreset) => {
    setToolbarDatePreset(preset);
    setApplied(prev => ({
      ...prev,
      datePreset: 'all',
      customFrom: yearOnlyDefaults.from,
      customTo: yearOnlyDefaults.to,
    }));
    setPage(1);
  };

  const handleDraftPresetChange = (preset: DatePreset) => {
    const { from, to } = getPresetDateInputs(preset);
    setDraft(prev => ({
      ...prev,
      datePreset: preset,
      customFrom: from,
      customTo: to,
    }));
  };

  const handleDraftSeverityChange = (severity: SeverityFilter) => {
    setDraft(prev => ({ ...prev, severity }));
  };

  const handleDraftCategoryChange = (nextCategoryId: string) => {
    setDraft(prev => ({ ...prev, categoryId: nextCategoryId }));
  };

  const handleDraftCustomFromChange = (value: string) => {
    setDraft(prev => ({
      ...prev,
      customFrom: value,
      ...(value ? { datePreset: 'all' as DatePreset } : {}),
    }));
  };

  const handleDraftCustomToChange = (value: string) => {
    setDraft(prev => ({
      ...prev,
      customTo: value,
      ...(value ? { datePreset: 'all' as DatePreset } : {}),
    }));
  };

  /** Đặt lại trong drawer — xóa hết filter ngay (không cần «Xem kết quả»). */
  const handleResetDraft = () => {
    const yearDefaults = getPresetDateInputs('all');
    const cleared = {
      severity: 'all' as const,
      datePreset: 'all' as DatePreset,
      customFrom: yearDefaults.from,
      customTo: yearDefaults.to,
      categoryId: '',
    };
    setDraft(cleared);
    setApplied(cleared);
    setPage(1);
    setFilterOpen(false);
  };

  /** Xóa nhanh filter đã apply — không cần mở drawer. */
  const handleClearAllFilters = () => {
    const yearDefaults = getPresetDateInputs('all');
    const cleared = {
      severity: 'all' as const,
      datePreset: 'all' as DatePreset,
      customFrom: yearDefaults.from,
      customTo: yearDefaults.to,
      categoryId: '',
    };
    setApplied(cleared);
    setDraft(cleared);
    setPage(1);
  };

  const handleApplyDraft = () => {
    setApplied(draft);
    setToolbarDatePreset('all');
    setPage(1);
    setFilterOpen(false);
  };

  const { data: catalogCategories = [], isLoading: categoriesLoading } =
    useCatalogPollutionCategories(filterOpen || Boolean(applied.categoryId));

  const countDrawerActiveFilters = (f: typeof applied) =>
    (f.severity !== 'all' ? 1 : 0) +
    (f.datePreset !== 'all' || isCompleteDateInput(f.customFrom) || isCompleteDateInput(f.customTo)
      ? 1
      : 0) +
    (f.categoryId ? 1 : 0);

  const appliedFilterCount = countDrawerActiveFilters(applied);
  const draftFilterCount = countDrawerActiveFilters(draft);

  const hasDrawerDateFilter =
    applied.datePreset !== 'all' ||
    isCompleteDateInput(applied.customFrom) ||
    isCompleteDateInput(applied.customTo);

  const effectiveDateRange = useMemo(() => {
    if (hasDrawerDateFilter) {
      return getDateRange(applied.datePreset, applied.customFrom, applied.customTo);
    }
    return getDateRange(toolbarDatePreset, '', '');
  }, [
    hasDrawerDateFilter,
    applied.datePreset,
    applied.customFrom,
    applied.customTo,
    toolbarDatePreset,
  ]);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: VERIFY_PAGE_SIZE,
      status: 'Submitted' as const,
      sortBy: 'PriorityScore' as const,
      sortDir: 'Desc' as const,
      ...(applied.severity !== 'all' ? { severity: applied.severity } : {}),
      ...effectiveDateRange,
      ...(applied.categoryId ? { categoryId: applied.categoryId } : {}),
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, applied.severity, applied.categoryId, effectiveDateRange, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, refetch } = useReportQueue(listParams);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  const displayItems = useMemo(() => {
    if (!pairFocus) return items;
    return placeChildBesideParent(items, pairFocus.childId, pairFocus.parentId);
  }, [items, pairFocus]);

  const parentIdForDialog = duplicateDialogRow?.possibleDuplicateOfReportId ?? null;
  const parentPreview = useMemo(() => {
    if (!parentIdForDialog) return null;
    const found = items.find(item => item.id === parentIdForDialog);
    if (!found) return null;
    return {
      id: found.id,
      code: found.code,
      firstImageUrl: found.firstImageUrl,
    };
  }, [items, parentIdForDialog]);

  useEffect(() => {
    return () => {
      if (highlightClearRef.current) clearTimeout(highlightClearRef.current);
    };
  }, []);

  const clearPairFocusSoon = () => {
    if (highlightClearRef.current) clearTimeout(highlightClearRef.current);
    highlightClearRef.current = setTimeout(() => {
      setHighlightedId(null);
      setPairFocus(null);
    }, 3200);
  };

  const scrollToRow = (id: string) => {
    requestAnimationFrame(() => {
      rowRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const focusDuplicatePair = (row: ReportQueueItem) => {
    const parentId = row.possibleDuplicateOfReportId;
    if (!parentId) return;

    if (highlightClearRef.current) clearTimeout(highlightClearRef.current);
    setPairFocus({ childId: row.id, parentId });
    setHighlightedId(parentId);
    setDuplicateDialogRow(row);

    // Đợi layout animation + reorder xong rồi scroll tới gốc
    window.setTimeout(() => scrollToRow(parentId), 280);
  };

  const handleQuickVerify = async (row: ReportQueueItem) => {
    if (row.isPossibleDuplicate && row.possibleDuplicateOfReportId) {
      focusDuplicatePair(row);
      return;
    }

    setVerifyingId(row.id);
    try {
      const result = await verifyMutation.mutateAsync({ reportId: row.id, body: {} });
      toastApiSuccess(result, 'Đã xác minh báo cáo.');
    } catch (error) {
      toastApiError(error, 'Không thể xác minh báo cáo.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDuplicateDialogOpenChange = (open: boolean) => {
    if (open) return;
    setDuplicateDialogRow(null);
    clearPairFocusSoon();
  };

  const handleGoToDuplicateParent = () => {
    const parentId = duplicateDialogRow?.possibleDuplicateOfReportId;
    if (!parentId) return;

    const inPage = items.some(item => item.id === parentId);
    setDuplicateDialogRow(null);

    if (!inPage) {
      setPairFocus(null);
      setHighlightedId(null);
      router.push(`/officer/verify/${parentId}`);
      return;
    }

    setHighlightedId(parentId);
    scrollToRow(parentId);
    clearPairFocusSoon();
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Xác minh</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              aria-label="Thông tin hàng đợi xác minh"
            >
              <CircleHelp className="size-4" aria-hidden />
            </button>
          </div>
          <TypewriterEffectSmooth
            words={[
              { text: 'Welcome', className: 'font-normal text-slate-500' },
              { text: 'back,', className: 'font-normal text-slate-500' },
              {
                text: fullName,
                className: 'font-medium text-slate-800 dark:text-slate-100',
              },
            ]}
            className="mt-1 my-0"
            textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
            cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
            hideCursorOnComplete
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <DateToolbarFilter
              value={hasDrawerDateFilter ? 'all' : toolbarDatePreset}
              onChange={handleToolbarPresetChange}
            />
            <Separator orientation="vertical" className="mx-0.5 h-6 shrink-0 bg-slate-400" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand"
              onClick={() => handleFilterOpenChange(true)}
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
            >
              <Filter className="size-3.5 text-brand" aria-hidden />
              Bộ lọc
              {appliedFilterCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand">
                  {appliedFilterCount}
                </span>
              ) : null}
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
            {appliedFilterCount > 0 ? (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className={cn(
                  'cursor-pointer shrink-0 text-[0.8125rem] font-medium text-slate-500',
                  'transition-[font-weight,color]',
                  'hover:font-bold hover:text-slate-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-1'
                )}
              >
                Xóa tất cả
              </button>
            ) : null}
          </div>
          <div className="relative w-72 max-w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm mã báo cáo, mô tả hoặc địa chỉ"
              className={cn(
                'h-8 w-full border-slate-200 bg-white pl-9 text-sm shadow-none',
                isFetching && !isPending && 'pr-8'
              )}
              aria-label="Tìm theo mã báo cáo, mô tả hoặc địa chỉ"
            />
            {isFetching && !isPending ? (
              <Loader2
                className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </header>

      <VerifyFilterDrawer
        open={filterOpen}
        onOpenChange={handleFilterOpenChange}
        activeCount={draftFilterCount}
        severity={draft.severity}
        datePreset={draft.datePreset}
        customFrom={draft.customFrom}
        customTo={draft.customTo}
        categoryId={draft.categoryId}
        categories={catalogCategories}
        categoriesLoading={categoriesLoading}
        onReset={handleResetDraft}
        onApply={handleApplyDraft}
        onSeverityChange={handleDraftSeverityChange}
        onDatePresetChange={handleDraftPresetChange}
        onCustomFromChange={handleDraftCustomFromChange}
        onCustomToChange={handleDraftCustomToChange}
        onCategoryChange={handleDraftCategoryChange}
      />

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <Table className="w-full min-w-4xl table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      tableCellPad(col.key, 'head'),
                      'h-auto border-0 bg-slate-100 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-8 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">Không tải được hàng đợi xác minh.</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : displayItems.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-lg font-medium text-slate-500">
                      <SaveIcon size={44} className="opacity-30" />
                      <span>Không có báo cáo</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <LayoutGroup>
                  {displayItems.map((row, rowIndex) => {
                    const isParentHighlight = highlightedId === row.id;
                    const isChildPair = pairFocus?.childId === row.id;
                    const isParentPair = pairFocus?.parentId === row.id;

                    return (
                      <motion.tr
                        key={row.id}
                        layout
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        ref={el => {
                          if (el) rowRefs.current.set(row.id, el);
                          else rowRefs.current.delete(row.id);
                        }}
                        className={cn(
                          ROW_BORDER,
                          'cursor-pointer border-b transition-[background-color,box-shadow] duration-300',
                          'hover:bg-sky-50/40',
                          (isParentPair || isChildPair) && 'bg-amber-50/70',
                          isParentHighlight &&
                            'bg-amber-50 shadow-[inset_3px_0_0_0_#f59e0b] ring-2 ring-inset ring-amber-400/70',
                          isChildPair && !isParentHighlight && 'shadow-[inset_3px_0_0_0_#fbbf24]'
                        )}
                        onClick={() => router.push(`/officer/verify/${row.id}`)}
                      >
                        {COLUMN_DEFS.map(col => (
                          <TableCell
                            key={col.key}
                            className={cn(
                              tableCellPad(col.key, 'body'),
                              'align-middle',
                              col.className,
                              col.key === 'address' && 'max-w-0'
                            )}
                            onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                          >
                            {col.key === 'actions' ? (
                              <VerifyRowActions
                                row={row}
                                isVerifying={verifyingId === row.id}
                                onVerify={() => void handleQuickVerify(row)}
                                detailHref={`/officer/verify/${row.id}`}
                              />
                            ) : (
                              renderVerifyCell(col.key, row, {
                                imagePriority: rowIndex < 2,
                              })
                            )}
                          </TableCell>
                        ))}
                      </motion.tr>
                    );
                  })}
                </LayoutGroup>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={nextPage => {
                    setPairFocus(null);
                    setHighlightedId(null);
                    setPage(nextPage);
                  }}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

      <DuplicateSuspectDialog
        row={duplicateDialogRow}
        parentPreview={parentPreview}
        open={Boolean(duplicateDialogRow)}
        onOpenChange={handleDuplicateDialogOpenChange}
        onGoToParent={handleGoToDuplicateParent}
        onResolved={() => {
          setPairFocus(null);
          setHighlightedId(null);
        }}
      />
    </>
  );
}

function renderVerifyCell(
  key: ColumnKey,
  row: ReportQueueItem,
  opts?: { imagePriority?: boolean }
) {
  switch (key) {
    case 'image':
      return (
        <ReportThumb
          url={row.firstImageUrl}
          alt={row.code}
          isPossibleDuplicate={row.isPossibleDuplicate}
          priority={opts?.imagePriority}
        />
      );
    case 'code':
      return <span className="text-xs font-medium text-slate-700">{row.code}</span>;
    case 'category':
      return <span className="text-sm text-slate-700">{row.categoryName}</span>;
    case 'severity':
      return <SeverityBadge severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'priority':
      return (
        <span className="text-xs font-medium tabular-nums text-slate-700">
          {row.priorityScore.toFixed(2)}
        </span>
      );
    case 'address':
      return (
        <span className="block min-w-0 truncate text-sm text-slate-600" title={row.address}>
          {row.address}
        </span>
      );
    case 'created':
      return <CreatedCell iso={row.createdAt} />;
    case 'verifySla':
      return <SlaCell dueAt={row.slaVerifyDueAt} />;
    case 'actions':
      return null;
    default:
      return null;
  }
}

/** Landscape thumb — size lives here (not square). ~16:9, rem tokens. */
const THUMB_FRAME =
  'relative h-9 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-10 sm:w-16';

function ReportThumb({
  url,
  alt,
  isPossibleDuplicate = false,
  priority = false,
}: {
  url: string | null;
  alt: string;
  isPossibleDuplicate?: boolean;
  /** Above-the-fold thumbs — tránh Next LCP lazy warning. */
  priority?: boolean;
}) {
  const thumb = !url ? (
    <div className={cn(THUMB_FRAME, 'flex items-center justify-center text-slate-400')}>
      <ImageIcon className="size-3.5 sm:size-4" aria-hidden />
    </div>
  ) : (
    <div className={THUMB_FRAME}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 640px) 3.5rem, 4rem"
        className="object-cover"
        unoptimized
        priority={priority}
      />
    </div>
  );

  if (!isPossibleDuplicate) return thumb;

  return (
    <div className="relative inline-flex">
      {thumb}
      <AnimatedHoverTooltip name="báo cáo trùng lặp" className="absolute -right-1.5 -top-1.5 z-10">
        <span
          className={cn(
            'inline-flex size-5 items-center justify-center',
            'rounded-full bg-amber-500 text-white shadow-sm',
            'ring-2 ring-white'
          )}
          aria-label="báo cáo trùng lặp"
        >
          <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
        </span>
      </AnimatedHoverTooltip>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <span className={cn(BADGE_BASE, REPORT_SEVERITY_BADGE_CLASSES[severity])}>
      {REPORT_SEVERITY_LABEL_VI[severity]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportQueueItem['status'] }) {
  return (
    <span className={cn(BADGE_BASE, REPORT_STATUS_BADGE_CLASSES[status])} title={status}>
      {reportStatusLabelVi(status)}
    </span>
  );
}
