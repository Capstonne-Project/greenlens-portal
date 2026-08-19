'use client';

import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  FlaskConical,
  FileText,
  History,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useReportInspections, useViolationRecurrenceCandidates } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { ReportInspectionSummary } from '@/lib/api/models/inspectionReport';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import type { ViolationRecurrenceCandidateItem } from '@/lib/api/models/violationRecurrenceCandidate';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportSeverity } from '@/lib/api/models/report';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import {
  inspectionShowsClosedAt,
  inspectionShowsPenaltyFields,
  inspectionSlaIsOverdue,
  inspectionStatusBadgeClass,
  inspectionStatusLabelVi,
  resolveInspectionSubjectName,
} from '@/lib/constants/inspectionStatus';
import {
  REPORT_QUEUE_STATUSES,
  REPORT_STATUS_BADGE_CLASSES,
  reportStatusLabelVi,
  type ReportQueueStatus,
} from '@/lib/constants/reportStatus';
import { violationLevelLabelVi } from '@/lib/constants/violationLevel';
import { cn } from '@/lib/utils';
import { withOfficerFromQuery } from '@/utils/officerNavigation';

const RECURRENCE_PAGE_SIZE = 10;

/** Highlight hàng sau khi quay lại list — giữ ngắn rồi fade (khớp duration-700). */
const HIGHLIGHT_HOLD_MS = 1600;
const HIGHLIGHT_CLEAR_MS = 2300;

/** Deep-link về list tái phát khi back từ tracking detail. */
const RECURRENCE_LIST_PATH = '/officer/recurrence';

type ColumnKey =
  | 'report'
  | 'prior'
  | 'severity'
  | 'status'
  | 'address'
  | 'created'
  | 'daysSince'
  | 'actions';

const FIRST_COL: ColumnKey = 'report';
const LAST_COL: ColumnKey = 'actions';

/** Padding ngang cột Báo cáo — header label & thumb cùng mép trái content. */
const FIRST_COL_PAD_X = 'ps-6 pe-2 @[44rem]/rec-table:ps-12 @[44rem]/rec-table:pe-3';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/rec-table:py-3.5' : 'py-2.5 @[44rem]/rec-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, FIRST_COL_PAD_X);
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/rec-table:ps-3 @[44rem]/rec-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/rec-table:px-3 @[56rem]/rec-table:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

/** Traffic-light text colors for severity (no badge) — khớp DuplicatesPageClient. */
const SEVERITY_TEXT_CLASSES: Record<ReportSeverity, string> = {
  Critical: 'text-red-700',
  High: 'text-red-600',
  Medium: 'text-orange-600',
  Low: 'text-green-600',
};

/**
 * Proportional widths (`table-fixed`) — cùng bố cục DuplicatesPageClient.
 * Cột `daysSince` thay slot `AI tương đồng`; cột `prior` thay slot `Bản gốc`.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'report',
    label: 'Báo cáo',
    className: 'w-[28%] min-w-0 @[44rem]/rec-table:w-[30%]',
  },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[16%] min-w-0 max-w-0',
  },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[9%] min-w-0' },
  { key: 'created', label: REPORT_QUEUE_COLUMN_LABEL.created, className: 'w-[10%] min-w-0' },
  { key: 'daysSince', label: 'Ngày từ khi đóng', className: 'w-[9%] min-w-0' },
  {
    key: 'prior',
    label: 'Báo cáo gốc',
    className: 'w-[13%] min-w-0 max-w-0',
  },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[10%] min-w-0' },
  {
    key: 'actions',
    label: '',
    className: 'w-12 @[44rem]/rec-table:w-14',
  },
];

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/rec-table:px-2 @[44rem]/rec-table:py-0.5 @[44rem]/rec-table:text-xs';

const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/rec-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/rec-table:text-[0.6875rem]';

/** Header cột — tooltip shadcn chỉ khi bị truncate (ellipsis). */
function TruncatedHeadLabel({ label }: { label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label]);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={truncated ? undefined : false}>
        <TooltipTrigger asChild>
          <span ref={ref} className={cn(HEAD_LABEL, 'cursor-pointer')}>
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const THUMB_SIZE = 'size-9 @[44rem]/rec-table:size-10';
const THUMB_SQUARE = cn(
  'relative shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80',
  THUMB_SIZE
);

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
  minDays: string;
  maxDays: string;
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

