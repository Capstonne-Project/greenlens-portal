'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightLeft, CircleHelp, Eye, History, ImageIcon, Loader2 } from 'lucide-react';

import { RecurrenceCandidateCompareDialog } from '@/components/officer/recurrence/RecurrenceCandidateCompareDialog';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
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
import { useViolationRecurrenceCandidates } from '@/hooks/useOfficer';
import type { ViolationRecurrenceCandidateItem } from '@/lib/api/models/violationRecurrenceCandidate';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const RECURRENCE_PAGE_SIZE = 10;

type ColumnKey =
  | 'image'
  | 'code'
  | 'category'
  | 'severity'
  | 'status'
  | 'prior'
  | 'daysSince'
  | 'address'
  | 'created'
  | 'actions';

const FIRST_COL: ColumnKey = 'image';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/rec-table:py-3.5' : 'py-2.5 @[44rem]/rec-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, 'ps-6 pe-2 @[44rem]/rec-table:ps-12 @[44rem]/rec-table:pe-3');
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/rec-table:ps-3 @[44rem]/rec-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/rec-table:px-3 @[56rem]/rec-table:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'image',
    label: REPORT_QUEUE_COLUMN_LABEL.image,
    className: 'w-14 @[44rem]/rec-table:w-20',
  },
  { key: 'code', label: REPORT_QUEUE_COLUMN_LABEL.code, className: 'w-[10%] min-w-0' },
  { key: 'category', label: REPORT_QUEUE_COLUMN_LABEL.category, className: 'w-[11%] min-w-0' },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[8%] min-w-0' },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[9%] min-w-0' },
  { key: 'prior', label: 'Báo cáo đã đóng', className: 'w-[10%] min-w-0' },
  { key: 'daysSince', label: 'Ngày từ khi đóng', className: 'w-[9%] min-w-0' },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[15%] min-w-0 max-w-0',
  },
  { key: 'created', label: REPORT_QUEUE_COLUMN_LABEL.created, className: 'w-[10%] min-w-0' },
  {
    key: 'actions',
    label: REPORT_QUEUE_COLUMN_LABEL.actions,
    className: 'w-[4.75rem] @[44rem]/rec-table:w-[5.5rem]',
  },
];

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/rec-table:px-2 @[44rem]/rec-table:py-0.5 @[44rem]/rec-table:text-xs';

const CELL_TEXT =
  'block min-w-0 truncate text-[11px] leading-snug text-slate-700 @[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm';
const CELL_TEXT_MUTED =
  'block min-w-0 truncate text-[11px] leading-snug text-slate-600 @[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm';
const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/rec-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/rec-table:text-[0.6875rem]';

const THUMB_FRAME =
  'relative h-8 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 @[44rem]/rec-table:h-9 @[44rem]/rec-table:w-14 @[56rem]/rec-table:h-10 @[56rem]/rec-table:w-16';

function firstImageUrl(media: ViolationRecurrenceMedia[] | undefined): string | null {
  if (!media?.length) return null;
  const image = media.find(m => m.type.toLowerCase().includes('image'));
  return image?.thumbnailUrl || image?.url || media[0]?.thumbnailUrl || media[0]?.url || null;
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
    <span className={cn(CELL_META, 'text-slate-800')} title={`${date} ${time}`}>
      <span className="font-medium">{date}</span>
      <span className="hidden text-slate-400 @[48rem]/rec-table:inline"> {time}</span>
    </span>
  );
}

function SeverityBadge({ severity }: { severity: ViolationRecurrenceCandidateItem['severity'] }) {
  return (
    <span
      className={cn(BADGE_BASE, BADGE_SIZE, REPORT_SEVERITY_BADGE_CLASSES[severity])}
      title={REPORT_SEVERITY_LABEL_VI[severity]}
    >
      {REPORT_SEVERITY_LABEL_VI[severity]}
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

function ReportThumb({
  url,
  alt,
  priority = false,
}: {
  url: string | null;
  alt: string;
  priority?: boolean;
}) {
  const thumb = !url ? (
    <div className={cn(THUMB_FRAME, 'flex items-center justify-center text-slate-400')}>
      <ImageIcon
        className="size-3 @[44rem]/rec-table:size-3.5 @[56rem]/rec-table:size-4"
        aria-hidden
      />
    </div>
  ) : (
    <div className={THUMB_FRAME}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 640px) 3rem, 4rem"
        className="object-cover"
        unoptimized
        priority={priority}
      />
    </div>
  );

  return (
    <div className="relative inline-flex">
      {thumb}
      <span
        className={cn(
          'absolute -right-1.5 -top-1.5 z-10',
          'inline-flex size-4 items-center justify-center @[44rem]/rec-table:size-5',
          'rounded-full bg-orange-500 text-white shadow-sm ring-2 ring-white'
        )}
        aria-label="Nghi tái phát"
        title="Nghi ô nhiễm tái phát"
      >
        <History className="size-2 @[44rem]/rec-table:size-2.5" aria-hidden strokeWidth={2.75} />
      </span>
    </div>
  );
}

function RecurrenceRowActions({
  row,
  onCompare,
}: {
  row: ViolationRecurrenceCandidateItem;
  onCompare: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        title="So sánh với báo cáo đã đóng"
        aria-label={`So sánh ${row.code} với báo cáo đã đóng`}
        onClick={e => {
          e.stopPropagation();
          onCompare();
        }}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md @[44rem]/rec-table:size-8',
          'bg-orange-500 text-white shadow-sm',
          'transition-[background-color,box-shadow,transform] duration-150',
          'hover:bg-orange-400 hover:shadow',
          'active:scale-[0.97]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-1'
        )}
      >
        <ArrowRightLeft
          className="size-3.5 @[44rem]/rec-table:size-4"
          aria-hidden
          strokeWidth={2.25}
        />
      </button>
      <Link
        href={`/officer/verify/${row.id}`}
        title="Xem chi tiết"
        aria-label={`Xem chi tiết ${row.code}`}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex size-7 items-center justify-center rounded-md @[44rem]/rec-table:size-8',
          'text-slate-600 transition-colors',
          'hover:bg-slate-100 hover:text-slate-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <Eye className="size-3.5 @[44rem]/rec-table:size-4" aria-hidden />
      </Link>
    </div>
  );
}

