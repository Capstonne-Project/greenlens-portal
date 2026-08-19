'use client';

import { type ReactNode, useMemo, useState } from 'react';
import Image from 'next/image';
import { Eye, Filter, ImageIcon, Loader2, Search, Users, X } from 'lucide-react';

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
import { GreenLensLookupSpinner } from '@/components/ui/greenlens-lookup-spinner';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import { Separator } from '@/components/ui/separator';
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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useCompanyAllTeamOptions,
  useCompanyAssignments,
  useCompanyAssignmentThumbnails,
} from '@/hooks/useCompany';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  CompanyAssignmentListItem,
  CompanyAssignmentStatus,
  CompanyQueueSeverity,
} from '@/lib/api/models/company';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import {
  normalizeReportStatus,
  REPORT_STATUS_BADGE_CLASSES,
  reportStatusLabelVi,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { assignmentStatusLabel } from '@/utils/companyUi';

const PAGE_SIZE = 10;
const CLOSED_REPORT_STATUSES = ['Closed', 'Rejected'] as const;

type ColumnKey = 'code' | 'address' | 'severity' | 'created' | 'resolveSla' | 'status' | 'actions';
type DatePreset = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear';
type SeverityFilter = 'all' | CompanyQueueSeverity;
type AssignmentFilter = 'all' | CompanyAssignmentStatus;
type ReportStatusFilter = 'all' | (typeof CLOSED_REPORT_STATUSES)[number];

type AppliedFilters = {
  assignmentStatus: AssignmentFilter;
  reportStatus: ReportStatusFilter;
  severity: SeverityFilter;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
  categoryId: string;
  teamId: string;
};

const COMPANY_ASSIGNMENT_STATUSES = [
  'Assigned',
  'InProgress',
  'Completed',
  'Declined',
  'Escalated',
] as const satisfies readonly CompanyAssignmentStatus[];

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'Critical', label: REPORT_SEVERITY_LABEL_VI.Critical },
  { key: 'High', label: REPORT_SEVERITY_LABEL_VI.High },
  { key: 'Medium', label: REPORT_SEVERITY_LABEL_VI.Medium },
  { key: 'Low', label: REPORT_SEVERITY_LABEL_VI.Low },
];

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

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'code', label: 'Báo cáo', className: 'w-[30%] min-w-0 @[44rem]/verify-table:w-[32%]' },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[20%] min-w-0 max-w-0',
  },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[9%] min-w-0' },
  { key: 'created', label: 'Ngày phân công', className: 'w-[11%] min-w-0' },
  { key: 'resolveSla', label: REPORT_QUEUE_COLUMN_LABEL.resolveSla, className: 'w-[10%] min-w-0' },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[12%] min-w-0' },
  { key: 'actions', label: REPORT_QUEUE_COLUMN_LABEL.actions, className: 'w-[5rem]' },
];

const FIRST_COL: ColumnKey = 'code';
const LAST_COL: ColumnKey = 'actions';
const ROW_BORDER = 'border-b border-slate-200';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/verify-table:text-[0.6875rem]';
const THUMB_SQUARE =
  'relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80 @[44rem]/verify-table:size-10';
const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/verify-table:px-2 @[44rem]/verify-table:text-xs';

const VN_TZ_OFFSET = '+07:00';
const pad2 = (n: number) => String(n).padStart(2, '0');

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/verify-table:py-3.5' : 'py-2.5 @[44rem]/verify-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, 'ps-4 pe-1.5 @[44rem]/verify-table:ps-6 @[44rem]/verify-table:pe-2');
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/verify-table:ps-3 @[44rem]/verify-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/verify-table:px-3 @[56rem]/verify-table:px-4');
}

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

function getPresetDateInputs(preset: DatePreset): { from: string; to: string } {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = vnNow.getUTCMonth() + 1;
  const d = vnNow.getUTCDate();
  if (preset === 'all') return { from: `${y}--`, to: `${y}--` };
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
  return { d: d ? String(Number(d)) : '', m: m ? String(Number(m)) : '', y: y ?? '' };
}

