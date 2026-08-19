'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  Cloud,
  Copy,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  FlaskConical,
  ImageIcon,
  Info,
  Leaf,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  firstDuplicateMediaUrl,
  formatSimilarity,
} from '@/components/officer/duplicates/DuplicateCandidateCompareDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
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
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
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
import { useDuplicateCandidates } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { DuplicateCandidateItem } from '@/lib/api/models/duplicateCandidate';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import type { ReportSeverity } from '@/lib/api/models/adminReport';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import {
  REPORT_QUEUE_STATUSES,
  REPORT_STATUS_BADGE_CLASSES,
  reportStatusLabelVi,
  type ReportQueueStatus,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { officerTrackingDetailHref } from '@/utils/officerNavigation';

const DUPLICATES_PAGE_SIZE = 5;

/** Deep-link về list trùng lặp khi back từ tracking detail. */
const DUPLICATES_LIST_PATH = '/officer/duplicates';

type ColumnKey =
  | 'report'
  | 'primary'
  | 'severity'
  | 'status'
  | 'address'
  | 'created'
  | 'similarity'
  | 'actions';

const FIRST_COL: ColumnKey = 'report';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/dup-table:py-3.5' : 'py-2.5 @[44rem]/dup-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, 'ps-6 pe-2 @[44rem]/dup-table:ps-12 @[44rem]/dup-table:pe-3');
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/dup-table:ps-3 @[44rem]/dup-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/dup-table:px-3 @[56rem]/dup-table:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

/** Traffic-light text colors for severity (no badge). */
const SEVERITY_TEXT_CLASSES: Record<ReportSeverity, string> = {
  Critical: 'text-red-700',
  High: 'text-red-600',
  Medium: 'text-orange-600',
  Low: 'text-green-600',
};

/**
 * Proportional widths (`table-fixed`) — fluid theo content area (sidebar collapse/expand).
 * Cột đầu: ảnh + stack id / code / categoryName.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'report',
    label: 'Báo cáo',
    className: 'w-[28%] min-w-0 @[44rem]/dup-table:w-[30%]',
  },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[16%] min-w-0 max-w-0',
  },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[9%] min-w-0' },
  { key: 'created', label: REPORT_QUEUE_COLUMN_LABEL.created, className: 'w-[10%] min-w-0' },
  { key: 'similarity', label: 'AI tương đồng', className: 'w-[9%] min-w-0' },
  {
    key: 'primary',
    label: 'Bản gốc',
    className: 'w-[13%] min-w-0 max-w-0',
  },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[10%] min-w-0' },
  {
    key: 'actions',
    label: '',
    className: 'w-12 @[44rem]/dup-table:w-14',
  },
];
const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/dup-table:px-2 @[44rem]/dup-table:py-0.5 @[44rem]/dup-table:text-xs';

const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/dup-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/dup-table:text-[0.6875rem]';

/** Thumbnail vuông nhỏ — khớp layout Transaction (ảnh mẫu). */
const THUMB_SQUARE =
  'relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80 @[44rem]/dup-table:size-10';

// ── Filter presets (lọc theo `createdAt`, tính theo lịch VN UTC+7) ─────────────

type DatePreset = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear';
type StatusFilter = 'all' | ReportQueueStatus;
type SeverityFilter = 'all' | ReportSeverity;

interface AppliedFilters {
  status: StatusFilter;
  severity: SeverityFilter;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  categoryId: string;
}

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
  { key: 'lastMonth', label: 'Tháng trước' },
  { key: 'thisYear', label: 'Năm nay' },
];

const DRAWER_TIME_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...REPORT_QUEUE_STATUSES.map(status => ({
    key: status as StatusFilter,
    label: reportStatusLabelVi(status),
  })),
];

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Critical', label: REPORT_SEVERITY_LABEL_VI.Critical },
  { key: 'High', label: REPORT_SEVERITY_LABEL_VI.High },
  { key: 'Medium', label: REPORT_SEVERITY_LABEL_VI.Medium },
  { key: 'Low', label: REPORT_SEVERITY_LABEL_VI.Low },
];

/** Mặc định mới nhất trước — GET .../duplicate-candidates. */
const DEFAULT_LIST_SORT = {
  sortBy: 'CreatedAt' as const,
  sortDir: 'Desc' as const,
};

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

