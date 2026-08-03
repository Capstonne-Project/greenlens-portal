'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRightLeft,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  Eye,
  ImageIcon,
  Info,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DuplicateCandidateCompareDialog,
  firstDuplicateMediaUrl,
  formatSimilarity,
} from '@/components/officer/duplicates/DuplicateCandidateCompareDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
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
import { useDuplicateCandidates } from '@/hooks/useOfficer';
import type { DuplicateCandidateItem } from '@/lib/api/models/duplicateCandidate';
import type { ReportSeverity } from '@/lib/api/models/adminReport';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const DUPLICATES_PAGE_SIZE = 5;

/** Deep-link về list trùng lặp khi back từ tracking detail. */
const DUPLICATES_LIST_PATH = '/officer/duplicates';

type ColumnKey =
  | 'report'
  | 'primary'
  | 'severity'
  | 'status'
  | 'address'
  | 'created'
  | 'similarity'
  | 'actions';

const FIRST_COL: ColumnKey = 'report';
const LAST_COL: ColumnKey = 'actions';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/dup-table:py-3.5' : 'py-2.5 @[44rem]/dup-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, 'ps-6 pe-2 @[44rem]/dup-table:ps-12 @[44rem]/dup-table:pe-3');
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/dup-table:ps-3 @[44rem]/dup-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/dup-table:px-3 @[56rem]/dup-table:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

/** Traffic-light text colors for severity (no badge). */
const SEVERITY_TEXT_CLASSES: Record<ReportSeverity, string> = {
  Critical: 'text-red-700',
  High: 'text-red-600',
  Medium: 'text-orange-600',
  Low: 'text-green-600',
};

/**
 * Proportional widths (`table-fixed`) — fluid theo content area (sidebar collapse/expand).
 * Cột đầu: ảnh + stack id / code / categoryName.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'report',
    label: 'Báo cáo',
    className: 'w-[28%] min-w-0 @[44rem]/dup-table:w-[30%]',
  },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[16%] min-w-0 max-w-0',
  },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[9%] min-w-0' },
  { key: 'created', label: REPORT_QUEUE_COLUMN_LABEL.created, className: 'w-[10%] min-w-0' },
  { key: 'similarity', label: 'AI tương đồng', className: 'w-[9%] min-w-0' },
  {
    key: 'primary',
    label: 'Bản gốc',
    className: 'w-[13%] min-w-0 max-w-0',
  },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[10%] min-w-0' },
  {
    key: 'actions',
    label: '',
    className: 'w-12 @[44rem]/dup-table:w-14',
  },
];
const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/dup-table:px-2 @[44rem]/dup-table:py-0.5 @[44rem]/dup-table:text-xs';

const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/dup-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/dup-table:text-[0.6875rem]';

/** Thumbnail vuông nhỏ — khớp layout Transaction (ảnh mẫu). */
const THUMB_SQUARE =
  'relative size-9 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80 @[44rem]/dup-table:size-10';

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
    <div className="min-w-0 space-y-0.5" title={`${date} ${time}`}>
      <span
        className={cn(
          'block truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/dup-table:text-[11px] @[56rem]/dup-table:text-xs'
        )}
      >
        {date}
      </span>
      <span
        className={cn(
          'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
          '@[44rem]/dup-table:text-xs'
        )}
      >
        {time}
      </span>
    </div>
  );
}

