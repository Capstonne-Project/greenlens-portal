'use client';

import { type ReactNode, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  CircleHelp,
  Cloud,
  Droplets,
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

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
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
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { useDeoMyReports } from '@/hooks/useDepartments';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  DeoMyReportItem,
  DeoMyReportsParams,
  DeoMyReportsSeverity,
  DeoMyReportsStatus,
} from '@/lib/api/models/department';
import {
  DEO_MY_REPORTS_SEVERITIES,
  DEO_MY_REPORTS_STATUSES,
  DEO_REPORTS_PAGE_SIZE,
} from '@/lib/api/models/department';
import type { PollutionCategory } from '@/lib/api/models/pollutionCategory';
import type { ReportSeverity } from '@/lib/api/models/report';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { canAccessDeoReports } from '@/lib/constants/officerRoles';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

type ColumnKey =
  | 'image'
  | 'code'
  | 'category'
  | 'severity'
  | 'status'
  | 'priority'
  | 'address'
  | 'created'
  | 'verifySla';

const FIRST_COL: ColumnKey = 'image';
const LAST_COL: ColumnKey = 'verifySla';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y = layer === 'head' ? 'py-3.5' : 'py-4';
  if (colKey === FIRST_COL) return cn('px-0', y, 'ps-12 pe-3');
  if (colKey === LAST_COL) return cn('px-0', y, 'ps-3 pe-6');
  return cn(y, 'px-3 sm:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'image', label: 'Image', className: 'w-20' },
  { key: 'code', label: 'Report Code', className: 'w-[10%]' },
  { key: 'category', label: 'Category', className: 'w-[12%]' },
  { key: 'severity', label: 'Severity', className: 'w-[10%]' },
  { key: 'status', label: 'Status', className: 'w-[10%]' },
  { key: 'priority', label: 'Priority', className: 'w-[7%]' },
  { key: 'address', label: 'Address', className: 'w-[18%]' },
  { key: 'created', label: 'Created', className: 'w-[11%]' },
  { key: 'verifySla', label: 'Verify SLA', className: 'w-[12%]' },
];

const BADGE_BASE =
  'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium';

type StatusFilter = 'all' | DeoMyReportsStatus;
type SeverityFilter = 'all' | DeoMyReportsSeverity;

/** Toolbar pills — cùng chrome DateToolbarFilter của Verify; map → query `status`. */
const STATUS_TOOLBAR: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...DEO_MY_REPORTS_STATUSES.map(status => ({
    key: status,
    label: reportStatusLabelVi(status),
  })),
];

const SEVERITY_FILTERS: { key: SeverityFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...DEO_MY_REPORTS_SEVERITIES.map(level => ({
    key: level,
    label: REPORT_SEVERITY_LABEL_VI[level],
  })),
];

const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  SMOKE: Cloud,
  WASTEWATER: Droplets,
  TRASH: Trash2,
  CHEMICAL: FlaskConical,
  NOISE: Volume2,
  SOIL: Leaf,
};

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
    selected ? 'border-2 border-brand text-brand' : 'border border-slate-200',
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

function StatusToolbarFilter({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (status: StatusFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Lọc nhanh theo trạng thái"
      className="inline-flex max-w-full shrink-0 select-none flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {STATUS_TOOLBAR.map(opt => {
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

function DeoReportsFilterDrawer({
  open,
  onOpenChange,
  activeCount,
  status,
  severity,
  categoryId,
  categories,
  categoriesLoading,
  onReset,
  onApply,
  onStatusChange,
  onSeverityChange,
  onCategoryChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  status: StatusFilter;
  severity: SeverityFilter;
  categoryId: string;
  categories: PollutionCategory[];
  categoriesLoading: boolean;
  onReset: () => void;
  onApply: () => void;
  onStatusChange: (status: StatusFilter) => void;
  onSeverityChange: (severity: SeverityFilter) => void;
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
          <DrawerFilterSection title="Trạng thái">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STATUS_TOOLBAR.map(opt => (
                <GridOption
                  key={opt.key}
                  value={opt.key}
                  selected={status === opt.key}
                  onSelect={onStatusChange}
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
                  selected={severity === opt.key}
                  onSelect={onSeverityChange}
                >
                  {opt.label}
                </GridOption>
              ))}
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
                      selected ? 'border-2 border-brand text-brand' : 'border-slate-200'
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
            className="h-11 border-slate-200 text-brand hover:bg-brand/10 hover:text-brand-dark"
            onClick={onReset}
          >
            Đặt lại
          </Button>
          <Button
            type="button"
            className="h-11 bg-brand text-brand-foreground hover:bg-brand-dark"
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
      hour12: false,
    }),
  };
}

function CreatedCell({ iso }: { iso: string }) {
  const { date, time } = formatCreatedParts(iso);
  return (
    <div className="flex flex-col gap-0.5 text-xs text-slate-600">
      <span>{date}</span>
      <span className="text-slate-400">{time}</span>
    </div>
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

const THUMB_FRAME =
  'relative h-9 w-14 shrink-0 overflow-hidden rounded-md bg-slate-100 sm:h-10 sm:w-16';

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
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 640px) 3.5rem, 4rem"
        className="object-cover"
        unoptimized
      />
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

function StatusBadge({ status }: { status: DeoMyReportsStatus }) {
  return (
    <span className={cn(BADGE_BASE, REPORT_STATUS_BADGE_CLASSES[status])} title={status}>
      {reportStatusLabelVi(status)}
    </span>
  );
}

function renderDeoReportCell(key: ColumnKey, row: DeoMyReportItem) {
  switch (key) {
    case 'image':
      return <ReportThumb url={row.firstImageUrl} alt={row.code} />;
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
        <span
          className="block min-w-0 truncate text-sm text-slate-600"
          title={row.address || row.wardName}
        >
          {row.address || row.wardName || '—'}
        </span>
      );
    case 'created':
      return <CreatedCell iso={row.createdAt} />;
    case 'verifySla':
      return <SlaCell dueAt={row.slaVerifyDueAt} />;
    default:
      return null;
  }
}

