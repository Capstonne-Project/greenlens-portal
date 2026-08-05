'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Copy, Eye, ImageIcon, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

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
import { useReopenRequests } from '@/hooks/useOfficer';
import type { ReopenRequestItem, ReopenRequestStatus } from '@/lib/api/models/reopenRequest';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 8;

type ColumnKey = 'report' | 'reason' | 'reportStatus' | 'requestedAt' | 'requestStatus' | 'actions';

type StatusTab = 'All' | ReopenRequestStatus;

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: 'All', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ duyệt' },
  { key: 'Approved', label: 'Đã duyệt' },
  { key: 'Rejected', label: 'Từ chối' },
];

const REOPEN_STATUS_LABEL: Record<ReopenRequestStatus, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
};

const REOPEN_STATUS_BADGE: Record<ReopenRequestStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  Approved: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  Rejected: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
};

const FIRST_COL: ColumnKey = 'report';
const LAST_COL: ColumnKey = 'actions';

const ROW_BORDER = 'border-b border-slate-200';

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/reopen-table:px-2 @[44rem]/reopen-table:py-0.5 @[44rem]/reopen-table:text-xs';

const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/reopen-table:text-[0.6875rem]';

const THUMB_SQUARE =
  'relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80 @[44rem]/reopen-table:size-10';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'report',
    label: 'Báo cáo',
    className: 'w-[28%] min-w-0 @[44rem]/reopen-table:w-[30%]',
  },
  {
    key: 'reason',
    label: 'Lý do',
    className: 'w-[22%] min-w-0 max-w-0',
  },
  {
    key: 'reportStatus',
    label: 'Trạng thái báo cáo',
    className: 'w-[12%] min-w-0',
  },
  {
    key: 'requestedAt',
    label: 'Ngày gửi',
    className: 'w-[12%] min-w-0',
  },
  {
    key: 'requestStatus',
    label: 'Trạng thái yêu cầu',
    className: 'w-[14%] min-w-0',
  },
  {
    key: 'actions',
    label: '',
    className: 'w-12 @[44rem]/reopen-table:w-14',
  },
];

const EMPTY_ITEMS: ReopenRequestItem[] = [];

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/reopen-table:py-3.5' : 'py-2.5 @[44rem]/reopen-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, 'ps-6 pe-2 @[44rem]/reopen-table:ps-12 @[44rem]/reopen-table:pe-3');
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/reopen-table:ps-3 @[44rem]/reopen-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/reopen-table:px-3 @[56rem]/reopen-table:px-4');
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

function formatRequestedParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: '—', time: '' };
  }
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

