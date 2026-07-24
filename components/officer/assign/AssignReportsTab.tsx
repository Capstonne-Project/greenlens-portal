'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import LayoutSidebarRightIcon from '@/components/ui/layout-sidebar-right-icon';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VerifyDetailClient } from '@/components/officer/verify/VerifyDetailClient';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAssignReportQueue } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import type { ReportSeverity } from '@/lib/api/services/fetchReport';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { ChevronDown, ImageIcon, Loader2, Search, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

const REPORT_PAGE_SIZE = 10;

/** Filter panel width when open; collapse animates to 0 then unmounts. */
const FILTER_WIDTH_OPEN = '14rem';
const FILTER_MOTION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

type DataColumnKey =
  | 'image'
  | 'code'
  | 'category'
  | 'severity'
  | 'status'
  | 'priority'
  | 'address'
  | 'created'
  | 'verifySla'
  | 'resolveSla';

type ColumnKey = 'select' | DataColumnKey;

/** Uniform horizontal pad so adjacent headers (e.g. Priority | Address) don’t collide. */
const CELL_PAD = 'px-3 py-3';

const BADGE_BASE =
  'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium';

/**
 * Widths as % of table (sum ≈ 100%). Priority widened so header isn’t flush against Address.
 */
const TABLE_COLS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'select', label: 'Chọn', className: 'w-[3%]' },
  { key: 'image', label: 'Image', className: 'w-[7%]' },
  { key: 'code', label: 'Report Code', className: 'w-[11%]' },
  { key: 'category', label: 'Category', className: 'w-[10%]' },
  { key: 'severity', label: 'Severity', className: 'w-[8%]' },
  { key: 'status', label: 'Status', className: 'w-[9%]' },
  { key: 'priority', label: 'Priority', className: 'w-[8%]' },
  { key: 'address', label: 'Address', className: 'w-[17%]' },
  { key: 'created', label: 'Created', className: 'w-[10%]' },
  { key: 'verifySla', label: 'Verify SLA', className: 'w-[9%]' },
  { key: 'resolveSla', label: 'Resolve SLA', className: 'w-[8%]' },
];

const SEVERITY_OPTIONS: Array<{ label: string; value: ReportSeverity }> = [
  { label: 'Nghiêm trọng', value: 'Critical' },
  { label: 'Cao', value: 'High' },
  { label: 'Trung bình', value: 'Medium' },
  { label: 'Thấp', value: 'Low' },
];

// ── Time filter (lịch VN UTC+7) ───────────────────────────────────────────────

type DatePreset = 'all' | 'today' | 'thisWeek' | 'thisMonth';

const TIME_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'thisWeek', label: 'Tuần này' },
  { key: 'thisMonth', label: 'Tháng này' },
];

const VN_TZ_OFFSET = '+07:00';

const pad2 = (n: number) => String(n).padStart(2, '0');