function buildDeoReportsParams(
  page: number,
  search: string,
  statusFilter: StatusFilter,
  severity: SeverityFilter,
  categoryId: string
): DeoMyReportsParams {
  const params: DeoMyReportsParams = {
    page,
    pageSize: DEO_REPORTS_PAGE_SIZE,
    sortBy: 'createdAt',
    sortDesc: true,
  };
  if (search) params.search = search;
  if (statusFilter !== 'all') params.status = statusFilter;
  if (severity !== 'all') params.severity = severity;
  if (categoryId.trim()) params.categoryId = categoryId.trim();
  return params;
}

export function DeoReportsPageClient() {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const [applied, setApplied] = useState({
    status: 'all' as StatusFilter,
    severity: 'all' as SeverityFilter,
    categoryId: '',
  });
  const [draft, setDraft] = useState(applied);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const handleFilterOpenChange = (open: boolean) => {
    if (open) setDraft(applied);
    setFilterOpen(open);
  };

  const handleToolbarStatusChange = (status: StatusFilter) => {
    setApplied(prev => ({ ...prev, status }));
    setDraft(prev => ({ ...prev, status }));
    setPage(1);
  };

  const handleResetDraft = () => {
    setDraft({ status: 'all', severity: 'all', categoryId: '' });
  };

  const handleApplyDraft = () => {
    setApplied(draft);
    setPage(1);
    setFilterOpen(false);
  };

  const { data: catalogCategories = [], isLoading: categoriesLoading } =
    useCatalogPollutionCategories(filterOpen || Boolean(applied.categoryId));

  const countDrawerActiveFilters = (f: typeof applied) =>
    (f.status !== 'all' ? 1 : 0) + (f.severity !== 'all' ? 1 : 0) + (f.categoryId ? 1 : 0);

  const appliedFilterCount = countDrawerActiveFilters(applied);
  const draftFilterCount = countDrawerActiveFilters(draft);

  const listParams = useMemo(
    () =>
      buildDeoReportsParams(
        page,
        debouncedSearch.trim(),
        applied.status,
        applied.severity,
        applied.categoryId
      ),
    [page, debouncedSearch, applied.status, applied.severity, applied.categoryId]
  );

  const { data, isPending, isFetching, isError, error, refetch } = useDeoMyReports(
    listParams,
    canAccessDeoReports(user?.systemRole)
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const departmentName = data?.departmentName;

  if (!canAccessDeoReports(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Danh sách báo cáo chỉ dành cho cán bộ Sở TNMT (DEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

  const errorMessage =
    (error as Error | undefined)?.message?.includes('404') ||
    (error as Error | undefined)?.message?.toLowerCase().includes('department')
      ? 'Chưa gán Sở TNMT cho tài khoản này.'
      : ((error as Error | undefined)?.message ?? 'Không tải được danh sách báo cáo.');

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Báo cáo</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              aria-label="Thông tin danh sách báo cáo Sở"
            >
              <CircleHelp className="size-4" aria-hidden />
            </button>
          </div>
          {departmentName ? (
            <TypewriterEffectSmooth
              words={[
                { text: 'Welcome', className: 'font-normal text-slate-500' },
                { text: 'back,', className: 'font-normal text-slate-500' },
                ...departmentName
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .map(text => ({
                    text,
                    className: 'font-medium text-slate-800 dark:text-slate-100',
                  })),
              ]}
              className="mt-1 my-0"
              textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
              cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
              hideCursorOnComplete
            />
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <StatusToolbarFilter value={applied.status} onChange={handleToolbarStatusChange} />
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
                <span className="ml-0.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-brand">
                  {appliedFilterCount}
                </span>
              ) : null}
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
          </div>
          <div className="relative w-72 max-w-full sm:w-80">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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
                className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-slate-400"
                aria-hidden
              />
            ) : null}
          </div>
        </div>
      </header>

      <DeoReportsFilterDrawer
        open={filterOpen}
        onOpenChange={handleFilterOpenChange}
        activeCount={draftFilterCount}
        status={draft.status}
        severity={draft.severity}
        categoryId={draft.categoryId}
        categories={catalogCategories}
        categoriesLoading={categoriesLoading}
        onReset={handleResetDraft}
        onApply={handleApplyDraft}
        onStatusChange={status => setDraft(prev => ({ ...prev, status }))}
        onSeverityChange={severity => setDraft(prev => ({ ...prev, severity }))}
        onCategoryChange={categoryId => setDraft(prev => ({ ...prev, categoryId }))}
      />

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="relative min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
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
                    <Loader2
                      className="mx-auto size-6 animate-spin text-slate-400"
                      aria-label="Đang tải danh sách"
                    />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      className="mt-2 text-sm font-medium text-brand hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có báo cáo</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => (
                  <TableRow key={row.id} className={cn(ROW_BORDER, 'hover:bg-brand/10')}>
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          tableCellPad(col.key, 'body'),
                          'align-middle',
                          col.className,
                          col.key === 'address' && 'max-w-0'
                        )}
                      >
                        {renderDeoReportCell(col.key, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {isFetching && !isPending && !isError ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-white/55 pt-28"
              aria-busy
              aria-live="polite"
            >
              <Loader2 className="size-6 animate-spin text-slate-400" aria-label="Đang cập nhật" />
            </div>
          ) : null}
        </div>

        {pagination ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
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
    </>
  );
}