/** Mặc định mới nhất trước — GET .../violation-recurrence-candidates. */
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

function parseNonNegativeInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) return undefined;
  return n;
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
    minDays: '',
    maxDays: '',
  };
}

function countDrawerActiveFilters(f: AppliedFilters): number {
  return (
    (f.status !== 'all' ? 1 : 0) +
    (f.severity !== 'all' ? 1 : 0) +
    (f.datePreset !== 'all' || isCompleteDateInput(f.customFrom) || isCompleteDateInput(f.customTo)
      ? 1
      : 0) +
    (f.categoryId ? 1 : 0) +
    (parseNonNegativeInt(f.minDays) != null ? 1 : 0) +
    (parseNonNegativeInt(f.maxDays) != null ? 1 : 0)
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

function RecurrenceFilterDrawer({
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

          <DrawerFilterSection title="Loại ô nhiễm">
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

          <DrawerFilterSection title="Số ngày từ khi đóng prior" last>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-400">Tối thiểu</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={draft.minDays}
                  onChange={e => onDraftChange({ minDays: e.target.value })}
                  placeholder="vd. 0"
                  className="h-11 border-slate-200 bg-white shadow-none"
                  aria-label="Số ngày tối thiểu từ khi đóng prior"
                />
              </div>
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-400">Tối đa</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={draft.maxDays}
                  onChange={e => onDraftChange({ maxDays: e.target.value })}
                  placeholder="vd. 30"
                  className="h-11 border-slate-200 bg-white shadow-none"
                  aria-label="Số ngày tối đa từ khi đóng prior"
                />
              </div>
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

function firstImageUrl(media: ViolationRecurrenceMedia[] | undefined): string | null {
  if (!media?.length) return null;
  const image = media.find(m => m.type.toLowerCase().includes('image'));
  return image?.thumbnailUrl || image?.url || media[0]?.thumbnailUrl || media[0]?.url || null;
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
          '@[44rem]/rec-table:text-[11px] @[56rem]/rec-table:text-xs'
        )}
      >
        {date}
      </span>
      <span
        className={cn(
          'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
          '@[44rem]/rec-table:text-xs'
        )}
      >
        {time}
      </span>
    </div>
  );
}

function SeverityText({ severity }: { severity: ViolationRecurrenceCandidateItem['severity'] }) {
  const label = REPORT_SEVERITY_LABEL_VI[severity];
  return (
    <span
      className={cn(
        'block min-w-0 truncate text-[11px] font-medium leading-snug',
        '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
        SEVERITY_TEXT_CLASSES[severity] ?? 'text-slate-500'
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: ViolationRecurrenceCandidateItem['status'] }) {
  const label = reportStatusLabelVi(status);
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, REPORT_STATUS_BADGE_CLASSES[status])} title={label}>
      {label}
    </span>
  );
}

/**
 * Cột đầu kiểu Transaction (Duplicates): thumb vuông + stack
 * id (link xanh + copy) → code (+ copy) → categoryName (muted).
 *
 * Alignment (CustomerGo):
 * - Thumb thẳng hàng label header «BÁO CÁO» (mép content cột).
 * - Chevron lệch trái thumb một khoảng nhỏ; đóng = ngửa lên, mở = úp xuống.
 */
