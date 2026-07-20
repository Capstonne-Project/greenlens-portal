'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, CircleHelp, Loader2 } from 'lucide-react';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { Button } from '@/components/ui/button';
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
import { useDeoMyReports } from '@/hooks/useDepartments';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
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
import type { ReportSeverity } from '@/lib/api/models/report';
import { canAccessDeoReports } from '@/lib/constants/officerRoles';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

type ColumnKey = 'code' | 'category' | 'address' | 'severity' | 'assignedOffice' | 'sla' | 'status';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'code', label: 'Mã báo cáo', className: 'min-w-[120px]' },
  { key: 'category', label: 'Loại ô nhiễm', className: 'min-w-[140px]' },
  { key: 'address', label: 'Vị trí', className: 'min-w-[200px]' },
  { key: 'severity', label: 'Mức độ', className: 'w-[120px]' },
  { key: 'assignedOffice', label: 'Văn phòng', className: 'min-w-[140px]' },
  { key: 'sla', label: 'Hạn xử lý', className: 'w-[110px]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[130px]' },
];

type StatusFilter = 'all' | DeoMyReportsStatus;
type SeverityFilter = 'all' | DeoMyReportsSeverity;

const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  all: 'Trạng thái',
  ...(Object.fromEntries(DEO_MY_REPORTS_STATUSES.map(s => [s, reportStatusLabelVi(s)])) as Record<
    DeoMyReportsStatus,
    string
  >),
};

const SEVERITY_FILTER_LABEL: Record<SeverityFilter, string> = {
  all: 'Mức độ',
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Nghiêm trọng',
};

const SEVERITY_DOT: Record<ReportSeverity, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-400',
  Low: 'bg-slate-300',
};

const FILTER_BTN_CLASS =
  'h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700';

function buildDeoReportsParams(
  page: number,
  search: string,
  statusFilter: StatusFilter,
  severityFilter: SeverityFilter
): DeoMyReportsParams {
  const params: DeoMyReportsParams = {
    page,
    pageSize: DEO_REPORTS_PAGE_SIZE,
    sortBy: 'createdAt',
    sortDesc: true,
  };
  if (search) params.search = search;
  if (statusFilter !== 'all') params.status = statusFilter;
  if (severityFilter !== 'all') params.severity = severityFilter;
  return params;
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

function resolveSlaDueAt(row: DeoMyReportItem): string | null {
  if (row.status === 'Submitted') {
    return row.slaVerifyDueAt ?? row.slaResolveDueAt;
  }
  return row.slaResolveDueAt ?? row.slaVerifyDueAt;
}

function renderReportCell(key: ColumnKey, row: DeoMyReportItem) {
  switch (key) {
    case 'code':
      return <span className="text-xs font-medium text-sky-700">{row.code}</span>;
    case 'category':
      return <span className="text-sm text-slate-700">{row.categoryName}</span>;
    case 'address':
      return (
        <span className="block max-w-[240px] truncate text-sm text-slate-600" title={row.address}>
          {row.address || row.wardName || '—'}
        </span>
      );
    case 'severity':
      return <SeverityBadge severity={row.severity} />;
    case 'assignedOffice':
      return (
        <span className="text-sm text-slate-700">{row.assignedOfficeName?.trim() || '—'}</span>
      );
    case 'sla': {
      const slaDueAt = resolveSlaDueAt(row);
      if (!slaDueAt) {
        return <span className="text-xs text-slate-400">—</span>;
      }
      const sla = formatSla(slaDueAt);
      return (
        <span
          className={cn('text-xs font-medium', sla.overdue ? 'text-red-600' : 'text-slate-700')}
        >
          {sla.text}
        </span>
      );
    }
    case 'status':
      return <span className="text-xs text-slate-700">{reportStatusLabelVi(row.status)}</span>;
    default:
      return null;
  }
}

function SeverityBadge({ severity }: { severity: DeoMyReportsSeverity }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span
        className={cn('inline-block size-2.5 shrink-0 rounded-full', SEVERITY_DOT[severity])}
        aria-hidden
      />
      {SEVERITY_FILTER_LABEL[severity]}
    </span>
  );
}

export function DeoReportsPageClient() {
  const user = useAuthStore(s => s.user);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const listParams = useMemo(
    () => buildDeoReportsParams(page, debouncedSearch, statusFilter, severityFilter),
    [page, debouncedSearch, statusFilter, severityFilter]
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
      <header className="mb-3 shrink-0">
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
          {departmentName ? <p className="mt-1 text-sm text-slate-500">{departmentName}</p> : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                  {STATUS_FILTER_LABEL[statusFilter]}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 w-48 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className={statusFilter === 'all' ? 'font-medium text-sky-700' : ''}
                >
                  Tất cả trạng thái
                </DropdownMenuItem>
                {DEO_MY_REPORTS_STATUSES.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={statusFilter === status ? 'font-medium text-sky-700' : ''}
                  >
                    {reportStatusLabelVi(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={FILTER_BTN_CLASS}>
                  {SEVERITY_FILTER_LABEL[severityFilter]}
                  <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={() => {
                    setSeverityFilter('all');
                    setPage(1);
                  }}
                  className={severityFilter === 'all' ? 'font-medium text-sky-700' : ''}
                >
                  Tất cả mức độ
                </DropdownMenuItem>
                {DEO_MY_REPORTS_SEVERITIES.map(level => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => {
                      setSeverityFilter(level);
                      setPage(1);
                    }}
                    className={severityFilter === level ? 'font-medium text-sky-700' : ''}
                  >
                    {SEVERITY_FILTER_LABEL[level]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm mã báo cáo, mô tả hoặc địa chỉ..."
              className="h-8 max-w-sm border-slate-200 bg-white text-sm shadow-none"
              aria-label="Tìm theo mã báo cáo, mô tả hoặc địa chỉ"
            />
            {isFetching && !isPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" aria-hidden />
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
        <div className="flex-1 overflow-auto [&_table]:border-collapse">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'h-9 border-b border-slate-200 bg-slate-50/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
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
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
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
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Không có báo cáo</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(row => (
                  <TableRow key={row.id} className="border-slate-100 hover:bg-sky-50/40">
                    {COLUMN_DEFS.map(col => (
                      <TableCell key={col.key} className="px-3 py-8">
                        {renderReportCell(col.key, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
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
    </>
  );
}
