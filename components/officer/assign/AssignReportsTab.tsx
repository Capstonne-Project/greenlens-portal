'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
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
import { ChevronDown, ImageIcon, Loader2, MoreHorizontal, Search, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

const REPORT_PAGE_SIZE = 10;

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

type ColumnKey = 'select' | DataColumnKey | 'actions';

const CELL_PAD = 'px-3 py-3 sm:px-4';

const BADGE_BASE =
  'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium';

/** Select + Verify data columns + actions (assign-only). */
const TABLE_COLS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'select', label: 'Chọn', className: 'w-12' },
  { key: 'image', label: 'Image', className: 'w-20' },
  { key: 'code', label: 'Report Code', className: 'w-[10%]' },
  { key: 'category', label: 'Category', className: 'w-[12%]' },
  { key: 'severity', label: 'Severity', className: 'w-[10%]' },
  { key: 'status', label: 'Status', className: 'w-[10%]' },
  { key: 'priority', label: 'Priority', className: 'w-[7%]' },
  { key: 'address', label: 'Address', className: 'w-[18%]' },
  { key: 'created', label: 'Created', className: 'w-[11%]' },
  { key: 'verifySla', label: 'Verify SLA', className: 'w-[9%]' },
  { key: 'resolveSla', label: 'Resolve SLA', className: 'w-[9%]' },
  { key: 'actions', label: '', className: 'w-12' },
];

const SEVERITY_OPTIONS: Array<{ label: string; value: ReportSeverity }> = [
  { label: 'Nghiêm trọng', value: 'Critical' },
  { label: 'Cao', value: 'High' },
  { label: 'Trung bình', value: 'Medium' },
  { label: 'Thấp', value: 'Low' },
];

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
    <span className={cn('text-xs font-medium', sla.overdue ? 'text-red-600' : 'text-slate-700')}>
      {sla.text}
    </span>
  );
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
      return <span className="text-xs font-medium text-sky-700">{row.code}</span>;
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
  /** Label dropdown menu item — DEO: "Phân công đơn vị", LEO: "Phân công đội". */
  actionLabel: string;
}

/**
 * Tab phân công — báo cáo Verified + Rejected từ GET /v1/reports/queue.
 */
export function AssignReportsTab({ Dialog, actionLabel }: AssignReportsTabProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReportSeverity[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

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
    }),
    [page, debouncedSearch]
  );

  const { data, isPending, isFetching, isError } = useAssignReportQueue(listParams);
  const { data: catalogCategories = [] } = useCatalogPollutionCategories();

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalActiveFilters = severityFilters.length + categoryFilters.length;

  const triggerHighlight = (el: HTMLTableRowElement, reportId: string) => {
    if (consumedHighlightRef.current === reportId) return;
    consumedHighlightRef.current = reportId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightFading(true), 3000);
  };

  const [assignOpen, setAssignOpen] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((r: ReportQueueItem) => {
      if (severityFilters.length > 0 && !severityFilters.includes(r.severity)) return false;
      if (categoryFilters.length > 0 && !categoryFilters.includes(r.categoryCode)) return false;
      return true;
    });
  }, [items, severityFilters, categoryFilters]);

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
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Sidebar filter — layout cũ */}
        <div className="w-full shrink-0 overflow-hidden lg:w-72 lg:max-w-[35%]">
          <aside className="flex max-h-[45dvh] w-full flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)] lg:h-full lg:max-h-none lg:w-72">
            <div className="flex shrink-0 items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Bộ lọc</span>
              {totalActiveFilters > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilters([]);
                    setCategoryFilters([]);
                  }}
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
                  placeholder="Tìm mã báo cáo, địa chỉ..."
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

            <div className="scrollbar-smooth flex-1 overflow-y-auto px-4 pb-4">
              <FilterSection title="Loại ô nhiễm" activeCount={categoryFilters.length}>
                {catalogCategories.map(cat => (
                  <CheckItem
                    key={cat.code}
                    label={cat.nameVi}
                    checked={categoryFilters.includes(cat.code)}
                    onChange={() => setCategoryFilters(prev => toggleInArray(prev, cat.code))}
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
            </div>
          </aside>
        </div>

        {/* Table — layout cũ, typography giữ Verify-style */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-3 py-2 sm:px-4">
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
          </div>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <Table className="w-full min-w-4xl table-fixed border-collapse">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {TABLE_COLS.map(col => (
                    <TableHead
                      key={col.key}
                      className={cn(
                        CELL_PAD,
                        'h-auto border-b border-slate-200 bg-slate-100/80 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500',
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
                                className={cn(CELL_PAD, 'align-middle', col.className)}
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

                          if (col.key === 'actions') {
                            return (
                              <TableCell
                                key={col.key}
                                className={cn(CELL_PAD, 'align-middle text-right', col.className)}
                                onClick={e => e.stopPropagation()}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-slate-500 hover:text-slate-700"
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setDetailReportId(report.id)}>
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                    {report.status === 'Verified' && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelected(new Set([report.id]));
                                          setAssignOpen(true);
                                        }}
                                      >
                                        {actionLabel}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell
                              key={col.key}
                              className={cn(
                                CELL_PAD,
                                'align-middle',
                                col.className,
                                col.key === 'address' && 'max-w-0'
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
