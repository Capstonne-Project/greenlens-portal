'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, CircleHelp, Filter, ImageIcon, Loader2 } from 'lucide-react';

import { OfficerAccessDenied } from '@/components/officer/OfficerAccessDenied';
import { Button } from '@/components/ui/button';
import { GooeyInput } from '@/components/ui/gooey-input';
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
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { getDefaultOfficerHomePath } from '@/lib/constants/officerNav';
import { canAccessVerifyQueue } from '@/lib/constants/officerRoles';
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
  | 'resolveSla';

/** Cell pad shared by header + body — rem tokens only (no arbitrary px). */
const CELL_PAD = 'px-3 py-3 sm:px-4';

/**
 * Proportional widths (`table-fixed`) so column gaps stay even across viewports.
 * Image stays rem-sized; text columns use % of table width.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
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
];

const BADGE_BASE =
  'inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium';

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
            <GooeyInput
              value={search}
              onValueChange={setSearch}
              placeholder="Tìm mã báo cáo, mô tả hoặc địa chỉ"
              collapsedWidth={180}
              expandedWidth={320}
              className="justify-start"
              endAdornment={
                isFetching && !isPending ? (
                  <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
                ) : null
              }
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/4%)]">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table className="w-full min-w-4xl table-fixed border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      CELL_PAD,
                      'h-auto border-b border-slate-200 bg-slate-100/80 text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-500',
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
                  <TableCell
                    colSpan={COLUMN_DEFS.length}
                    className={cn(CELL_PAD, 'h-40 text-center')}
                  >
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_DEFS.length}
                    className={cn(CELL_PAD, 'h-40 text-center')}
                  >
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
                  <TableCell
                    colSpan={COLUMN_DEFS.length}
                    className={cn(CELL_PAD, 'h-40 text-center')}
                  >
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
                      <TableCell
                        key={col.key}
                        className={cn(
                          CELL_PAD,
                          'align-middle',
                          col.className,
                          col.key === 'address' && 'max-w-0'
                        )}
                      >
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
    </>
  );
}

function renderVerifyCell(key: ColumnKey, row: ReportQueueItem) {
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

/** Landscape thumb — size lives here (not square). ~16:9, rem tokens. */
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
