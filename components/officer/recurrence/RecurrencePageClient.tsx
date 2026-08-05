'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronUp,
  CircleHelp,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Info,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

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
import { useReportInspections, useViolationRecurrenceCandidates } from '@/hooks/useOfficer';
import type { ReportInspectionSummary } from '@/lib/api/models/inspectionReport';
import type { ViolationRecurrenceCandidateItem } from '@/lib/api/models/violationRecurrenceCandidate';
import type { ViolationRecurrenceMedia } from '@/lib/api/models/violationRecurrence';
import type { ReportSeverity } from '@/lib/api/models/report';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { REPORT_QUEUE_COLUMN_LABEL } from '@/lib/constants/reportQueueTable';
import {
  inspectionShowsClosedAt,
  inspectionShowsPenaltyFields,
  inspectionSlaIsOverdue,
  inspectionStatusBadgeClass,
  inspectionStatusLabelVi,
  resolveInspectionSubjectName,
} from '@/lib/constants/inspectionStatus';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { violationLevelLabelVi } from '@/lib/constants/violationLevel';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const RECURRENCE_PAGE_SIZE = 10;

/** Deep-link về list tái phát khi back từ tracking detail. */
const RECURRENCE_LIST_PATH = '/officer/recurrence';

type ColumnKey =
  | 'report'
  | 'prior'
  | 'severity'
  | 'status'
  | 'address'
  | 'created'
  | 'daysSince'
  | 'actions';

const FIRST_COL: ColumnKey = 'report';
const LAST_COL: ColumnKey = 'actions';

/** Padding ngang cột Báo cáo — header label & thumb cùng mép trái content. */
const FIRST_COL_PAD_X = 'ps-6 pe-2 @[44rem]/rec-table:ps-12 @[44rem]/rec-table:pe-3';

function tableCellPad(colKey: ColumnKey, layer: 'head' | 'body' = 'body') {
  const y =
    layer === 'head' ? 'py-2.5 @[44rem]/rec-table:py-3.5' : 'py-2.5 @[44rem]/rec-table:py-4';
  if (colKey === FIRST_COL) {
    return cn('px-0', y, FIRST_COL_PAD_X);
  }
  if (colKey === LAST_COL) {
    return cn('px-0', y, 'ps-1.5 pe-4 @[44rem]/rec-table:ps-3 @[44rem]/rec-table:pe-6');
  }
  return cn(y, 'px-1.5 @[44rem]/rec-table:px-3 @[56rem]/rec-table:px-4');
}

const ROW_BORDER = 'border-b border-slate-200';

/** Traffic-light text colors for severity (no badge) — khớp DuplicatesPageClient. */
const SEVERITY_TEXT_CLASSES: Record<ReportSeverity, string> = {
  Critical: 'text-red-700',
  High: 'text-red-600',
  Medium: 'text-orange-600',
  Low: 'text-green-600',
};

/**
 * Proportional widths (`table-fixed`) — cùng bố cục DuplicatesPageClient.
 * Cột `daysSince` thay slot `AI tương đồng`; cột `prior` thay slot `Bản gốc`.
 */
const COLUMN_DEFS: { key: ColumnKey; label: string; className?: string }[] = [
  {
    key: 'report',
    label: 'Báo cáo',
    className: 'w-[28%] min-w-0 @[44rem]/rec-table:w-[30%]',
  },
  {
    key: 'address',
    label: REPORT_QUEUE_COLUMN_LABEL.address,
    className: 'w-[16%] min-w-0 max-w-0',
  },
  { key: 'severity', label: REPORT_QUEUE_COLUMN_LABEL.severity, className: 'w-[9%] min-w-0' },
  { key: 'created', label: REPORT_QUEUE_COLUMN_LABEL.created, className: 'w-[10%] min-w-0' },
  { key: 'daysSince', label: 'Ngày từ khi đóng', className: 'w-[9%] min-w-0' },
  {
    key: 'prior',
    label: 'Báo cáo gốc',
    className: 'w-[13%] min-w-0 max-w-0',
  },
  { key: 'status', label: REPORT_QUEUE_COLUMN_LABEL.status, className: 'w-[10%] min-w-0' },
  {
    key: 'actions',
    label: '',
    className: 'w-12 @[44rem]/rec-table:w-14',
  },
];

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full font-medium leading-none';
const BADGE_SIZE =
  'px-1.5 py-0.5 text-[10px] tracking-tight @[44rem]/rec-table:px-2 @[44rem]/rec-table:py-0.5 @[44rem]/rec-table:text-xs';