function ReportIdentityCell({
  row,
  priority = false,
  expandable = false,
  expanded = false,
  onToggleExpand,
}: {
  row: ViolationRecurrenceCandidateItem;
  priority?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const url = firstImageUrl(row.media);

  return (
    <div className="relative flex min-w-0 items-center gap-2.5">
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? 'Thu gọn hồ sơ xử phạt' : 'Mở hồ sơ xử phạt'}
          aria-expanded={expanded}
          onClick={e => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className={cn(
            'absolute top-1/2 right-full z-10 mr-1 -translate-y-1/2',
            'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500',
            'transition-colors hover:text-slate-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
          )}
        >
          <ChevronUp
            className={cn(
              'size-4 transition-transform duration-300 ease-out',
              expanded && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
      ) : null}

      <div className="shrink-0">
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
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <Link
            href={`/officer/verify/${row.id}?from=${encodeURIComponent('/officer/recurrence')}`}
            title={row.id}
            onClick={e => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700 no-underline',
              '@[44rem]/rec-table:text-xs',
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
            className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/rec-table:text-xs"
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
          className="truncate text-[11px] leading-snug text-slate-500 @[44rem]/rec-table:text-xs"
          title={row.categoryName || undefined}
        >
          {row.categoryName?.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

const DAYS_SINCE_TOOLTIP =
  'Số ngày từ lúc đóng báo cáo trước đó đến khi tạo báo cáo hiện tại. Càng gần ngày đóng thì mức nghi tái diễn càng cao (≤25m, cùng loại, trong 30 ngày).';

/** Slot tương đương cột AI tương đồng — hiển thị daysSinceClosed. */
function DaysSinceCell({ days }: { days: number | null | undefined }) {
  if (days == null) {
    return (
      <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
        <span className={cn(CELL_META, 'text-slate-400')}>—</span>
        <AnimatedHoverTooltip name={DAYS_SINCE_TOOLTIP} wrap>
          <button
            type="button"
            aria-label="Giải thích số ngày từ khi đóng"
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

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
      <span
        className={cn(
          'min-w-0 truncate text-[11px] font-medium tabular-nums leading-snug',
          '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
          days <= 7 ? 'text-rose-600' : days <= 30 ? 'text-orange-700' : 'text-slate-800'
        )}
        title={`${days} ngày từ khi đóng báo cáo trước`}
      >
        {days} ngày
      </span>
      <AnimatedHoverTooltip name={DAYS_SINCE_TOOLTIP} wrap>
        <button
          type="button"
          aria-label="Giải thích số ngày từ khi đóng"
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

/** Cột Báo cáo đã đóng — cùng pattern PrimaryReportCell (Duplicates). */
function PriorClosedReportCell({
  prior,
}: {
  prior: ViolationRecurrenceCandidateItem['priorClosedReport'];
}) {
  if (!prior) {
    return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5">
      <p
        className={cn(
          'truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/rec-table:text-[11px] @[56rem]/rec-table:text-xs'
        )}
        title="Báo cáo đã đóng"
      >
        Báo cáo đã đóng
      </p>
      <Link
        href={withOfficerFromQuery(`/officer/reports/${prior.id}`, RECURRENCE_LIST_PATH)}
        title={prior.code}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-1',
          'text-[10px] tabular-nums leading-snug text-slate-600 underline underline-offset-2',
          '@[44rem]/rec-table:text-xs',
          'hover:text-sky-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{prior.code}</span>
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </Link>
    </div>
  );
}

/** Cột ⋮ — menu: Chi tiết so sánh (trang detail). */
function RecurrenceRowActions({ row }: { row: ViolationRecurrenceCandidateItem }) {
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
            <Link href={`/officer/recurrence/${row.id}`}>
              <Eye className="size-4" aria-hidden />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Dòng tiền theo status (BE §6):
 * - Draft/InProgress/ClosedNoViolation → ẩn
 * - PartiallyPaid → Đã nộp X / Tổng Y
 * - PenaltyIssued+ → Đã nộp X (X có thể 0đ)
 */
function inspectionPaymentLine(inspection: ReportInspectionSummary): string | null {
  if (!inspectionShowsPenaltyFields(inspection.status)) return null;

  const paid = inspection.paidAmount ?? 0;
  const penalty = inspection.penaltyAmount;

  if (inspection.status === 'PartiallyPaid' && penalty != null) {
    return `Đã nộp ${formatVnd(paid)} / Tổng ${formatVnd(penalty)}`;
  }

  if (penalty != null) {
    return `${formatVnd(penalty)} · Đã nộp ${formatVnd(paid)}`;
  }

  return `Đã nộp ${formatVnd(paid)}`;
}

/** Đường chữ L — kéo dài thêm đúng độ cao py để sát hàng report phía trên. */
function InspectionTreeConnector() {
  return (
    <>
      {/* dọc: từ mép trên panel (bù py-4/5 + mt) → giữa icon */}
      <span
        className={cn(
          'pointer-events-none absolute bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-slate-300',
          '-top-[calc(1rem+0.125rem)] @[44rem]/rec-table:-top-[calc(1.25rem+0.125rem)]'
        )}
      />
      {/* ngang: giữa icon → mép trái FileText */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 h-px w-[calc(50%+0.625rem)] bg-slate-300" />
    </>
  );
}

/** Khung chung expand: rail chữ L + slot nội dung. */
function InspectionExpandShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'relative flex items-start gap-2.5 overflow-visible bg-slate-50/80 py-4 @[44rem]/rec-table:py-5',
        FIRST_COL_PAD_X,
        'pe-4 @[44rem]/rec-table:pe-6'
      )}
    >
      <div className={cn('relative mt-0.5 shrink-0', THUMB_SIZE)} aria-hidden>
        <InspectionTreeConnector />
      </div>
      <span
        className={cn(
          'relative z-1 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg',
          THUMB_SIZE,
          'bg-white text-slate-500 ring-1 ring-slate-200/80'
        )}
        aria-hidden
      >
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InspectionBriefLoading() {
  return (
    <InspectionExpandShell>
      <div className="space-y-1.5 py-0.5" aria-busy="true" aria-label="Đang tải hồ sơ xử phạt">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-32" />
      </div>
    </InspectionExpandShell>
  );
}

function InspectionBriefEmpty() {
  return (
    <InspectionExpandShell>
      <p className="text-[12px] text-slate-500 @[44rem]/rec-table:text-[13px]">
        Chưa có hồ sơ xử phạt
      </p>
    </InspectionExpandShell>
  );
}

function InspectionBriefError({ onRetry }: { onRetry: () => void }) {
  return (
    <InspectionExpandShell>
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-destructive">Không tải được hồ sơ xử phạt</span>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRetry();
          }}
          className="font-medium text-sky-700 hover:underline"
        >
          Thử lại
        </button>
      </div>
    </InspectionExpandShell>
  );
}

/**
 * Nested brief — layout theo UX LEO:
 * Hồ sơ xử phạt [badge nhỏ góc trên phải]
 * Đối tượng: {name|[Chưa cập nhật]} [Tái phạm?]
 * hint (nếu chưa có tên) · Người lập · Tạo
 *                            Hạn xử lý · (ngày đóng)
 */
function InspectionBriefPanel({ inspection }: { inspection: ReportInspectionSummary }) {
  const subjectName = resolveInspectionSubjectName(
    inspection.violatingEntityName,
    inspection.violatorName
  );
  const hasSubject = Boolean(subjectName);
  const statusLabel = inspectionStatusLabelVi(inspection.status);
  const showPenalty = inspectionShowsPenaltyFields(inspection.status);
  const showClosedAt = inspectionShowsClosedAt(inspection.status);
  const slaOverdue = inspectionSlaIsOverdue(inspection.status, inspection.slaInspectionDueAt);
  const paymentLine = inspectionPaymentLine(inspection);
  const officer = inspection.createdByOfficerName?.trim() || '—';
  const created = formatShortDateTime(inspection.createdAt);
  const sla = formatShortDateTime(inspection.slaInspectionDueAt);

  const metaLine = [
    `Người lập ${officer}`,
    `Tạo ${created}`,
    showPenalty ? `Mức ${violationLevelLabelVi(inspection.violationLevel)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/officer/recurrence/inspections/${inspection.id}`}
      className={cn(
        'relative flex items-start gap-2.5 overflow-visible bg-slate-50/80 py-4 @[44rem]/rec-table:py-5',
        FIRST_COL_PAD_X,
        'pe-4 @[44rem]/rec-table:pe-6',
        'transition-colors hover:bg-slate-100/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
      )}
      aria-label={`Xem chi tiết hồ sơ xử phạt — ${statusLabel}`}
      onClick={e => e.stopPropagation()}
    >
      <div className={cn('relative mt-0.5 shrink-0', THUMB_SIZE)} aria-hidden>
        <InspectionTreeConnector />
      </div>

      <span
        className={cn(
          'relative z-1 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg',
          THUMB_SIZE,
          'bg-white text-slate-500 ring-1 ring-slate-200/80'
        )}
        aria-hidden
      >
        <FileText className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Hàng 1: «Hồ sơ xử phạt» + badge nhỏ góc trên phải tiêu đề */}
          <div className="inline-flex max-w-full min-w-0 items-start gap-1.5">
            <p className="truncate text-[12px] font-semibold leading-snug text-slate-900 @[44rem]/rec-table:text-[13px]">
              Hồ sơ xử phạt
            </p>
            <span
              className={cn(
                'mt-px inline-flex max-w-[9rem] shrink-0 truncate rounded-full px-1 py-px',
                'text-[9px] font-medium leading-none tracking-tight',
                inspectionStatusBadgeClass(inspection.status)
              )}
              title={statusLabel}
            >
              {statusLabel}
            </span>
          </div>

          {/* Hàng 2: Đối tượng — luôn có nhãn rõ */}
          <div className="min-w-0">
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-snug text-slate-800 @[44rem]/rec-table:text-[13px]">
              <span className="text-slate-500">Đối tượng:</span>
              <span
                className={cn(
                  'min-w-0 font-medium',
                  hasSubject ? 'text-slate-800' : 'text-slate-500'
                )}
                title={
                  hasSubject
                    ? subjectName!
                    : 'Đối tượng: Chưa cập nhật (sẽ được Đội thanh tra bổ sung sau khi khảo sát)'
                }
              >
                {hasSubject ? subjectName : 'Chưa cập nhật'}
              </span>
              {!hasSubject ? (
                <span className="text-[11px] font-normal text-slate-400 @[44rem]/rec-table:text-xs">
                  (sẽ được Đội thanh tra bổ sung sau khi khảo sát)
                </span>
              ) : null}
              {inspection.isRepeatOffender ? (
                <span className="inline-flex shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800">
                  Tái phạm
                </span>
              ) : null}
            </p>
          </div>

          {/* Hàng 3: meta */}
          <p
            className="truncate text-[11px] text-slate-500 @[44rem]/rec-table:text-xs"
            title={metaLine}
          >
            {metaLine}
          </p>

          {paymentLine ? (
            <p
              className="truncate text-[11px] font-medium tabular-nums text-slate-700 @[44rem]/rec-table:text-xs"
              title={paymentLine}
            >
              {paymentLine}
            </p>
          ) : null}
        </div>

        {/* Cột phải: hạn xử lý + ngày đóng */}
        <div className="hidden min-w-30 shrink-0 space-y-0.5 text-right sm:block">
          <p
            className={cn(
              'text-[11px] tabular-nums @[44rem]/rec-table:text-xs',
              slaOverdue ? 'font-medium text-red-600' : 'text-slate-600'
            )}
            title={
              inspection.slaInspectionDueAt
                ? `Hạn xử lý: ${sla}${slaOverdue ? ' (quá hạn)' : ''}`
                : undefined
            }
          >
            Hạn xử lý {sla}
            {slaOverdue ? ' · Quá hạn' : ''}
          </p>
          {showClosedAt ? (
            <p
              className="text-[10px] tabular-nums text-slate-400 @[44rem]/rec-table:text-[11px]"
              title={
                inspection.closedAt
                  ? `Ngày đóng: ${formatShortDateTime(inspection.closedAt)}`
                  : undefined
              }
            >
              Ngày đóng {formatShortDateTime(inspection.closedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type ReportCellExpand = {
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

function renderRecurrenceCell(
  key: ColumnKey,
  row: ViolationRecurrenceCandidateItem,
  opts?: { imagePriority?: boolean } & ReportCellExpand
) {
  switch (key) {
    case 'report':
      return (
        <ReportIdentityCell
          row={row}
          priority={opts?.imagePriority}
          expandable={opts?.expandable}
          expanded={opts?.expanded}
          onToggleExpand={opts?.onToggleExpand}
        />
      );
    case 'prior':
      return <PriorClosedReportCell prior={row.priorClosedReport} />;
    case 'daysSince':
      return <DaysSinceCell days={row.priorClosedReport?.daysSinceClosed} />;
    case 'severity':
      return <SeverityText severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'address':
      return (
        <span
          className={cn(
            'block min-w-0 text-[11px] leading-snug text-slate-600',
            '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
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

/** Parent report + nested inspection — GET …/inspections chỉ khi expand. */
function RecurrenceCandidateRows({
  row,
  rowIndex,
  onOpenDetail,
  isHighlighted = false,
  rowRef,
}: {
  row: ViolationRecurrenceCandidateItem;
  rowIndex: number;
  onOpenDetail: (row: ViolationRecurrenceCandidateItem) => void;
  isHighlighted?: boolean;
  rowRef?: (el: HTMLTableRowElement | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    data: inspectionsData,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useReportInspections(row.id, expanded);

  const inspection = inspectionsData?.items[0] ?? null;

  return (
    <Fragment>
      <TableRow
        ref={rowRef}
        className={cn(
          'cursor-pointer transition-colors duration-700 hover:bg-orange-50/40',
          expanded ? 'border-b-0' : ROW_BORDER,
          isHighlighted && 'bg-emerald-50'
        )}
        onClick={() => onOpenDetail(row)}
      >
        {COLUMN_DEFS.map(col => (
          <TableCell
            key={col.key}
            className={cn(
              tableCellPad(col.key, 'body'),
              'align-middle',
              col.key === 'report' && 'overflow-visible',
              col.key !== 'report' && col.key !== 'actions' && 'max-w-0 overflow-hidden',
              col.className
            )}
            onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
          >
            {col.key === 'actions' ? (
              <RecurrenceRowActions row={row} />
            ) : (
              renderRecurrenceCell(col.key, row, {
                imagePriority: rowIndex < 2,
                expandable: true,
                expanded,
                onToggleExpand: () => setExpanded(v => !v),
              })
            )}
          </TableCell>
        ))}
      </TableRow>

      <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
        <TableCell colSpan={COLUMN_DEFS.length} className="p-0 align-top">
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out',
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {expanded ? (
                isPending || (isFetching && !inspectionsData) ? (
                  <InspectionBriefLoading />
                ) : isError ? (
                  <InspectionBriefError onRetry={() => void refetch()} />
                ) : inspection ? (
                  <InspectionBriefPanel inspection={inspection} />
                ) : (
                  <InspectionBriefEmpty />
                )
              ) : null}
            </div>
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

type RecurrencePageClientProps = {
  /** Hub 「Sau xử lý」 — bỏ page title; filter/table giữ nguyên. */
  embedded?: boolean;
};

export function RecurrencePageClient({ embedded = false }: RecurrencePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toolbarDatePreset, setToolbarDatePreset] = useState<DatePreset>('all');
  const [applied, setApplied] = useState<AppliedFilters>(() => clearedFilters());
  const [draft, setDraft] = useState<AppliedFilters>(() => clearedFilters());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightFading, setHighlightFading] = useState(false);
  const [latchedUrlHighlight, setLatchedUrlHighlight] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  /** Deep-link `/officer/recurrence?highlight={reportId}` — không lấy highlight của tab hồ sơ xử phạt. */
  const urlHighlight =
    searchParams.get('tab') === 'inspections'
      ? null
      : searchParams.get('highlight')?.trim() || null;

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

  const minDaysParsed = parseNonNegativeInt(applied.minDays);
  const maxDaysParsed = parseNonNegativeInt(applied.maxDays);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: RECURRENCE_PAGE_SIZE,
      ...DEFAULT_LIST_SORT,
      ...(applied.status !== 'all' ? { status: applied.status } : {}),
      ...(applied.severity !== 'all' ? { severity: applied.severity } : {}),
      ...(applied.categoryId ? { categoryId: applied.categoryId } : {}),
      ...effectiveDateRange,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(minDaysParsed != null ? { minDaysSincePriorClosed: minDaysParsed } : {}),
      ...(maxDaysParsed != null ? { maxDaysSincePriorClosed: maxDaysParsed } : {}),
    }),
    [page, applied, effectiveDateRange, debouncedSearch, minDaysParsed, maxDaysParsed]
  );

  const { data, isPending, isFetching, isError, refetch } =
    useViolationRecurrenceCandidates(listParams);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  /** Bỏ `?highlight=` khỏi URL — không setState (eslint react-hooks/set-state-in-effect). */
  useEffect(() => {
    if (!urlHighlight) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('highlight');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [urlHighlight, searchParams, router, pathname]);

  /** Tự tắt highlight — không phụ thuộc items/URL (tránh cleanup giết timer). */
  useEffect(() => {
    if (!highlightedId) return;
    const fadeTimer = window.setTimeout(() => setHighlightFading(true), HIGHLIGHT_HOLD_MS);
    const clearTimer = window.setTimeout(() => {
      setLatchedUrlHighlight(null);
      setHighlightedId(null);
      setHighlightFading(false);
    }, HIGHLIGHT_CLEAR_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedId]);

  useEffect(() => {
    if (!highlightedId || highlightFading) return;

    let cancelled = false;
    let attempts = 0;
    const tryScroll = () => {
      if (cancelled) return;
      const el = rowRefs.current.get(highlightedId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      attempts += 1;
      if (attempts < 24) requestAnimationFrame(tryScroll);
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [highlightedId, items, highlightFading]);

  if (urlHighlight && urlHighlight !== latchedUrlHighlight) {
    setLatchedUrlHighlight(urlHighlight);
    setHighlightedId(urlHighlight);
    setHighlightFading(false);
  }

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
    const minParsed = parseNonNegativeInt(draft.minDays);
    const maxParsed = parseNonNegativeInt(draft.maxDays);
    if (minParsed != null && maxParsed != null && minParsed > maxParsed) {
      toast.error('Số ngày tối thiểu không được lớn hơn số ngày tối đa.');
      return;
    }
    setApplied(draft);
    setToolbarDatePreset('all');
    setPage(1);
    setFilterOpen(false);
  };

  const openDetail = (row: ViolationRecurrenceCandidateItem) => {
    router.push(`/officer/recurrence/${row.id}`);
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        {!embedded ? (
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
                <History className="size-7" aria-hidden />
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">Tái diễn</h1>
                <p className="text-xs font-normal text-slate-500">
                  Xem xét các báo cáo nghi bị ô nhiễm tái diễn sau khi đã xử lý xong
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={cn('flex flex-wrap items-center justify-between gap-3', !embedded && 'mt-6')}
        >
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

      <RecurrenceFilterDrawer
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
        <div className="@container/rec-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
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
                    {col.key === 'daysSince' && col.label ? (
                      <TruncatedHeadLabel label={col.label} />
                    ) : col.label ? (
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
                      Không tải được danh sách nghi tái diễn.
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
                      <span>Không có báo cáo nghi tái diễn</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <RecurrenceCandidateRows
                    key={row.id}
                    row={row}
                    rowIndex={rowIndex}
                    onOpenDetail={openDetail}
                    isHighlighted={row.id === highlightedId && !highlightFading}
                    rowRef={el => {
                      if (el) rowRefs.current.set(row.id, el);
                      else rowRefs.current.delete(row.id);
                    }}
                  />
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
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo nghi tái diễn
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