function buildDateFromParts(d: string, m: string, y: string): string {
  if (!d && !m && !y) return '';
  return `${y}-${m ? pad2(Number(m)) : ''}-${d ? pad2(Number(d)) : ''}`;
}

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
  const update = (nextD: string, nextM: string, nextY: string) =>
    onChange(buildDateFromParts(nextD, nextM, nextY));

  return (
    <div>
      <span className="mb-2 block text-xs font-bold text-slate-400">{label}</span>
      <div className="flex w-fit max-w-full items-center gap-1.5">
        <Select value={d} onValueChange={v => update(v, m, y)}>
          <SelectTrigger className="h-10 w-17 rounded-xl border-slate-200">
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {days.map(day => (
              <SelectItem key={day} value={String(day)}>
                {pad2(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-400">/</span>
        <Select value={m} onValueChange={v => update(d, v, y)}>
          <SelectTrigger className="h-10 w-17 rounded-xl border-slate-200">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {months.map(month => (
              <SelectItem key={month} value={String(month)}>
                {pad2(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-400">/</span>
        <Select value={y} onValueChange={v => update(d, m, v)}>
          <SelectTrigger className="h-10 w-28 rounded-xl border-slate-200">
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
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
      className={cn(
        'flex h-11 cursor-pointer items-center justify-center rounded-lg border bg-white px-2 text-center text-sm font-medium text-slate-700',
        selected ? 'border-2 border-emerald-600 text-emerald-700' : 'border-slate-200'
      )}
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
    <div className="flex flex-wrap items-center gap-2">
      {DRAWER_TIME_PRESETS.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
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

function countActiveFilters(f: AppliedFilters): number {
  return (
    (f.assignmentStatus !== 'all' ? 1 : 0) +
    (f.reportStatus !== 'all' ? 1 : 0) +
    (f.severity !== 'all' ? 1 : 0) +
    (f.datePreset !== 'all' || isCompleteDateInput(f.customFrom) || isCompleteDateInput(f.customTo)
      ? 1
      : 0) +
    (f.categoryId ? 1 : 0) +
    (f.teamId ? 1 : 0)
  );
}

function createDefaultFilters(): AppliedFilters {
  const yearDefaults = getPresetDateInputs('all');
  return {
    assignmentStatus: 'all',
    reportStatus: 'all',
    severity: 'all',
    datePreset: 'all',
    customFrom: yearDefaults.from,
    customTo: yearDefaults.to,
    categoryId: '',
    teamId: '',
  };
}

type ReportRow = {
  id: string;
  code: string;
  address: string;
  categoryName: string;
  severity: CompanyQueueSeverity;
  status: string;
  assignedAt: string;
  slaResolveDueAt: string | null;
  firstImageUrl: string | null;
};

function formatCreatedParts(isoString: string): { date: string; time: string } {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
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

function ReportThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className={cn(THUMB_SQUARE, 'flex items-center justify-center text-slate-400')}>
        <ImageIcon className="size-4" aria-hidden />
      </div>
    );
  }
  return (
    <div className={THUMB_SQUARE}>
      <Image src={url} alt={alt} fill sizes="40px" className="object-cover" unoptimized />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeReportStatus(status);
  const classes =
    REPORT_STATUS_BADGE_CLASSES[normalized] ?? 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80';
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, classes)} title={reportStatusLabelVi(normalized)}>
      {reportStatusLabelVi(normalized)}
    </span>
  );
}

function ViewRowAction({ onOpen, code }: { onOpen: () => void; code: string }) {
  return (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={onOpen}
        title="Xem chi tiết"
        aria-label={`Xem chi tiết ${code}`}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md',
          'text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900'
        )}
      >
        <Eye className="size-4" aria-hidden />
      </button>
    </div>
  );
}

interface CompanyReportsListTabProps {
  onSelectReport: (reportId: string) => void;
}

export function CompanyReportsListTab({ onSelectReport }: CompanyReportsListTabProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilters>(() => createDefaultFilters());
  const [draft, setDraft] = useState<AppliedFilters>(() => createDefaultFilters());

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => setPage(1));

  const { data: categories = [], isLoading: categoriesLoading } = useCatalogPollutionCategories(
    filterOpen || Boolean(applied.categoryId)
  );
  const { options: teams, isPending: teamsLoading } = useCompanyAllTeamOptions({
    enabled: filterOpen || Boolean(applied.teamId),
  });

  const dateRange = useMemo(
    () => getDateRange(applied.datePreset, applied.customFrom, applied.customTo),
    [applied.datePreset, applied.customFrom, applied.customTo]
  );

  const listParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'assignedAt' as const,
      sortDesc: true,
      ...(applied.assignmentStatus !== 'all' ? { status: applied.assignmentStatus } : {}),
      ...(applied.reportStatus !== 'all' ? { reportStatus: applied.reportStatus } : {}),
      ...(applied.severity !== 'all' ? { severity: applied.severity } : {}),
      ...(applied.categoryId ? { categoryId: applied.categoryId } : {}),
      ...(applied.teamId ? { teamId: applied.teamId } : {}),
      ...dateRange,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, applied, dateRange, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, refetch } = useCompanyAssignments(listParams);
  const items = data?.items ?? [];
  const thumbnailMap = useCompanyAssignmentThumbnails(items);

  const rows = useMemo<ReportRow[]>(() => {
    const pickThumb = (item: CompanyAssignmentListItem): string | null =>
      item.report.thumbnailUrl?.trim() ||
      item.report.firstMedia?.thumbnailUrl?.trim() ||
      item.report.firstMedia?.url?.trim() ||
      item.report.reportImages[0]?.thumbnailUrl?.trim() ||
      item.report.reportImages[0]?.url?.trim() ||
      thumbnailMap.get(item.report.reportId) ||
      null;

    return items
      .filter(item => {
        const normalized = normalizeReportStatus(item.report.status);
        return CLOSED_REPORT_STATUSES.includes(
          normalized as (typeof CLOSED_REPORT_STATUSES)[number]
        );
      })
      .map(item => ({
        id: item.report.reportId,
        code: item.report.code,
        address: item.report.address,
        categoryName: item.report.categoryName,
        severity: item.report.severity,
        status: item.report.status,
        assignedAt: item.assignedAt,
        slaResolveDueAt: item.report.slaResolveDueAt ?? null,
        firstImageUrl: pickThumb(item),
      }));
  }, [items, thumbnailMap]);

  const appliedCount = countActiveFilters(applied);
  const draftCount = countActiveFilters(draft);
  const pagination = data?.pagination;

  const handleFilterOpenChange = (open: boolean) => {
    if (open) setDraft(applied);
    setFilterOpen(open);
  };
  const handleApplyDraft = () => {
    setApplied(draft);
    setPage(1);
    setFilterOpen(false);
  };
  const handleResetDraft = () => {
    const cleared = createDefaultFilters();
    setDraft(cleared);
    setApplied(cleared);
    setPage(1);
    setFilterOpen(false);
  };
  const handleClearAll = () => {
    const cleared = createDefaultFilters();
    setApplied(cleared);
    setDraft(cleared);
    setPage(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 shrink-0 px-2 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              role="group"
              aria-label="Lọc nhanh theo thời gian tạo"
              className="inline-flex shrink-0 select-none items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
            >
              {DATE_PRESETS.map(opt => {
                const active = opt.key === applied.datePreset;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const { from, to } = getPresetDateInputs(opt.key);
                      setApplied(prev => ({
                        ...prev,
                        datePreset: opt.key,
                        customFrom: from,
                        customTo: to,
                      }));
                      setPage(1);
                    }}
                    className={cn(
                      'h-7 select-none rounded-md px-2.5 text-[0.8125rem] font-medium transition-colors',
                      active
                        ? 'bg-white text-brand shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <Separator orientation="vertical" className="mx-0.5 h-6 shrink-0 bg-slate-400" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-brand"
              onClick={() => handleFilterOpenChange(true)}
            >
              <Filter className="size-3.5 text-brand" aria-hidden />
              Bộ lọc
              {appliedCount > 0 ? (
                <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand">
                  {appliedCount}
                </span>
              ) : null}
            </Button>
            {appliedCount > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="cursor-pointer shrink-0 text-[0.8125rem] font-medium text-slate-500 transition-[font-weight,color] hover:font-bold hover:text-slate-800"
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
            />
            {isFetching && !isPending ? (
              <Loader2 className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400" />
            ) : null}
          </div>
        </div>
      </div>

      <Drawer open={filterOpen} onOpenChange={handleFilterOpenChange} direction="right">
        <DrawerContent className="flex h-full max-h-none flex-col bg-white">
          <DrawerHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 text-left">
            <DrawerTitle className="text-base font-bold text-slate-900">
              Bộ lọc tìm kiếm
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-y-auto px-5">
            <DrawerFilterSection title="Trạng thái báo cáo">
              <div className="grid grid-cols-3 gap-2">
                <GridOption
                  value="all"
                  selected={draft.reportStatus === 'all'}
                  onSelect={v => setDraft(prev => ({ ...prev, reportStatus: v }))}
                >
                  Tất cả
                </GridOption>
                {CLOSED_REPORT_STATUSES.map(status => (
                  <GridOption
                    key={status}
                    value={status}
                    selected={draft.reportStatus === status}
                    onSelect={v => setDraft(prev => ({ ...prev, reportStatus: v }))}
                  >
                    {reportStatusLabelVi(status)}
                  </GridOption>
                ))}
              </div>
            </DrawerFilterSection>

            <DrawerFilterSection title="Trạng thái đội">
              <div className="grid grid-cols-3 gap-2">
                <GridOption
                  value="all"
                  selected={draft.assignmentStatus === 'all'}
                  onSelect={v => setDraft(prev => ({ ...prev, assignmentStatus: v }))}
                >
                  Tất cả
                </GridOption>
                {COMPANY_ASSIGNMENT_STATUSES.map(status => (
                  <GridOption
                    key={status}
                    value={status}
                    selected={draft.assignmentStatus === status}
                    onSelect={v => setDraft(prev => ({ ...prev, assignmentStatus: v }))}
                  >
                    {assignmentStatusLabel(status)}
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
                    onSelect={v => setDraft(prev => ({ ...prev, severity: v }))}
                  >
                    {opt.label}
                  </GridOption>
                ))}
              </div>
            </DrawerFilterSection>

            <DrawerFilterSection title="Thời gian phân công">
              <div className="space-y-4">
                <TimePresetPills
                  value={draft.datePreset}
                  onChange={datePreset => {
                    const { from, to } = getPresetDateInputs(datePreset);
                    setDraft(prev => ({ ...prev, datePreset, customFrom: from, customTo: to }));
                  }}
                />
                <DatePartsRow
                  label="Từ ngày"
                  value={draft.customFrom}
                  onChange={customFrom =>
                    setDraft(prev => ({
                      ...prev,
                      customFrom,
                      ...(customFrom ? { datePreset: 'all' as DatePreset } : {}),
                    }))
                  }
                />
                <DatePartsRow
                  label="Đến ngày"
                  value={draft.customTo}
                  onChange={customTo =>
                    setDraft(prev => ({
                      ...prev,
                      customTo,
                      ...(customTo ? { datePreset: 'all' as DatePreset } : {}),
                    }))
                  }
                />
              </div>
            </DrawerFilterSection>

            <DrawerFilterSection title="Loại ô nhiễm">
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, categoryId: '' }))}
                  className={cn(
                    'h-10 rounded-lg border px-3 text-left text-sm',
                    !draft.categoryId
                      ? 'border-2 border-emerald-600 text-emerald-700'
                      : 'border-slate-200'
                  )}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, categoryId: cat.id }))}
                    className={cn(
                      'h-10 rounded-lg border px-3 text-left text-sm',
                      draft.categoryId === cat.id
                        ? 'border-2 border-emerald-600 text-emerald-700'
                        : 'border-slate-200'
                    )}
                  >
                    {cat.nameVi}
                  </button>
                ))}
                {categoriesLoading ? (
                  <Loader2 className="mx-auto my-2 size-5 animate-spin text-slate-400" />
                ) : null}
              </div>
            </DrawerFilterSection>

            <DrawerFilterSection title="Đội phụ trách" last>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, teamId: '' }))}
                  className={cn(
                    'h-10 rounded-lg border px-3 text-left text-sm',
                    !draft.teamId
                      ? 'border-2 border-emerald-600 text-emerald-700'
                      : 'border-slate-200'
                  )}
                >
                  Tất cả
                </button>
                {teams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, teamId: team.id }))}
                    className={cn(
                      'flex h-10 items-center justify-between rounded-lg border px-3 text-left text-sm',
                      draft.teamId === team.id
                        ? 'border-2 border-emerald-600 text-emerald-700'
                        : 'border-slate-200'
                    )}
                  >
                    <span className="truncate">{team.name}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Users className="size-3.5" /> {team.memberCount}
                    </span>
                  </button>
                ))}
                {teamsLoading ? (
                  <Loader2 className="mx-auto my-2 size-5 animate-spin text-slate-400" />
                ) : null}
              </div>
            </DrawerFilterSection>
          </div>

          <DrawerFooter className="grid grid-cols-2 gap-3 bg-white px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-slate-200 text-emerald-600 hover:bg-emerald-50"
              onClick={handleResetDraft}
            >
              Đặt lại
            </Button>
            <Button
              type="button"
              className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleApplyDraft}
            >
              Xem kết quả{draftCount > 0 ? ` (${draftCount})` : ''}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="@container/verify-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
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
                    <span className={HEAD_LABEL} title={col.label}>
                      {col.label}
                    </span>
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
                    <p className="text-sm text-destructive">Không tải được danh sách báo cáo.</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-lg font-medium text-slate-500">
                      <SaveIcon size={44} className="opacity-30" />
                      <span>Không có báo cáo</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(row => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      ROW_BORDER,
                      'cursor-pointer border-b transition-colors hover:bg-sky-50/40'
                    )}
                    onClick={() => onSelectReport(row.id)}
                  >
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          tableCellPad(col.key, 'body'),
                          'align-middle',
                          col.key !== 'actions' && 'min-w-0 overflow-hidden',
                          col.className
                        )}
                        onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                      >
                        {col.key === 'actions' ? (
                          <ViewRowAction onOpen={() => onSelectReport(row.id)} code={row.code} />
                        ) : col.key === 'code' ? (
                          <div className="flex min-w-0 items-center gap-3">
                            <ReportThumb url={row.firstImageUrl} alt={row.code} />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <span className="block truncate text-[11px] font-semibold tabular-nums text-sky-700 @[44rem]/verify-table:text-xs">
                                {row.id}
                              </span>
                              <span className="block truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/verify-table:text-xs">
                                {row.code}
                              </span>
                              <p className="truncate text-[11px] leading-snug text-slate-500 @[44rem]/verify-table:text-xs">
                                {row.categoryName?.trim() || '—'}
                              </p>
                            </div>
                          </div>
                        ) : col.key === 'address' ? (
                          <span className="line-clamp-2 min-w-0 text-[11px] leading-snug text-slate-600 @[44rem]/verify-table:text-xs @[56rem]/verify-table:text-sm">
                            {row.address?.trim() || '—'}
                          </span>
                        ) : col.key === 'severity' ? (
                          <span className="block min-w-0 truncate text-[11px] font-medium leading-snug @[44rem]/verify-table:text-xs @[56rem]/verify-table:text-sm">
                            {REPORT_SEVERITY_LABEL_VI[
                              row.severity as keyof typeof REPORT_SEVERITY_LABEL_VI
                            ] ?? row.severity}
                          </span>
                        ) : col.key === 'created' ? (
                          <div className="min-w-0 space-y-0.5" title={row.assignedAt}>
                            <span className="block truncate text-[10px] font-medium leading-snug text-slate-800 @[44rem]/verify-table:text-[11px] @[56rem]/verify-table:text-xs">
                              {formatCreatedParts(row.assignedAt).date}
                            </span>
                            <span className="block truncate text-[10px] tabular-nums leading-snug text-slate-500 @[44rem]/verify-table:text-xs">
                              {formatCreatedParts(row.assignedAt).time}
                            </span>
                          </div>
                        ) : col.key === 'resolveSla' ? (
                          row.slaResolveDueAt ? (
                            <span
                              className={cn(
                                'block min-w-0 truncate text-[10px] font-medium tabular-nums leading-snug @[44rem]/verify-table:text-xs',
                                formatSla(row.slaResolveDueAt).overdue
                                  ? 'text-red-600'
                                  : 'text-slate-700'
                              )}
                            >
                              {formatSla(row.slaResolveDueAt).text}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )
                        ) : col.key === 'status' ? (
                          <StatusBadge status={row.status} />
                        ) : null}
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
                onPageChange={nextPage => setPage(nextPage)}
                className="mx-auto w-auto justify-center"
              />
            ) : null}
            <p className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