function renderRecurrenceCell(
  key: ColumnKey,
  row: ViolationRecurrenceCandidateItem,
  opts?: { imagePriority?: boolean }
) {
  switch (key) {
    case 'image':
      return (
        <ReportThumb url={firstImageUrl(row.media)} alt={row.code} priority={opts?.imagePriority} />
      );
    case 'code':
      return (
        <span className={cn(CELL_TEXT, 'font-medium')} title={row.code}>
          {row.code}
        </span>
      );
    case 'category':
      return (
        <span className={CELL_TEXT} title={row.categoryName}>
          {row.categoryName || '—'}
        </span>
      );
    case 'severity':
      return <SeverityBadge severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'prior':
      return row.priorClosedReport ? (
        <span
          className={cn(CELL_TEXT, 'font-medium text-sky-800')}
          title={row.priorClosedReport.code}
        >
          {row.priorClosedReport.code}
        </span>
      ) : (
        <span className={cn(CELL_META, 'text-slate-400')}>—</span>
      );
    case 'daysSince': {
      const days = row.priorClosedReport?.daysSinceClosed;
      if (days == null) return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
      return (
        <span
          className={cn(
            CELL_META,
            'font-medium',
            days <= 7 ? 'text-rose-600' : days <= 30 ? 'text-orange-700' : 'text-slate-700'
          )}
          title={`${days} ngày từ khi đóng báo cáo trước`}
        >
          {days} ngày
        </span>
      );
    }
    case 'address':
      return (
        <span className={CELL_TEXT_MUTED} title={row.address}>
          {row.address || '—'}
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

export function RecurrencePageClient() {
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';
  const [page, setPage] = useState(1);
  const [compareItem, setCompareItem] = useState<ViolationRecurrenceCandidateItem | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isPending, isFetching, isError, refetch } = useViolationRecurrenceCandidates({
    page,
    pageSize: RECURRENCE_PAGE_SIZE,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  const openCompare = (row: ViolationRecurrenceCandidateItem) => {
    setCompareItem(row);
    setCompareOpen(true);
  };

  const handleCompareOpenChange = (open: boolean) => {
    setCompareOpen(open);
    if (!open) {
      window.setTimeout(() => setCompareItem(null), 200);
    }
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Tái phát</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              title="Báo cáo cùng loại, ≤50m so với báo cáo đã đóng trong 30 ngày — so sánh để quyết định mở thanh tra hoặc bác bỏ."
              aria-label="Thông tin danh sách nghi tái phát"
            >
              <CircleHelp className="size-4" aria-hidden />
            </button>
            {isFetching && !isPending ? (
              <Loader2 className="size-3.5 animate-spin text-slate-400" aria-hidden />
            ) : null}
          </div>
          <TypewriterEffectSmooth
            words={[
              { text: 'Welcome', className: 'font-normal text-slate-500' },
              { text: 'back,', className: 'font-normal text-slate-500' },
              {
                text: fullName,
                className: 'font-medium text-slate-800 dark:text-slate-100',
              },
            ]}
            className="mt-1 my-0"
            textClassName="text-sm font-normal sm:text-sm md:text-sm lg:text-sm xl:text-sm"
            cursorClassName="h-3.5 w-0.5 bg-slate-400 sm:h-3.5 xl:h-3.5"
            hideCursorOnComplete
          />
        </div>
      </header>

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
                    <Loader2 className="mx-auto size-8 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className={ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">
                      Không tải được danh sách nghi tái phát.
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
                      <span>Không có báo cáo nghi tái phát</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      ROW_BORDER,
                      'cursor-pointer transition-colors hover:bg-orange-50/40'
                    )}
                    onClick={() => openCompare(row)}
                  >
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          tableCellPad(col.key, 'body'),
                          'align-middle',
                          col.key !== 'image' && col.key !== 'actions' && 'max-w-0 overflow-hidden',
                          col.className
                        )}
                        onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                      >
                        {col.key === 'actions' ? (
                          <RecurrenceRowActions row={row} onCompare={() => openCompare(row)} />
                        ) : (
                          renderRecurrenceCell(col.key, row, {
                            imagePriority: rowIndex < 2,
                          })
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
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo nghi tái phát
            </p>
          </div>
        ) : null}
      </div>

      <RecurrenceCandidateCompareDialog
        item={compareItem}
        open={compareOpen}
        onOpenChange={handleCompareOpenChange}
      />
    </>
  );
}