/** Underline động theo tab active — parity LeoStatusTabBar / Community StatusTabBar. */
function ReopenStatusTabBar({
  activeKey,
  onChange,
}: {
  activeKey: StatusTab;
  onChange: (key: StatusTab) => void;
}) {
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<StatusTab, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const syncIndicator = useCallback(() => {
    const scroll = tabsScrollRef.current;
    const active = tabRefs.current.get(activeKey);
    if (!scroll || !active) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    const scrollRect = scroll.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - scrollRect.left + scroll.scrollLeft,
      width: tabRect.width,
    });
  }, [activeKey]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator]);

  useEffect(() => {
    const scroll = tabsScrollRef.current;
    if (!scroll) return undefined;
    const observer = new ResizeObserver(() => syncIndicator());
    observer.observe(scroll);
    scroll.addEventListener('scroll', syncIndicator, { passive: true });
    window.addEventListener('resize', syncIndicator);
    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', syncIndicator);
      window.removeEventListener('resize', syncIndicator);
    };
  }, [syncIndicator]);

  return (
    <div
      ref={tabsScrollRef}
      className="relative min-w-0 flex-1 overflow-x-auto border-b border-border pb-2 scrollbar-hide"
      role="tablist"
      aria-label="Lọc yêu cầu mở lại theo trạng thái"
    >
      <div className="inline-flex items-stretch">
        {STATUS_TABS.map(tab => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              ref={node => {
                if (node) tabRefs.current.set(tab.key, node);
                else tabRefs.current.delete(tab.key);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.key)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors first:pl-0',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {indicator.width > 0 ? (
        <span
          className="pointer-events-none absolute bottom-0 z-10 h-0.5 bg-emerald-600 transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/**
 * Cột đầu kiểu Duplicates: thumb + id (link + copy) → code (+ copy).
 */
function ReportIdentityCell({
  row,
  imagePriority = false,
}: {
  row: ReopenRequestItem;
  imagePriority?: boolean;
}) {
  const url = row.firstEvidenceImageUrl;
  const detailHref = `/officer/reopen/${row.reportId}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={THUMB_SQUARE}>
        {url ? (
          <Image
            src={url}
            alt={row.reportCode}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
            priority={imagePriority}
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
            href={detailHref}
            title={row.reportId}
            onClick={e => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700 no-underline',
              '@[44rem]/reopen-table:text-xs',
              'hover:text-sky-800 hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            {row.reportId}
          </Link>
          <CopyIconButton
            value={row.reportId}
            label="Sao chép ID báo cáo"
            successMessage="Đã sao chép ID báo cáo."
          />
        </div>

        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <span
            className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/reopen-table:text-xs"
            title={row.reportCode}
          >
            {row.reportCode}
          </span>
          <CopyIconButton
            value={row.reportCode}
            label={`Sao chép mã ${row.reportCode}`}
            successMessage="Đã sao chép mã báo cáo."
          />
        </div>
      </div>
    </div>
  );
}

function ReportStatusBadge({ status }: { status: ReopenRequestItem['reportStatus'] }) {
  const label = reportStatusLabelVi(status);
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, REPORT_STATUS_BADGE_CLASSES[status])} title={label}>
      {label}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: ReopenRequestStatus }) {
  const label = REOPEN_STATUS_LABEL[status];
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, REOPEN_STATUS_BADGE[status])} title={label}>
      {label}
    </span>
  );
}

function RequestedAtCell({ iso }: { iso: string }) {
  const { date, time } = formatRequestedParts(iso);
  return (
    <div className="min-w-0 space-y-0.5" title={time ? `${date} ${time}` : date}>
      <span
        className={cn(
          'block truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/reopen-table:text-[11px] @[56rem]/reopen-table:text-xs'
        )}
      >
        {date}
      </span>
      {time ? (
        <span
          className={cn(
            'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
            '@[44rem]/reopen-table:text-xs'
          )}
        >
          {time}
        </span>
      ) : null}
    </div>
  );
}

function renderCell(key: ColumnKey, row: ReopenRequestItem, opts?: { imagePriority?: boolean }) {
  switch (key) {
    case 'report':
      return <ReportIdentityCell row={row} imagePriority={opts?.imagePriority} />;
    case 'reason':
      return (
        <span
          className={cn(
            'line-clamp-2 min-w-0 text-[11px] leading-snug wrap-break-word text-slate-600',
            '@[44rem]/reopen-table:text-xs @[56rem]/reopen-table:text-sm'
          )}
          title={row.reason}
        >
          {row.reason?.trim() || '—'}
        </span>
      );
    case 'reportStatus':
      return <ReportStatusBadge status={row.reportStatus} />;
    case 'requestStatus':
      return <RequestStatusBadge status={row.status} />;
    case 'requestedAt':
      return <RequestedAtCell iso={row.requestedAt} />;
    case 'actions':
      return null;
    default:
      return null;
  }
}

export function ReopenPageClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>('All');

  const handleStatusTabChange = (tab: StatusTab) => {
    setStatusTab(tab);
    setPage(1);
  };

  const listParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      ...(statusTab === 'All' ? {} : { status: statusTab }),
    }),
    [page, statusTab]
  );

  const { data, isPending, isError, refetch } = useReopenRequests(listParams);

  const items = data?.items ?? EMPTY_ITEMS;
  const pagination = data?.pagination;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-4 shrink-0">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-emerald-700">
            <RotateCcw className="size-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Xử lý lại</h1>
            <p className="text-xs font-normal text-slate-500">
              Duyệt yêu cầu mở lại báo cáo từ người dân để xử lý / dọn dẹp lại
            </p>
          </div>
        </div>
      </header>

      <div className="mb-3 shrink-0">
        <ReopenStatusTabBar activeKey={statusTab} onChange={handleStatusTabChange} />
      </div>

      <div className="-mx-6 flex flex-1 flex-col overflow-hidden bg-white">
        <div className="@container/reopen-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
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
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-8 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      Không tải được danh sách yêu cầu mở lại.
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
                      <span>Không có yêu cầu mở lại</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <TableRow
                    key={row.requestId}
                    className={cn(
                      ROW_BORDER,
                      'cursor-pointer border-b transition-[background-color] duration-150',
                      'hover:bg-sky-50/40'
                    )}
                    onClick={() => router.push(`/officer/reopen/${row.reportId}`)}
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
                          <div
                            className="flex items-center justify-end"
                            onClick={e => e.stopPropagation()}
                          >
                            <Link
                              href={`/officer/reopen/${row.reportId}`}
                              title="Xem chi tiết"
                              aria-label={`Xem chi tiết ${row.reportCode}`}
                              onClick={e => e.stopPropagation()}
                              className={cn(
                                'inline-flex size-7 items-center justify-center rounded-md @[44rem]/reopen-table:size-8',
                                'text-slate-600 transition-colors',
                                'hover:bg-slate-100 hover:text-slate-900',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
                              )}
                            >
                              <Eye className="size-3.5 @[44rem]/reopen-table:size-4" aria-hidden />
                            </Link>
                          </div>
                        ) : (
                          renderCell(col.key, row, { imagePriority: rowIndex < 2 })
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
              {pagination.totalItems.toLocaleString('vi-VN')} yêu cầu
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
