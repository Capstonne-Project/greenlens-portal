'use client';

import { Badge } from '@/components/ui/badge';
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
import { VerifyDetailClient } from '@/components/officer/VerifyDetailClient';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useReportQueue } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type { ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import { resolveQueueDisplayTotal } from '@/utils/officerQueueScope';
import { extractLocationLabel, formatCheckInTime } from '@/utils/officerTracking';
import { Camera, ChevronDown, MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

const REPORT_PAGE_SIZE = 10;

const TABLE_COLS = ['CHỌN', 'REPORT', 'LOẠI', 'MỨC ĐỘ', 'VỊ TRÍ', 'TRẠNG THÁI', 'HẠN XỬ LÝ'];

const SEVERITY_OPTIONS: Array<{ label: string; value: ReportSeverity }> = [
  { label: 'Nghiêm trọng', value: 'Critical' },
  { label: 'Cao', value: 'High' },
  { label: 'Trung bình', value: 'Medium' },
  { label: 'Thấp', value: 'Low' },
];

const SEVERITY_CLASS: Record<ReportSeverity, string> = {
  Critical: 'text-red-600 font-semibold',
  High: 'text-orange-600 font-semibold',
  Medium: 'text-amber-600 font-medium',
  Low: 'text-muted-foreground',
};

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

/** Badge trạng thái — chỉ cần 2 giá trị tab phân công hiển thị. */
const STATUS_LABEL: Partial<Record<ReportStatus, string>> = {
  Verified: 'Đã xác minh',
  Dispatched: 'Chờ phân công',
};

const STATUS_CLASS: Partial<Record<ReportStatus, string>> = {
  Verified: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Dispatched: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
};

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
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="flex items-center gap-1 text-base font-medium text-foreground">
          {title}
          {activeCount ? <span className="text-muted-foreground">({activeCount})</span> : null}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="pb-3">{children}</div>
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
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-base text-foreground transition-colors hover:bg-muted/50">
      <span
        className={`flex size-4 shrink-0 items-center justify-center border transition-colors ${
          checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border bg-background'
        }`}
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

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <tr key={key} className="animate-pulse border-t border-border">
          {['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].map(ck => (
            <td key={ck} className="px-5 py-4">
              <div className="h-3 w-24 rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
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
  /** Status báo cáo cần hiển thị: DEO = `Verified`, LEO = `Dispatched`. */
  status: ReportStatus;
  /** Dialog phân công riêng theo role — tự nắm logic call API. */
  Dialog: React.ComponentType<AssignDialogProps>;
  /** Label dropdown menu item — DEO: "Phân công đơn vị", LEO: "Phân công đội". */
  actionLabel: string;
}

/**
 * Tab phân công báo cáo dùng chung cho DEO/LEO.
 *
 * Khác biệt giữa role chỉ nằm ở config (`status`, `Dialog`, `actionLabel`).
 * Detail drawer dùng chung `VerifyDetailClient` cho mọi role.
 */
export function AssignReportsTab({ status, Dialog, actionLabel }: AssignReportsTabProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailReportId, setDetailReportId] = useState<string | null>(null);
  const [severityFilters, setSeverityFilters] = useState<ReportSeverity[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);

  const searchParams = useSearchParams();
  const highlightReportId = searchParams.get('highlightReportId');
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const [highlightFading, setHighlightFading] = useState(false);
  const consumedHighlightRef = useRef<string | null>(null);

  const { data, isLoading, isError } = useReportQueue({
    page,
    pageSize: REPORT_PAGE_SIZE,
    // status,
  });
  const { data: catalogCategories = [] } = useCatalogPollutionCategories();

  const queueScope = useMemo(() => ({ type: 'status' as const, status }), [status]);
  const displayTotal = useMemo(
    () => resolveQueueDisplayTotal(data?.items ?? [], data?.totalCount ?? 0, queueScope),
    [data?.items, data?.totalCount, queueScope]
  );

  const totalPages = Math.max(
    1,
    // data?.pagination.totalPages ?? Math.ceil(displayTotal / REPORT_PAGE_SIZE)
    Math.ceil(displayTotal / REPORT_PAGE_SIZE)
  );
  const totalActiveFilters = severityFilters.length + categoryFilters.length;

  const triggerHighlight = (el: HTMLTableRowElement, reportId: string) => {
    if (consumedHighlightRef.current === reportId) return;
    consumedHighlightRef.current = reportId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightFading(true), 3000);
  };

  const [assignOpen, setAssignOpen] = useState(false);

  const filtered = useMemo(() => {
    return (data?.items ?? [])
      .filter(r => r.status === status)
      .filter(r => {
        if (severityFilters.length > 0 && !severityFilters.includes(r.severity)) return false;
        if (categoryFilters.length > 0 && !categoryFilters.includes(r.categoryCode)) return false;
        if (!debouncedSearch) return true;
        const q = debouncedSearch.toLowerCase();
        return r.code.toLowerCase().includes(q) || r.address.toLowerCase().includes(q);
      });
  }, [data?.items, debouncedSearch, severityFilters, categoryFilters, status]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const indeterminate = selected.size > 0 && selected.size < filtered.length;

  const handleAssigned = () => setSelected(new Set());

  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusClass = STATUS_CLASS[status] ?? 'bg-muted text-foreground';

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
        <div className="w-full shrink-0 overflow-hidden lg:w-72 lg:max-w-[35%]">
          <aside className="flex max-h-[45dvh] w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:h-full lg:max-h-none lg:w-72">
            <div className="flex shrink-0 items-center justify-between px-5 py-4">
              <span className="text-xl font-semibold text-foreground">Bộ lọc</span>
              {totalActiveFilters > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilters([]);
                    setCategoryFilters([]);
                  }}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Xoá tất cả
                </button>
              )}
            </div>

            <div className="shrink-0 px-5 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm mã báo cáo, địa chỉ..."
                  className="h-9 rounded-lg pl-9 text-sm"
                />
              </div>
            </div>

            <div className="scrollbar-smooth flex-1 overflow-y-auto px-5 pb-5">
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
                  <p className="py-2 text-sm text-muted-foreground">Đang tải...</p>
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border p-3 sm:p-4">
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setAssignOpen(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <UserPlus className="mr-1.5 size-4" />
              Phân công
              {selected.size > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs font-semibold">
                  {selected.size}
                </span>
              )}
            </Button>
            <div className="flex-1" />
          </div>

          <div className="scrollbar-smooth min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
                <tr>
                  {TABLE_COLS.map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h === 'CHỌN' ? (
                        <Checkbox
                          checked={indeterminate ? 'indeterminate' : allChecked}
                          onCheckedChange={() => {
                            if (allChecked || indeterminate) setSelected(new Set());
                            else setSelected(new Set(filtered.map(r => r.id)));
                          }}
                        />
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    THAO TÁC
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <SkeletonRows />}
                {isError && (
                  <tr>
                    <td colSpan={8} className="px-5 py-24 text-center text-sm text-destructive">
                      Không thể tải dữ liệu. Vui lòng thử lại.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-24 text-center text-sm text-muted-foreground"
                    >
                      Không có báo cáo nào phù hợp.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  !isError &&
                  filtered.map(report => {
                    const isHighlighted = report.id === highlightReportId && !highlightFading;
                    let rowClass =
                      'cursor-pointer border-t border-border transition-colors duration-700 hover:bg-muted/40';
                    if (isHighlighted) rowClass += ' bg-emerald-50';
                    else if (selected.has(report.id)) rowClass += ' bg-primary/5';

                    const location = extractLocationLabel(report.address);
                    // const resolveSla = report.slaResolveDueAt
                    //   ? formatTrackingSla(report.slaResolveDueAt)
                    //   : null;

                    return (
                      <tr
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
                        className={rowClass}
                      >
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
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
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                              <Camera className="size-4" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{report.code}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                Check-in {formatCheckInTime(report.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">{report.categoryName}</td>
                        <td className={`px-5 py-4 text-sm ${SEVERITY_CLASS[report.severity]}`}>
                          {SEVERITY_LABEL[report.severity]}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{location}</td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}
                          >
                            {statusLabel}
                          </Badge>
                        </td>
                        <td
                          className={`px-5 py-4 text-sm font-medium tabular-nums ${
                            // resolveSla?.overdue ? 'text-red-600' : 'text-foreground'
                            'text-foreground'
                          }`}
                        >
                          {/* {resolveSla?.text ?? '—'} */}
                          {'—'}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailReportId(report.id)}>
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(new Set([report.id]));
                                  setAssignOpen(true);
                                }}
                              >
                                {actionLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-end gap-3 p-3 sm:p-4">
            <PaginationSimple
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className={isLoading ? 'pointer-events-none opacity-60' : 'w-auto'}
            />
          </div>
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