function SeverityText({ severity }: { severity: DuplicateCandidateItem['severity'] }) {
  const label = REPORT_SEVERITY_LABEL_VI[severity];
  return (
    <span
      className={cn(
        'block min-w-0 truncate text-[11px] font-medium leading-snug',
        '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm',
        SEVERITY_TEXT_CLASSES[severity] ?? 'text-slate-500'
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: DuplicateCandidateItem['status'] }) {
  const label = reportStatusLabelVi(status);
  return (
    <span className={cn(BADGE_BASE, BADGE_SIZE, REPORT_STATUS_BADGE_CLASSES[status])} title={label}>
      {label}
    </span>
  );
}

/**
 * Cột đầu kiểu Transaction: thumb vuông (căn giữa dọc) + stack
 * id (link xanh + copy) → code (+ copy) → categoryName (muted).
 */
function ReportIdentityCell({
  row,
  priority = false,
}: {
  row: DuplicateCandidateItem;
  priority?: boolean;
}) {
  const url = firstDuplicateMediaUrl(row.media);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={THUMB_SQUARE}>
        {url ? (
          <Image
            src={url}
            alt={row.code}
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
            priority={priority}
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
            href={`/officer/verify/${row.id}`}
            title={row.id}
            onClick={e => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700 no-underline',
              '@[44rem]/dup-table:text-xs',
              'hover:text-sky-800 hover:underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            {row.id}
          </Link>
          <CopyIconButton
            value={row.id}
            label="Sao chép ID báo cáo"
            successMessage="Đã sao chép ID báo cáo."
          />
        </div>

        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <span
            className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/dup-table:text-xs"
            title={row.code}
          >
            {row.code}
          </span>
          <CopyIconButton
            value={row.code}
            label={`Sao chép mã ${row.code}`}
            successMessage="Đã sao chép mã báo cáo."
          />
        </div>

        <p
          className="truncate text-[11px] leading-snug text-slate-500 @[44rem]/dup-table:text-xs"
          title={row.categoryName || undefined}
        >
          {row.categoryName?.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

/** AI tương đồng — điểm % + icon Info (kiểu cột Price) kèm tooltip giải thích. */
const AI_SIMILARITY_TOOLTIP =
  'Hệ thống AI so ảnh của báo cáo này với ảnh báo cáo gốc và cho điểm từ 0% đến 100%. Điểm càng cao thì ảnh càng giống. Đây chỉ là gợi ý hỗ trợ xem xét.';

function SimilarityCell({ score }: { score: number | null }) {
  const label = formatSimilarity(score);

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
      <span
        className={cn(
          'min-w-0 truncate text-[11px] font-medium tabular-nums leading-snug text-slate-800',
          '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm'
        )}
        title={label ?? undefined}
      >
        {label ?? '—'}
      </span>
      <AnimatedHoverTooltip name={AI_SIMILARITY_TOOLTIP} wrap>
        <button
          type="button"
          aria-label="Giải thích điểm AI tương đồng"
          className={cn(
            'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-slate-400',
            'transition-colors hover:text-slate-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
          )}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </AnimatedHoverTooltip>
    </div>
  );
}

/** Cột Bản gốc — kiểu Pick Up Status: nhãn dòng 1 + code link gạch chân dòng 2. */
function PrimaryReportCell({ primary }: { primary: DuplicateCandidateItem['primary'] }) {
  if (!primary) {
    return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5">
      <p
        className={cn(
          'truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/dup-table:text-[11px] @[56rem]/dup-table:text-xs'
        )}
        title="Báo cáo gốc"
      >
        Báo cáo gốc
      </p>
      <Link
        href={`/officer/tracking?${new URLSearchParams({
          reportId: primary.id,
          from: DUPLICATES_LIST_PATH,
        }).toString()}`}
        title={primary.code}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-1',
          'text-[10px] tabular-nums leading-snug text-slate-600 underline underline-offset-2',
          '@[44rem]/dup-table:text-xs',
          'hover:text-sky-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{primary.code}</span>
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </Link>
    </div>
  );
}

/** Cột ⋮ — không label header; menu: So sánh / Chi tiết. */
function DuplicateRowActions({
  row,
  onCompare,
}: {
  row: DuplicateCandidateItem;
  onCompare: () => void;
}) {
  return (
    <div className="flex justify-end" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Thao tác ${row.code}`}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-slate-500',
              'transition-colors hover:bg-slate-100 hover:text-slate-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            <MoreVertical className="size-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => {
              onCompare();
            }}
          >
            <ArrowRightLeft className="size-4" aria-hidden />
            So sánh với gốc
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href={`/officer/verify/${row.id}`}>
              <Eye className="size-4" aria-hidden />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function renderDuplicateCell(
  key: ColumnKey,
  row: DuplicateCandidateItem,
  opts?: { imagePriority?: boolean }
) {
  switch (key) {
    case 'report':
      return <ReportIdentityCell row={row} priority={opts?.imagePriority} />;
    case 'primary':
      return <PrimaryReportCell primary={row.primary} />;
    case 'similarity':
      return <SimilarityCell score={row.aiSimilarityScore} />;
    case 'severity':
      return <SeverityText severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'address':
      return (
        <span
          className={cn(
            'block min-w-0 text-[11px] leading-snug text-slate-600',
            '@[44rem]/dup-table:text-xs @[56rem]/dup-table:text-sm',
            'line-clamp-2 wrap-break-word whitespace-normal'
          )}
          title={row.address || undefined}
        >
          {row.address?.trim() || '—'}
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

export function DuplicatesPageClient() {
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';
  const [page, setPage] = useState(1);
  const [compareItem, setCompareItem] = useState<DuplicateCandidateItem | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const { data, isPending, isFetching, isError, refetch } = useDuplicateCandidates({
    page,
    pageSize: DUPLICATES_PAGE_SIZE,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  const openCompare = (row: DuplicateCandidateItem) => {
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
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Trùng lặp</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              title="Báo cáo bị gắn cờ nghi trùng (Tier 1 vị trí/thời gian hoặc Tier 2 AI) — so sánh với báo cáo gốc để gộp hoặc bác bỏ."
              aria-label="Thông tin danh sách nghi trùng lặp"
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
        <div className="@container/dup-table min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
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
                    ) : (
                      <span className="sr-only">Thao tác</span>
                    )}
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
                      Không tải được danh sách nghi trùng lặp.
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
                      <span>Không có báo cáo nghi trùng</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      ROW_BORDER,
                      'cursor-pointer transition-colors hover:bg-amber-50/40'
                    )}
                    onClick={() => openCompare(row)}
                  >
                    {COLUMN_DEFS.map(col => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          tableCellPad(col.key, 'body'),
                          'align-middle',
                          col.key !== 'report' &&
                            col.key !== 'actions' &&
                            'max-w-0 overflow-hidden',
                          col.className
                        )}
                        onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
                      >
                        {col.key === 'actions' ? (
                          <DuplicateRowActions row={row} onCompare={() => openCompare(row)} />
                        ) : (
                          renderDuplicateCell(col.key, row, {
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
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo nghi trùng
            </p>
          </div>
        ) : null}
      </div>

      <DuplicateCandidateCompareDialog
        item={compareItem}
        open={compareOpen}
        onOpenChange={handleCompareOpenChange}
      />
    </>
  );
}