function clearedFilters(): AppliedFilters {
  const yearDefaults = getPresetDateInputs('all');
  return {
    status: 'all',
    severity: 'all',
    datePreset: 'all',
    customFrom: yearDefaults.from,
    customTo: yearDefaults.to,
    categoryId: '',
  };
}

function countDrawerActiveFilters(f: AppliedFilters): number {
  return (
    (f.status !== 'all' ? 1 : 0) +
    (f.severity !== 'all' ? 1 : 0) +
    (f.datePreset !== 'all' || isCompleteDateInput(f.customFrom) || isCompleteDateInput(f.customTo)
      ? 1
      : 0) +
    (f.categoryId ? 1 : 0)
  );
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

function DuplicatesFilterDrawer({
  open,
  onOpenChange,
  activeCount,
  draft,
  categories,
  categoriesLoading,
  onReset,
  onApply,
  onDraftChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  draft: AppliedFilters;
  categories: PollutionCategory[];
  categoriesLoading: boolean;
  onReset: () => void;
  onApply: () => void;
  onDraftChange: (patch: Partial<AppliedFilters>) => void;
}) {
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
          <DrawerFilterSection title="Trạng thái">
            <div className="grid grid-cols-3 gap-2">
              {STATUS_FILTERS.map(opt => (
                <GridOption
                  key={opt.key}
                  value={opt.key}
                  selected={draft.status === opt.key}
                  onSelect={status => onDraftChange({ status })}
                >
                  {opt.label}
                </GridOption>
              ))}
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Mức độ nghiêm trọng">
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_FILTERS.map(opt => (
                <GridOption
                  key={opt.key}
                  value={opt.key}
                  selected={draft.severity === opt.key}
                  onSelect={severity => onDraftChange({ severity })}
                >
                  {opt.label}
                </GridOption>
              ))}
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Thời gian">
            <div className="space-y-4">
              <TimePresetPills
                value={draft.datePreset}
                onChange={datePreset => {
                  const { from, to } = getPresetDateInputs(datePreset);
                  onDraftChange({ datePreset, customFrom: from, customTo: to });
                }}
              />
              <div className="space-y-4">
                <DatePartsRow
                  label="Từ ngày"
                  value={draft.customFrom}
                  onChange={customFrom =>
                    onDraftChange({
                      customFrom,
                      ...(customFrom ? { datePreset: 'all' as DatePreset } : {}),
                    })
                  }
                />
                <DatePartsRow
                  label="Đến ngày"
                  value={draft.customTo}
                  onChange={customTo =>
                    onDraftChange({
                      customTo,
                      ...(customTo ? { datePreset: 'all' as DatePreset } : {}),
                    })
                  }
                />
              </div>
            </div>
          </DrawerFilterSection>

          <DrawerFilterSection title="Loại ô nhiễm" last>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => {
                const selected = draft.categoryId === cat.id;
                const CategoryIcon = CATEGORY_LUCIDE_ICONS[cat.code.toUpperCase()] ?? Leaf;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onDraftChange({ categoryId: selected ? '' : cat.id })}
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

async function copyText(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error('Không thể sao chép. Hãy chọn và copy thủ công.');
  }
}

function CopyIconButton({
  value,
  label,
  successMessage,
}: {
  value: string;
  label: string;
  successMessage: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={e => {
        e.stopPropagation();
        void (async () => {
          await copyText(value, successMessage);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        })();
      }}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded text-slate-400',
        'opacity-0 transition-opacity group-hover/copyrow:opacity-100',
        'hover:bg-slate-100 hover:text-slate-700',
        'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
      )}
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
    </button>
  );
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
    <div className="min-w-0 space-y-0.5" title={`${date} ${time}`}>
      <span
        className={cn(
          'block truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/dup-table:text-[11px] @[56rem]/dup-table:text-xs'
        )}
      >
        {date}
      </span>
      <span
        className={cn(
          'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
          '@[44rem]/dup-table:text-xs'
        )}
      >
        {time}
      </span>
    </div>
  );
}

function SeverityText({ severity }: { severity: DuplicateCandidateItem['severity'] }) {
  const label = REPORT_SEVERITY_LABEL_VI[severity];
  return (
    <span
      className={cn(
        'block min-w-0 truncate text-[11px] font-medium leading-snug',
        '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm',
        SEVERITY_TEXT_CLASSES[severity] ?? 'text-slate-500'
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: DuplicateCandidateItem['status'] }) {
  const label = reportStatusLabelVi(status);
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, REPORT_STATUS_BADGE_CLASSES[status])} title={label}>
      {label}
    </span>
  );
}

