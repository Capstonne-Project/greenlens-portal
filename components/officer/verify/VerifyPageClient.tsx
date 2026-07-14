'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, CircleHelp, Filter, Loader2 } from 'lucide-react';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { Button } from '@/components/ui/button';
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
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useReportQueue } from '@/hooks/useOfficer';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import type { ReportSeverity } from '@/lib/api/models/report';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { canAccessVerifyQueue } from '@/lib/constants/officerRoles';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const VERIFY_PAGE_SIZE = 10;

type ColumnKey = 'code' | 'category' | 'address' | 'severity' | 'sla' | 'status';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  { key: 'code', label: 'Mã báo cáo', className: 'min-w-[120px]' },
  { key: 'category', label: 'Loại ô nhiễm', className: 'min-w-[140px]' },
  { key: 'address', label: 'Vị trí', className: 'min-w-[200px]' },
  { key: 'severity', label: 'Mức độ', className: 'w-[120px]' },
  { key: 'sla', label: 'Hạn xử lý', className: 'w-[110px]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[130px]' },
];

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

const SEVERITY_DOT: Record<ReportSeverity, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-amber-400',
  Low: 'bg-slate-300',
};

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

export function VerifyPageClient() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS, () => {
    setPage(1);
  });

  const listParams = useMemo(
    () => ({
      page,
      pageSize: VERIFY_PAGE_SIZE,
      status: 'Submitted' as const,
      sortBy: 'PriorityScore' as const,
      sortDir: 'Desc' as const,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [page, debouncedSearch]
  );

  const { data, isPending, isFetching, isError, refetch } = useReportQueue(listParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  if (!canAccessVerifyQueue(user?.systemRole)) {
    return (
      <OfficerAccessDenied
        message="Hàng đợi xác minh chỉ dành cho cán bộ văn phòng MT phường (LEO)."
        homeHref={getDefaultOfficerHomePath(user?.systemRole)}
      />
    );
  }

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
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-[0.35rem] border-slate-300 bg-white text-[0.8125rem] font-medium text-sky-700"
              disabled
              title="Sắp có"
            >
              <Filter className="size-3.5 text-sky-600" aria-hidden />
              Thêm bộ lọc
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </Button>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã báo cáo, mô tả hoặc địa chỉ"
              className="h-8 max-w-sm border-slate-200 bg-white text-sm shadow-none"
              aria-label="Tìm báo cáo cần xác minh"
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
                      'h-9 border-b border-slate-200 bg-slate-100/80 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
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
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-slate-100 hover:bg-sky-50/40"
                    onClick={() => router.push(`/officer/verify/${row.id}`)}
                  >
                    {COLUMN_DEFS.map(col => (
                      <TableCell key={col.key} className="px-3 py-7">
                        {renderVerifyCell(col.key, row)}
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

function renderVerifyCell(key: ColumnKey, row: ReportQueueItem) {
  switch (key) {
    case 'code':
      return <span className="text-xs font-medium text-sky-700">{row.code}</span>;
    case 'category':
      return <span className="text-sm text-slate-700">{row.categoryName}</span>;
    case 'address':
      return (
        <span className="block max-w-[240px] truncate text-sm text-slate-600" title={row.address}>
          {row.address}
        </span>
      );
    case 'severity':
      return <SeverityBadge severity={row.severity} />;
    case 'sla': {
      const slaDueAt = row.slaVerifyDueAt ?? row.slaResolveDueAt;
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

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span
        className={cn('inline-block size-2.5 shrink-0 rounded-full', SEVERITY_DOT[severity])}
        aria-hidden
      />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