function vnStartIso(y: number, m: number, d: number): string {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00.000${VN_TZ_OFFSET}`).toISOString();
}

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

function isCompleteDateInput(dateStr: string): boolean {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  return Boolean(y && m && d);
}

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
    default:
      return {};
  }
}

function toDateInput(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

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

function buildDateFromParts(d: string, m: string, y: string): string {
  if (!d && !m && !y) return '';
  return `${y}-${m ? pad2(Number(m)) : ''}-${d ? pad2(Number(d)) : ''}`;
}

function isTimeFilterActive(preset: DatePreset, customFrom: string, customTo: string): boolean {
  return preset !== 'all' || isCompleteDateInput(customFrom) || isCompleteDateInput(customTo);
}

const SIDEBAR_DATE_TRIGGER_CLASS =
  'h-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-1 py-0 text-xs font-normal text-slate-600 shadow-none focus:ring-0 focus:ring-offset-0 [&>span]:line-clamp-none [&>svg]:ml-0.5 [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:opacity-50 data-[placeholder]:text-slate-400';

const SIDEBAR_DATE_CONTENT_CLASS =
  'z-[120] max-h-56 min-w-[3.5rem] rounded-md border-slate-200 bg-white text-xs shadow-lg';

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
      className="flex flex-wrap items-center gap-1.5"
    >
      {TIME_PRESETS.map(opt => {
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

function SidebarDatePartsRow({
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
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <div className="flex max-w-full items-center gap-1.5">
        <Select value={d} onValueChange={v => update(v, m, y)}>
          <SelectTrigger
            className={cn(SIDEBAR_DATE_TRIGGER_CLASS, 'w-[2.65rem]')}
            aria-label={`${label} — ngày`}
          >
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={SIDEBAR_DATE_CONTENT_CLASS}>
            {days.map(day => (
              <SelectItem
                key={day}
                value={String(day)}
                className="cursor-pointer justify-center py-1 pl-2 pr-2 text-xs"
              >
                {pad2(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 px-0.5 text-xs text-slate-400">/</span>
        <Select value={m} onValueChange={v => update(d, v, y)}>
          <SelectTrigger
            className={cn(SIDEBAR_DATE_TRIGGER_CLASS, 'w-[2.65rem]')}
            aria-label={`${label} — tháng`}
          >
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4} className={SIDEBAR_DATE_CONTENT_CLASS}>
            {months.map(month => (
              <SelectItem
                key={month}
                value={String(month)}
                className="cursor-pointer justify-center py-1 pl-2 pr-2 text-xs"
              >
                {pad2(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 px-0.5 text-xs text-slate-400">/</span>
        <Select value={y} onValueChange={v => update(d, m, v)}>
          <SelectTrigger
            className={cn(SIDEBAR_DATE_TRIGGER_CLASS, 'w-[3.35rem]')}
            aria-label={`${label} — năm`}
          >
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            sideOffset={4}
            className={cn(SIDEBAR_DATE_CONTENT_CLASS, 'min-w-15')}
          >
            {years.map(year => (
              <SelectItem
                key={year}
                value={String(year)}
                className="cursor-pointer justify-center py-1 pl-2 pr-2 text-xs"
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

function SlaCell({ dueAt }: { dueAt: string | null }) {
  if (!dueAt) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const sla = formatSla(dueAt);
  return (
    <span
      className={cn(
        'block min-w-0 truncate text-xs font-medium',
        sla.overdue ? 'text-red-600' : 'text-slate-700'
      )}
      title={sla.text}
    >
      {sla.text}
    </span>
  );
}

function CreatedCell({ iso }: { iso: string }) {
  const { date, time } = formatCreatedParts(iso);
  return (
    <span className="block min-w-0 truncate text-xs tabular-nums" title={`${date} ${time}`}>
      <span className="font-medium text-slate-800">{date}</span>{' '}
      <span className="text-slate-400">{time}</span>
    </span>
  );
}

/** Fills column width; aspect keeps thumb proportional without fixed rem. */
const THUMB_FRAME =
  'relative aspect-video w-full max-w-full overflow-hidden rounded-md bg-slate-100';

function ReportThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className={cn(THUMB_FRAME, 'flex items-center justify-center text-slate-400')}>
        <ImageIcon className="size-3.5 sm:size-4" aria-hidden />
      </div>
    );
  }

  return (
    <div className={THUMB_FRAME}>
      <Image src={url} alt={alt} fill sizes="10vw" className="object-cover" unoptimized />
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

function renderDataCell(key: DataColumnKey, row: ReportQueueItem) {
  switch (key) {
    case 'image':
      return <ReportThumb url={row.firstImageUrl} alt={row.code} />;
    case 'code':
      return (
        <span
          className="block min-w-0 truncate text-xs font-medium text-slate-700"
          title={row.code}
        >
          {row.code}
        </span>
      );
    case 'category':
      return (
        <span className="block min-w-0 truncate text-sm text-slate-700" title={row.categoryName}>
          {row.categoryName}
        </span>
      );
    case 'severity':
      return <SeverityBadge severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'priority':
      return (
        <span className="block min-w-0 truncate text-xs font-medium tabular-nums text-slate-700">
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
    case 'resolveSla':
      return <SlaCell dueAt={row.slaResolveDueAt} />;
    default:
      return null;
  }
}

function toggleInArray<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function FilterSection({
  title,
  activeCount,
  defaultOpen = true,
  children,
}: {
  title: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-slate-200 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between py-2.5 text-left"
      >
        <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
          {title}
          {activeCount ? <span className="text-slate-500">({activeCount})</span> : null}
        </span>
        <ChevronDown
          className={cn(
            'size-4 text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn('overflow-hidden transition-all duration-200', open ? 'max-h-96' : 'max-h-0')}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center border transition-colors',
          checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 12 12"
            className="size-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

/** Props của dialog phân công — DEO/LEO truyền component khác nhau. */
export interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  reportIds: string[];
  onAssigned?: () => void;
}

interface AssignReportsTabProps {
  /** Dialog phân công riêng theo role — tự nắm logic call API. */
  Dialog: React.ComponentType<AssignDialogProps>;
  /** Label cho hành động phân công (giữ prop API; assign qua nút toolbar). */
  actionLabel: string;
}

/**
 * Tab phân công — báo cáo Verified + Rejected từ GET /v1/reports/queue.
 */
export function AssignReportsTab({ Dialog, actionLabel: _actionLabel }: AssignReportsTabProps) {
  const yearOnlyDefaults = getPresetDateInputs('all');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReportSeverity[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState(yearOnlyDefaults.from);
  const [customTo, setCustomTo] = useState(yearOnlyDefaults.to);
  const [filterOpen, setFilterOpen] = useState(true);

  const resetPageAndSelection = () => {
    setPage(1);
    setSelected(new Set());
  };

  const handleCategoryToggle = (id: string) => {
    setCategoryId(prev => (prev === id ? '' : id));
    resetPageAndSelection();
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    const { from, to } = getPresetDateInputs(preset);
    setDatePreset(preset);
    setCustomFrom(from);
    setCustomTo(to);
    resetPageAndSelection();
  };

  const handleCustomFromChange = (value: string) => {
    setCustomFrom(value);
    if (value) setDatePreset('all');
    resetPageAndSelection();
  };

  const handleCustomToChange = (value: string) => {
    setCustomTo(value);
    if (value) setDatePreset('all');
    resetPageAndSelection();
  };

  const handleClearAllFilters = () => {
    const yearDefaults = getPresetDateInputs('all');
    setSeverityFilters([]);
    setCategoryId('');
    setDatePreset('all');
    setCustomFrom(yearDefaults.from);
    setCustomTo(yearDefaults.to);
    resetPageAndSelection();
  };

  const searchParams = useSearchParams();
  const highlightReportId = searchParams.get('highlightReportId');
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [highlightFading, setHighlightFading] = useState(false);
  const consumedHighlightRef = useRef<string | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      pageSize: REPORT_PAGE_SIZE,
      sortBy: 'PriorityScore' as const,
      sortDir: 'Desc' as const,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...getDateRange(datePreset, customFrom, customTo),
      ...(categoryId ? { categoryId } : {}),
    }),
    [page, debouncedSearch, datePreset, customFrom, customTo, categoryId]
  );

  const { data, isPending, isFetching, isError } = useAssignReportQueue(listParams);
  const { data: catalogCategories = [] } = useCatalogPollutionCategories();

  const pagination = data?.pagination;
  const timeFilterActive = isTimeFilterActive(datePreset, customFrom, customTo);
  const totalActiveFilters =
    severityFilters.length + (categoryId ? 1 : 0) + (timeFilterActive ? 1 : 0);

  const triggerHighlight = (el: HTMLTableRowElement, reportId: string) => {
    if (consumedHighlightRef.current === reportId) return;
    consumedHighlightRef.current = reportId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightFading(true), 3000);
  };

  const [assignOpen, setAssignOpen] = useState(false);

  const filtered = useMemo(() => {
    return (data?.items ?? []).filter((r: ReportQueueItem) => {
      if (severityFilters.length > 0 && !severityFilters.includes(r.severity)) return false;
      return true;
    });
  }, [data?.items, severityFilters]);

  const hasRejectedSelected = useMemo(
    () => [...selected].some(id => filtered.find(r => r.id === id)?.status === 'Rejected'),
    [selected, filtered]
  );

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const indeterminate = selected.size > 0 && selected.size < filtered.length;

  const handleAssigned = () => setSelected(new Set());

  if (detailReportId) {
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <VerifyDetailClient id={detailReportId} onBack={() => setDetailReportId(null)} />
        </div>
        <Dialog
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          reportIds={[...selected]}
          onAssigned={handleAssigned}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-4">
        {/*
          Desktop: filter absolute inset-y-0 → height always = table column (height driver).
          Mobile: stacked with max-h; inner list scrolls.
        */}
        <AnimatePresence initial={false}>
          {filterOpen ? (
            <motion.div
              key="assign-filter"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: FILTER_WIDTH_OPEN, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={FILTER_MOTION}
              className="max-h-[45dvh] shrink-0 overflow-hidden lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:max-h-none"
              style={{ willChange: 'width, opacity' }}
            >
              <aside className="flex h-full min-h-0 w-56 min-w-56 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
                <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800">Bộ lọc</span>
                  {totalActiveFilters > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
                    >
                      Xoá tất cả
                    </button>
                  ) : null}
                </div>

                <div className="shrink-0 px-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Tìm kiếm báo cáo..."
                      className={cn(
                        'h-8 border-slate-200 bg-white pl-9 text-sm shadow-none',
                        isFetching && !isPending && 'pr-8'
                      )}
                      aria-label="Tìm báo cáo phân công"
                    />
                    {isFetching && !isPending ? (
                      <Loader2
                        className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </div>

                <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                  <FilterSection title="Loại ô nhiễm" activeCount={categoryId ? 1 : 0}>
                    {catalogCategories.map(cat => (
                      <CheckItem
                        key={cat.id}
                        label={cat.nameVi}
                        checked={categoryId === cat.id}
                        onChange={() => handleCategoryToggle(cat.id)}
                      />
                    ))}
                    {catalogCategories.length === 0 && (
                      <p className="py-2 text-sm text-slate-500">Đang tải...</p>
                    )}
                  </FilterSection>

                  <FilterSection title="Mức độ nghiêm trọng" activeCount={severityFilters.length}>
                    {SEVERITY_OPTIONS.map(opt => (
                      <CheckItem
                        key={opt.value}
                        label={opt.label}
                        checked={severityFilters.includes(opt.value)}
                        onChange={() => setSeverityFilters(prev => toggleInArray(prev, opt.value))}
                      />
                    ))}
                  </FilterSection>

                  <FilterSection title="Thời gian" activeCount={timeFilterActive ? 1 : 0}>
                    <div className="space-y-3">
                      <TimePresetPills value={datePreset} onChange={handleDatePresetChange} />
                      <SidebarDatePartsRow
                        label="Từ ngày"
                        value={customFrom}
                        onChange={handleCustomFromChange}
                      />
                      <SidebarDatePartsRow
                        label="Đến ngày"
                        value={customTo}
                        onChange={handleCustomToChange}
                      />
                    </div>
                  </FilterSection>
                </div>
              </aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Table drives row height; lg margin clears space for absolute filter */}
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]',
            'transition-[margin-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            filterOpen ? 'lg:ml-60' : 'lg:ml-0'
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 sm:px-4">
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || hasRejectedSelected}
              onClick={() => setAssignOpen(true)}
              className="h-8 gap-1.5 bg-emerald-600 px-3 text-[0.8125rem] text-white hover:bg-emerald-500"
            >
              <UserPlus className="size-3.5" />
              Phân công
              {selected.size > 0 ? (
                <span className="rounded-full bg-white/20 px-1.5 text-[11px] font-semibold">
                  {selected.size}
                </span>
              ) : null}
            </Button>

            <button
              type="button"
              onClick={() => setFilterOpen(open => !open)}
              className={cn(
                'relative inline-flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
                filterOpen && 'bg-slate-100 text-slate-800'
              )}
              aria-label={filterOpen ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}
              aria-pressed={filterOpen}
              title={filterOpen ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}
            >
              <LayoutSidebarRightIcon size={18} className="text-current" />
              {!filterOpen && totalActiveFilters > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-600 text-[0.5625rem] font-semibold text-white">
                  {totalActiveFilters}
                </span>
              ) : null}
            </button>
          </div>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {TABLE_COLS.map(col => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        CELL_PAD,
                        'h-auto min-w-0 border-b border-slate-200 bg-slate-100/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                        col.className
                      )}
                    >
                      {col.key === 'select' ? (
                        <Checkbox
                          checked={indeterminate ? 'indeterminate' : allChecked}
                          onCheckedChange={() => {
                            if (allChecked || indeterminate) setSelected(new Set());
                            else setSelected(new Set(filtered.map(r => r.id)));
                          }}
                        />
                      ) : (
                        col.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_COLS.length}
                      className={cn(CELL_PAD, 'h-40 text-center')}
                    >
                      <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_COLS.length}
                      className={cn(CELL_PAD, 'h-40 text-center')}
                    >
                      <p className="text-sm text-destructive">
                        Không thể tải dữ liệu. Vui lòng thử lại.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={TABLE_COLS.length}
                      className={cn(CELL_PAD, 'h-40 text-center')}
                    >
                      <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                        <SaveIcon size={32} className="opacity-30" />
                        <span>Không có báo cáo nào</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(report => {
                    const isHighlighted = report.id === highlightReportId && !highlightFading;

                    return (
                      <TableRow
                        key={report.id}
                        ref={el => {
                          if (el) {
                            rowRefs.current.set(report.id, el);
                            if (report.id === highlightReportId) triggerHighlight(el, report.id);
                          } else {
                            rowRefs.current.delete(report.id);
                          }
                        }}
                        onClick={() => setDetailReportId(report.id)}
                        className={cn(
                          'cursor-pointer border-slate-100 transition-colors duration-700 hover:bg-sky-50/40',
                          isHighlighted && 'bg-emerald-50',
                          !isHighlighted && selected.has(report.id) && 'bg-sky-50/60'
                        )}
                      >
                        {TABLE_COLS.map(col => {
                          if (col.key === 'select') {
                            return (
                              <TableCell
                                key={col.key}
                                className={cn(CELL_PAD, 'min-w-0 align-middle', col.className)}
                                onClick={e => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={selected.has(report.id)}
                                  onCheckedChange={() =>
                                    setSelected(prev => {
                                      const next = new Set(prev);
                                      if (next.has(report.id)) next.delete(report.id);
                                      else next.add(report.id);
                                      return next;
                                    })
                                  }
                                />
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell
                              key={col.key}
                              className={cn(
                                CELL_PAD,
                                'min-w-0 max-w-0 align-middle',
                                col.className
                              )}
                            >
                              {renderDataCell(col.key, report)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination ? (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  className="w-auto"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        reportIds={[...selected]}
        onAssigned={handleAssigned}
      />
    </>
  );
}