/**
 * Cột đầu kiểu Transaction: thumb vuông (căn giữa dọc) + stack
 * id (link xanh + copy) → code (+ copy) → categoryName (muted).
 */
function ReportIdentityCell({
  row,
  priority = false,
}: {
  row: DuplicateCandidateItem;
  priority?: boolean;
}) {
  const url = firstDuplicateMediaUrl(row.media);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={THUMB_SQUARE}>
        {url ? (
          <Image
            src={url}
            alt={row.code}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
            priority={priority}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-400">
            <ImageIcon className="size-4" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <Link
            href={`/officer/verify/${row.id}`}
            title={row.id}
            onClick={e => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700 no-underline',
              '@[44rem]/dup-table:text-xs',
              'hover:text-sky-800 hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            {row.id}
          </Link>
          <CopyIconButton
            value={row.id}
            label="Sao chép ID báo cáo"
            successMessage="Đã sao chép ID báo cáo."
          />
        </div>

        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <span
            className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/dup-table:text-xs"
            title={row.code}
          >
            {row.code}
          </span>
          <CopyIconButton
            value={row.code}
            label={`Sao chép mã ${row.code}`}
            successMessage="Đã sao chép mã báo cáo."
          />
        </div>

        <p
          className="truncate text-[11px] leading-snug text-slate-500 @[44rem]/dup-table:text-xs"
          title={row.categoryName || undefined}
        >
          {row.categoryName?.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

/** AI tương đồng — điểm % + icon Info (kiểu cột Price) kèm tooltip giải thích. */
const AI_SIMILARITY_TOOLTIP =
  'Hệ thống AI so ảnh của báo cáo này với ảnh báo cáo gốc và cho điểm từ 0% đến 100%. Điểm càng cao thì ảnh càng giống. Đây chỉ là gợi ý hỗ trợ xem xét.';

function SimilarityCell({ score }: { score: number | null }) {
  const label = formatSimilarity(score);

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
      <span
        className={cn(
          'min-w-0 truncate text-[11px] font-medium tabular-nums leading-snug text-slate-800',
          '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm'
        )}
        title={label ?? undefined}
      >
        {label ?? '—'}
      </span>
      <AnimatedHoverTooltip name={AI_SIMILARITY_TOOLTIP} wrap>
        <button
          type="button"
          aria-label="Giải thích điểm AI tương đồng"
          className={cn(
            'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-slate-400',
            'transition-colors hover:text-slate-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
          )}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </AnimatedHoverTooltip>
    </div>
  );
}

/** Cột Bản gốc — kiểu Pick Up Status: nhãn dòng 1 + code link gạch chân dòng 2. */
function PrimaryReportCell({ primary }: { primary: DuplicateCandidateItem['primary'] }) {
  if (!primary) {
    return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5">
      <p
        className={cn(
          'truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/dup-table:text-[11px] @[56rem]/dup-table:text-xs'
        )}
        title="Báo cáo gốc"
      >
        Báo cáo gốc
      </p>
      <Link
        href={officerTrackingDetailHref(primary.id, DUPLICATES_LIST_PATH)}
        title={primary.code}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-1',
          'text-[10px] tabular-nums leading-snug text-slate-600 underline underline-offset-2',
          '@[44rem]/dup-table:text-xs',
          'hover:text-sky-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{primary.code}</span>
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </Link>
    </div>
  );
}

/** Cột ⋮ — menu: Chi tiết so sánh (trang detail). */
function DuplicateRowActions({ row }: { row: DuplicateCandidateItem }) {
  return (
    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Thao tác ${row.code}`}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-slate-500',
              'transition-colors hover:bg-slate-100 hover:text-slate-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            <MoreVertical className="size-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href={`/officer/duplicates/${row.id}`}>
              <Eye className="size-4" aria-hidden />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function renderDuplicateCell(
  key: ColumnKey,
  row: DuplicateCandidateItem,
  opts?: { imagePriority?: boolean }
) {
  switch (key) {
    case 'report':
      return <ReportIdentityCell row={row} priority={opts?.imagePriority} />;
    case 'primary':
      return <PrimaryReportCell primary={row.primary} />;
    case 'similarity':
      return <SimilarityCell score={row.aiSimilarityScore} />;
    case 'severity':
      return <SeverityText severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'address':
      return (
        <span
          className={cn(
            'block min-w-0 text-[11px] leading-snug text-slate-600',
            '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm',
            'line-clamp-2 wrap-break-word whitespace-normal'
          )}
          title={row.address || undefined}
        >
          {row.address?.trim() || '—'}
        </span>
      );
    case 'created':
      return <CreatedCell iso={row.createdAt} />;
    case 'actions':
      return null;
    default:
      return null;
  }
}

export function DuplicatesPageClient() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toolbarDatePreset, setToolbarDatePreset] = useState<DatePreset>('all');
  const [applied, setApplied] = useState<AppliedFilters>(() => clearedFilters());
  const [draft, setDraft] = useState<AppliedFilters>(() => clearedFilters());

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const { data: catalogCategories = [], isLoading: categoriesLoading } =
    useCatalogPollutionCategories(filterOpen || Boolean(applied.categoryId));

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
      pageSize: DUPLICATES_PAGE_SIZE,
      ...DEFAULT_LIST_SORT,
      ...(applied.status !== 'all' ? { status: applied.status } : {}),
      ...(applied.severity !== 'all' ? { severity: applied.severity } : {}),
      ...(applied.categoryId ? { categoryId: applied.categoryId } : {}),
      ...effectiveDateRange,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, applied, effectiveDateRange, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, refetch } = useDuplicateCandidates(listParams);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

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

  const handleToolbarPresetChange = (preset: DatePreset) => {
    setToolbarDatePreset(preset);
    const yearDefaults = getPresetDateInputs('all');
    setApplied(prev => ({
      ...prev,
      datePreset: 'all',
      customFrom: yearDefaults.from,
      customTo: yearDefaults.to,
    }));
    setPage(1);
  };

  const handleResetDraft = () => {
    const cleared = clearedFilters();
    setDraft(cleared);
    setApplied(cleared);
    setToolbarDatePreset('all');
    setPage(1);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    const cleared = clearedFilters();
    setApplied(cleared);
    setDraft(cleared);
    setToolbarDatePreset('all');
    setPage(1);
  };

  const handleApplyDraft = () => {
    setApplied(draft);
    setToolbarDatePreset('all');
    setPage(1);
    setFilterOpen(false);
  };

  const openDetail = (row: DuplicateCandidateItem) => {
    router.push(`/officer/duplicates/${row.id}`);
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
              <Copy className="size-7" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Trùng lặp</h1>
              <p className="text-xs font-normal text-slate-500">
                So sánh các báo cáo nghi trùng lặp để gộp hoặc giữ lại
              </p>
            </div>
          </div>
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

      <DuplicatesFilterDrawer
        open={filterOpen}
        onOpenChange={handleFilterOpenChange}
        activeCount={draftFilterCount}
        draft={draft}
        categories={catalogCategories}
        categoriesLoading={categoriesLoading}
        onReset={handleResetDraft}
        onApply={handleApplyDraft}
        onDraftChange={patch => setDraft(prev => ({ ...prev, ...patch }))}
      />

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="@container/dup-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      tableCellPad(col.key, 'head'),
                      'h-auto overflow-hidden border-0 bg-slate-100 text-left',
                      col.className
                    )}
                  >
                    {col.label ? (
                      <span className={HEAD_LABEL} title={col.label}>
                        {col.label}
                      </span>
                    ) : (
                      <span className="sr-only">Thao tác</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <GreenLensLookupSpinner className="mx-auto size-8" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      Không tải được danh sách nghi trùng lặp.
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-lg font-medium text-slate-500">
                      <SaveIcon size={44} className="opacity-30" />
                      <span>Không có báo cáo nghi trùng</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      ROW_BORDER,
                      'cursor-pointer transition-colors hover:bg-amber-50/40'
                    )}
                    onClick={() => openDetail(row)}
                  >
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          tableCellPad(col.key, 'body'),
                          'align-middle',
                          col.key !== 'report' &&
                            col.key !== 'actions' &&
                            'max-w-0 overflow-hidden',
                          col.className
                        )}
                        onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                      >
                        {col.key === 'actions' ? (
                          <DuplicateRowActions row={row} />
                        ) : (
                          renderDuplicateCell(col.key, row, {
                            imagePriority: rowIndex < 2,
                          })
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="relative flex shrink-0 items-center justify-center px-6 py-3">
            {pagination.totalPages > 1 ? (
              <PaginationSimple
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="mx-auto w-auto justify-center"
              />
            ) : null}
            <p className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo nghi trùng
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