const CELL_META =
  'block min-w-0 truncate text-[10px] tabular-nums leading-snug @[44rem]/rec-table:text-xs';
const HEAD_LABEL =
  'block min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-slate-500 @[44rem]/rec-table:text-[0.6875rem]';

const THUMB_SIZE = 'size-9 @[44rem]/rec-table:size-10';
const THUMB_SQUARE = cn(
  'relative shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80',
  THUMB_SIZE
);

function firstImageUrl(media: ViolationRecurrenceMedia[] | undefined): string | null {
  if (!media?.length) return null;
  const image = media.find(m => m.type.toLowerCase().includes('image'));
  return image?.thumbnailUrl || image?.url || media[0]?.thumbnailUrl || media[0]?.url || null;
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
          '@[44rem]/rec-table:text-[11px] @[56rem]/rec-table:text-xs'
        )}
      >
        {date}
      </span>
      <span
        className={cn(
          'block truncate text-[10px] tabular-nums leading-snug text-slate-500',
          '@[44rem]/rec-table:text-xs'
        )}
      >
        {time}
      </span>
    </div>
  );
}

function SeverityText({ severity }: { severity: ViolationRecurrenceCandidateItem['severity'] }) {
  const label = REPORT_SEVERITY_LABEL_VI[severity];
  return (
    <span
      className={cn(
        'block min-w-0 truncate text-[11px] font-medium leading-snug',
        '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
        SEVERITY_TEXT_CLASSES[severity] ?? 'text-slate-500'
      )}
      title={label}
    >
      {label}
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

/**
 * Cột đầu kiểu Transaction (Duplicates): thumb vuông + stack
 * id (link xanh + copy) → code (+ copy) → categoryName (muted).
 *
 * Alignment (CustomerGo):
 * - Thumb thẳng hàng label header «BÁO CÁO» (mép content cột).
 * - Chevron lệch trái thumb một khoảng nhỏ; đóng = ngửa lên, mở = úp xuống.
 */
function ReportIdentityCell({
  row,
  priority = false,
  expandable = false,
  expanded = false,
  onToggleExpand,
}: {
  row: ViolationRecurrenceCandidateItem;
  priority?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const url = firstImageUrl(row.media);

  return (
    <div className="relative flex min-w-0 items-center gap-2.5">
      {expandable ? (
        <button
          type="button"
          aria-label={expanded ? 'Thu gọn hồ sơ xử phạt' : 'Mở hồ sơ xử phạt'}
          aria-expanded={expanded}
          onClick={e => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className={cn(
            'absolute top-1/2 right-full z-10 mr-1 -translate-y-1/2',
            'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500',
            'transition-colors hover:text-slate-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
          )}
        >
          <ChevronUp
            className={cn(
              'size-4 transition-transform duration-300 ease-out',
              expanded && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
      ) : null}

      <div className="shrink-0">
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
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="group/copyrow flex min-w-0 items-center gap-1">
          <Link
            href={`/officer/verify/${row.id}?from=${encodeURIComponent('/officer/recurrence')}`}
            title={row.id}
            onClick={e => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums text-sky-700 no-underline',
              '@[44rem]/rec-table:text-xs',
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
            className="min-w-0 truncate text-[11px] font-medium tabular-nums text-slate-800 @[44rem]/rec-table:text-xs"
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
          className="truncate text-[11px] leading-snug text-slate-500 @[44rem]/rec-table:text-xs"
          title={row.categoryName || undefined}
        >
          {row.categoryName?.trim() || '—'}
        </p>
      </div>
    </div>
  );
}

const DAYS_SINCE_TOOLTIP =
  'Số ngày từ lúc đóng báo cáo trước đó đến khi tạo báo cáo hiện tại. Càng gần ngày đóng thì mức nghi tái diễn càng cao (≤50m, cùng loại, trong 30 ngày).';

/** Slot tương đương cột AI tương đồng — hiển thị daysSinceClosed. */
function DaysSinceCell({ days }: { days: number | null | undefined }) {
  if (days == null) {
    return (
      <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
        <span className={cn(CELL_META, 'text-slate-400')}>—</span>
        <AnimatedHoverTooltip name={DAYS_SINCE_TOOLTIP} wrap>
          <button
            type="button"
            aria-label="Giải thích số ngày từ khi đóng"
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

  return (
    <div className="flex min-w-0 items-center gap-1" onClick={e => e.stopPropagation()}>
      <span
        className={cn(
          'min-w-0 truncate text-[11px] font-medium tabular-nums leading-snug',
          '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
          days <= 7 ? 'text-rose-600' : days <= 30 ? 'text-orange-700' : 'text-slate-800'
        )}
        title={`${days} ngày từ khi đóng báo cáo trước`}
      >
        {days} ngày
      </span>
      <AnimatedHoverTooltip name={DAYS_SINCE_TOOLTIP} wrap>
        <button
          type="button"
          aria-label="Giải thích số ngày từ khi đóng"
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

/** Cột Báo cáo đã đóng — cùng pattern PrimaryReportCell (Duplicates). */
function PriorClosedReportCell({
  prior,
}: {
  prior: ViolationRecurrenceCandidateItem['priorClosedReport'];
}) {
  if (!prior) {
    return <span className={cn(CELL_META, 'text-slate-400')}>—</span>;
  }

  return (
    <div className="min-w-0 space-y-0.5">
      <p
        className={cn(
          'truncate text-[10px] font-medium leading-snug text-slate-800',
          '@[44rem]/rec-table:text-[11px] @[56rem]/rec-table:text-xs'
        )}
        title="Báo cáo đã đóng"
      >
        Báo cáo đã đóng
      </p>
      <Link
        href={`/officer/tracking?${new URLSearchParams({
          reportId: prior.id,
          from: RECURRENCE_LIST_PATH,
        }).toString()}`}
        title={prior.code}
        onClick={e => e.stopPropagation()}
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-1',
          'text-[10px] tabular-nums leading-snug text-slate-600 underline underline-offset-2',
          '@[44rem]/rec-table:text-xs',
          'hover:text-sky-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{prior.code}</span>
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </Link>
    </div>
  );
}

/** Cột ⋮ — menu: Chi tiết so sánh (trang detail). */
function RecurrenceRowActions({ row }: { row: ViolationRecurrenceCandidateItem }) {
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
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href={`/officer/recurrence/${row.id}`}>
              <Eye className="size-4" aria-hidden />
              Xem chi tiết
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Dòng tiền theo status (BE §6):
 * - Draft/InProgress/ClosedNoViolation → ẩn
 * - PartiallyPaid → Đã nộp X / Tổng Y
 * - PenaltyIssued+ → Đã nộp X (X có thể 0đ)
 */
function inspectionPaymentLine(inspection: ReportInspectionSummary): string | null {
  if (!inspectionShowsPenaltyFields(inspection.status)) return null;

  const paid = inspection.paidAmount ?? 0;
  const penalty = inspection.penaltyAmount;

  if (inspection.status === 'PartiallyPaid' && penalty != null) {
    return `Đã nộp ${formatVnd(paid)} / Tổng ${formatVnd(penalty)}`;
  }

  if (penalty != null) {
    return `${formatVnd(penalty)} · Đã nộp ${formatVnd(paid)}`;
  }

  return `Đã nộp ${formatVnd(paid)}`;
}

/** Đường chữ L — kéo dài thêm đúng độ cao py để sát hàng report phía trên. */
function InspectionTreeConnector() {
  return (
    <>
      {/* dọc: từ mép trên panel (bù py-4/5 + mt) → giữa icon */}
      <span
        className={cn(
          'pointer-events-none absolute bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-slate-300',
          '-top-[calc(1rem+0.125rem)] @[44rem]/rec-table:-top-[calc(1.25rem+0.125rem)]'
        )}
      />
      {/* ngang: giữa icon → mép trái FileText */}
      <span className="pointer-events-none absolute top-1/2 left-1/2 h-px w-[calc(50%+0.625rem)] bg-slate-300" />
    </>
  );
}

/** Khung chung expand: rail chữ L + slot nội dung. */
function InspectionExpandShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'relative flex items-start gap-2.5 overflow-visible bg-slate-50/80 py-4 @[44rem]/rec-table:py-5',
        FIRST_COL_PAD_X,
        'pe-4 @[44rem]/rec-table:pe-6'
      )}
    >
      <div className={cn('relative mt-0.5 shrink-0', THUMB_SIZE)} aria-hidden>
        <InspectionTreeConnector />
      </div>
      <span
        className={cn(
          'relative z-1 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg',
          THUMB_SIZE,
          'bg-white text-slate-500 ring-1 ring-slate-200/80'
        )}
        aria-hidden
      >
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InspectionBriefLoading() {
  return (
    <InspectionExpandShell>
      <div className="space-y-1.5 py-0.5" aria-busy="true" aria-label="Đang tải hồ sơ xử phạt">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-3 w-32" />
      </div>
    </InspectionExpandShell>
  );
}

function InspectionBriefEmpty() {
  return (
    <InspectionExpandShell>
      <p className="text-[12px] text-slate-500 @[44rem]/rec-table:text-[13px]">
        Chưa có hồ sơ xử phạt
      </p>
    </InspectionExpandShell>
  );
}

function InspectionBriefError({ onRetry }: { onRetry: () => void }) {
  return (
    <InspectionExpandShell>
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-destructive">Không tải được hồ sơ xử phạt</span>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRetry();
          }}
          className="font-medium text-sky-700 hover:underline"
        >
          Thử lại
        </button>
      </div>
    </InspectionExpandShell>
  );
}

/**
 * Nested brief — layout theo UX LEO:
 * Hồ sơ xử phạt [badge nhỏ góc trên phải]
 * Đối tượng: {name|[Chưa cập nhật]} [Tái phạm?]
 * hint (nếu chưa có tên) · Người lập · Tạo
 *                            Hạn xử lý · (ngày đóng)
 */
function InspectionBriefPanel({ inspection }: { inspection: ReportInspectionSummary }) {
  const subjectName = resolveInspectionSubjectName(
    inspection.violatingEntityName,
    inspection.violatorName
  );
  const hasSubject = Boolean(subjectName);
  const statusLabel = inspectionStatusLabelVi(inspection.status);
  const showPenalty = inspectionShowsPenaltyFields(inspection.status);
  const showClosedAt = inspectionShowsClosedAt(inspection.status);
  const slaOverdue = inspectionSlaIsOverdue(inspection.status, inspection.slaInspectionDueAt);
  const paymentLine = inspectionPaymentLine(inspection);
  const officer = inspection.createdByOfficerName?.trim() || '—';
  const created = formatShortDateTime(inspection.createdAt);
  const sla = formatShortDateTime(inspection.slaInspectionDueAt);

  const metaLine = [
    `Người lập ${officer}`,
    `Tạo ${created}`,
    showPenalty ? `Mức ${violationLevelLabelVi(inspection.violationLevel)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/officer/recurrence/inspections/${inspection.id}`}
      className={cn(
        'relative flex items-start gap-2.5 overflow-visible bg-slate-50/80 py-4 @[44rem]/rec-table:py-5',
        FIRST_COL_PAD_X,
        'pe-4 @[44rem]/rec-table:pe-6',
        'transition-colors hover:bg-slate-100/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
      )}
      aria-label={`Xem chi tiết hồ sơ xử phạt — ${statusLabel}`}
      onClick={e => e.stopPropagation()}
    >
      <div className={cn('relative mt-0.5 shrink-0', THUMB_SIZE)} aria-hidden>
        <InspectionTreeConnector />
      </div>

      <span
        className={cn(
          'relative z-1 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-lg',
          THUMB_SIZE,
          'bg-white text-slate-500 ring-1 ring-slate-200/80'
        )}
        aria-hidden
      >
        <FileText className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {/* Hàng 1: «Hồ sơ xử phạt» + badge nhỏ góc trên phải tiêu đề */}
          <div className="inline-flex max-w-full min-w-0 items-start gap-1.5">
            <p className="truncate text-[12px] font-semibold leading-snug text-slate-900 @[44rem]/rec-table:text-[13px]">
              Hồ sơ xử phạt
            </p>
            <span
              className={cn(
                'mt-px inline-flex max-w-[9rem] shrink-0 truncate rounded-full px-1 py-px',
                'text-[9px] font-medium leading-none tracking-tight',
                inspectionStatusBadgeClass(inspection.status)
              )}
              title={statusLabel}
            >
              {statusLabel}
            </span>
          </div>

          {/* Hàng 2: Đối tượng — luôn có nhãn rõ */}
          <div className="min-w-0">
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-snug text-slate-800 @[44rem]/rec-table:text-[13px]">
              <span className="text-slate-500">Đối tượng:</span>
              <span
                className={cn(
                  'min-w-0 font-medium',
                  hasSubject ? 'text-slate-800' : 'text-slate-500'
                )}
                title={
                  hasSubject
                    ? subjectName!
                    : 'Đối tượng: Chưa cập nhật (sẽ được Đội thanh tra bổ sung sau khi khảo sát)'
                }
              >
                {hasSubject ? subjectName : 'Chưa cập nhật'}
              </span>
              {!hasSubject ? (
                <span className="text-[11px] font-normal text-slate-400 @[44rem]/rec-table:text-xs">
                  (sẽ được Đội thanh tra bổ sung sau khi khảo sát)
                </span>
              ) : null}
              {inspection.isRepeatOffender ? (
                <span className="inline-flex shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-800">
                  Tái phạm
                </span>
              ) : null}
            </p>
          </div>

          {/* Hàng 3: meta */}
          <p
            className="truncate text-[11px] text-slate-500 @[44rem]/rec-table:text-xs"
            title={metaLine}
          >
            {metaLine}
          </p>

          {paymentLine ? (
            <p
              className="truncate text-[11px] font-medium tabular-nums text-slate-700 @[44rem]/rec-table:text-xs"
              title={paymentLine}
            >
              {paymentLine}
            </p>
          ) : null}
        </div>

        {/* Cột phải: hạn xử lý + ngày đóng */}
        <div className="hidden min-w-30 shrink-0 space-y-0.5 text-right sm:block">
          <p
            className={cn(
              'text-[11px] tabular-nums @[44rem]/rec-table:text-xs',
              slaOverdue ? 'font-medium text-red-600' : 'text-slate-600'
            )}
            title={
              inspection.slaInspectionDueAt
                ? `Hạn xử lý: ${sla}${slaOverdue ? ' (quá hạn)' : ''}`
                : undefined
            }
          >
            Hạn xử lý {sla}
            {slaOverdue ? ' · Quá hạn' : ''}
          </p>
          {showClosedAt ? (
            <p
              className="text-[10px] tabular-nums text-slate-400 @[44rem]/rec-table:text-[11px]"
              title={
                inspection.closedAt
                  ? `Ngày đóng: ${formatShortDateTime(inspection.closedAt)}`
                  : undefined
              }
            >
              Ngày đóng {formatShortDateTime(inspection.closedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type ReportCellExpand = {
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

function renderRecurrenceCell(
  key: ColumnKey,
  row: ViolationRecurrenceCandidateItem,
  opts?: { imagePriority?: boolean } & ReportCellExpand
) {
  switch (key) {
    case 'report':
      return (
        <ReportIdentityCell
          row={row}
          priority={opts?.imagePriority}
          expandable={opts?.expandable}
          expanded={opts?.expanded}
          onToggleExpand={opts?.onToggleExpand}
        />
      );
    case 'prior':
      return <PriorClosedReportCell prior={row.priorClosedReport} />;
    case 'daysSince':
      return <DaysSinceCell days={row.priorClosedReport?.daysSinceClosed} />;
    case 'severity':
      return <SeverityText severity={row.severity} />;
    case 'status':
      return <StatusBadge status={row.status} />;
    case 'address':
      return (
        <span
          className={cn(
            'block min-w-0 text-[11px] leading-snug text-slate-600',
            '@[44rem]/rec-table:text-xs @[56rem]/rec-table:text-sm',
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

/** Parent report + nested inspection — GET …/inspections chỉ khi expand. */
function RecurrenceCandidateRows({
  row,
  rowIndex,
  onOpenDetail,
}: {
  row: ViolationRecurrenceCandidateItem;
  rowIndex: number;
  onOpenDetail: (row: ViolationRecurrenceCandidateItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    data: inspectionsData,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useReportInspections(row.id, expanded);

  const inspection = inspectionsData?.items[0] ?? null;

  return (
    <Fragment>
      <TableRow
        className={cn(
          'cursor-pointer transition-colors hover:bg-orange-50/40',
          expanded ? 'border-b-0' : ROW_BORDER
        )}
        onClick={() => onOpenDetail(row)}
      >
        {COLUMN_DEFS.map(col => (
          <TableCell
            key={col.key}
            className={cn(
              tableCellPad(col.key, 'body'),
              'align-middle',
              col.key === 'report' && 'overflow-visible',
              col.key !== 'report' && col.key !== 'actions' && 'max-w-0 overflow-hidden',
              col.className
            )}
            onClick={col.key === 'actions' ? e => e.stopPropagation() : undefined}
          >
            {col.key === 'actions' ? (
              <RecurrenceRowActions row={row} />
            ) : (
              renderRecurrenceCell(col.key, row, {
                imagePriority: rowIndex < 2,
                expandable: true,
                expanded,
                onToggleExpand: () => setExpanded(v => !v),
              })
            )}
          </TableCell>
        ))}
      </TableRow>

      <TableRow className={cn(ROW_BORDER, 'hover:bg-transparent')}>
        <TableCell colSpan={COLUMN_DEFS.length} className="p-0 align-top">
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out',
              expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="min-h-0 overflow-hidden">
              {expanded ? (
                isPending || (isFetching && !inspectionsData) ? (
                  <InspectionBriefLoading />
                ) : isError ? (
                  <InspectionBriefError onRetry={() => void refetch()} />
                ) : inspection ? (
                  <InspectionBriefPanel inspection={inspection} />
                ) : (
                  <InspectionBriefEmpty />
                )
              ) : null}
            </div>
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

export function RecurrencePageClient() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const fullName = user?.name?.trim() || 'Người dùng';
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, isError, refetch } = useViolationRecurrenceCandidates({
    page,
    pageSize: RECURRENCE_PAGE_SIZE,
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination;

  const openDetail = (row: ViolationRecurrenceCandidateItem) => {
    router.push(`/officer/recurrence/${row.id}`);
  };

  return (
    <>
      <header className="mb-6 shrink-0">
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center gap-[0.35rem]">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Tái diễn</h1>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-[0.15rem] text-slate-500 hover:bg-slate-400/15 hover:text-slate-700"
              title="Báo cáo cùng loại, ≤50m so với báo cáo đã đóng trong 30 ngày — so sánh để quyết định mở thanh tra hoặc bác bỏ."
              aria-label="Thông tin danh sách nghi tái diễn"
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
                      Không tải được danh sách nghi tái diễn.
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
                      <span>Không có báo cáo nghi tái diễn</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, rowIndex) => (
                  <RecurrenceCandidateRows
                    key={row.id}
                    row={row}
                    rowIndex={rowIndex}
                    onOpenDetail={openDetail}
                  />
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
              {pagination.totalItems.toLocaleString('vi-VN')} báo cáo nghi tái diễn
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
