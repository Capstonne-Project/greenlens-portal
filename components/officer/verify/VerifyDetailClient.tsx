'use client';

import { SuccessDialog } from '@/components/common/SuccessDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, hero5CardClass, type LayoutGridCard } from '@/components/ui/layout-grid';
import { LeoAssignDialog } from '@/components/officer/assign/LeoAssignDialog';
import {
  DuplicateSuspectDialog,
  type SuspectDialogMode,
} from '@/components/officer/verify/DuplicateSuspectDialog';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import {
  useRejectReport,
  useReportDetail,
  useReportQueue,
  useVerifyReport,
} from '@/hooks/useOfficer';
import { useCanFetchProtected } from '@/hooks/useAuthSession';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import { useCatalogWasteTags } from '@/hooks/useWasteTags';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { createIdempotencyKeyStore } from '@/lib/api/idempotency';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import type {
  ReportDetail,
  ReportSeverity,
  ReportStatus,
  ReportWasteTag,
} from '@/lib/api/models/report';
import type { VerifyReportInput } from '@/lib/api/models/reportAction';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { getWasteTagFaIcon } from '@/lib/constants/adminWasteTags';
import { pollutionCategoryLabelVi } from '@/lib/constants/pollutionCategories';
import { normalizeReportQueueStatus, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { withOfficerFromQuery } from '@/utils/officerNavigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardList,
  Copy,
  History,
  Hourglass,
  LayoutGrid as LayoutGridIcon,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  Tag,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const SEVERITY_TEXT_CLASSES: Record<ReportSeverity, string> = {
  Low: 'text-slate-600',
  Medium: 'text-amber-700',
  High: 'text-orange-700',
  Critical: 'text-rose-700',
};

const STATUS_TEXT_CLASSES: Record<ReportStatus, string> = {
  Submitted: 'text-amber-700',
  Verified: 'text-emerald-700',
  Dispatched: 'text-teal-700',
  Assigned: 'text-sky-700',
  InProgress: 'text-blue-700',
  Resolved: 'text-green-700',
  Reopened: 'text-violet-700',
  Closed: 'text-zinc-600',
  Rejected: 'text-rose-700',
  Duplicate: 'text-orange-700',
  PenaltyIssued: 'text-fuchsia-700',
  ClosedNoViolation: 'text-stone-600',
};

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <span className={cn('text-base font-semibold', SEVERITY_TEXT_CLASSES[severity])}>
      {REPORT_SEVERITY_LABEL_VI[severity]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={cn('text-base font-semibold', STATUS_TEXT_CLASSES[status])}>
      {reportStatusLabelVi(status)}
    </span>
  );
}

/** Giữ xuống dòng từ response; dài hơn 6 dòng → Xem thêm / Thu gọn (animate height nhẹ). */
function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedH, setCollapsedH] = useState(0);
  const [fullH, setFullH] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const full = el.scrollHeight;
      const style = getComputedStyle(el);
      const parsedLh = Number.parseFloat(style.lineHeight);
      const lineHeight =
        Number.isFinite(parsedLh) && parsedLh > 0
          ? parsedLh
          : Number.parseFloat(style.fontSize) * 1.625;
      const collapsed = Math.round(lineHeight * 6);
      setFullH(full);
      setCollapsedH(Math.min(collapsed, full));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const needsToggle = fullH > collapsedH + 1;
  const targetHeight = !needsToggle || expanded ? fullH : collapsedH;

  return (
    <div className="min-w-0">
      <div className="relative">
        <motion.div
          initial={false}
          animate={{ height: targetHeight > 0 ? targetHeight : 'auto' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <p
            ref={contentRef}
            className="text-base leading-relaxed whitespace-pre-wrap wrap-break-word text-foreground"
          >
            {text}
          </p>
        </motion.div>

        <AnimatePresence initial={false}>
          {!expanded && needsToggle ? (
            <motion.div
              key="fade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent"
              aria-hidden
            />
          ) : null}
        </AnimatePresence>
      </div>

      {needsToggle ? (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="mt-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={expanded ? 'collapse' : 'expand'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="inline-block"
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </motion.span>
          </AnimatePresence>
        </button>
      ) : null}
    </div>
  );
}

const INFO_ICON_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40';

/** Icon section title — stroke xanh, căn giữa theo dòng tiêu đề. */
const SECTION_ICON_CLASS = 'size-5 shrink-0 text-emerald-600';

/** Horizontal inset — HeaderStrip, Gallery, content cột phải/trái đồng bộ. */
const DETAIL_PAGE_X_PAD = 'px-14 xl:px-24';

function InfoField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof TrendingUp;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2.5">
      {/* Icon chỉ căn giữa với label, không với cả khối value */}
      <span className={cn(INFO_ICON_CLASS, 'col-start-1 row-start-1 self-center')}>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </span>
      <Label className="col-start-2 row-start-1 self-center font-normal leading-none text-muted-foreground">
        {label}
      </Label>
      <div className="col-start-2 row-start-2 min-w-0">{children}</div>
    </div>
  );
}

/** Parse AI waste-tag codes → nameVi (catalog + attached tags; fallback code). */
function resolveAiWasteTagNames(
  raw: string | null | undefined,
  attached: ReportWasteTag[],
  catalog: Array<{ code: string; nameVi: string }>
): string[] {
  if (!raw?.trim()) return [];
  const byCode = new Map<string, string>();
  for (const tag of catalog) {
    const name = tag.nameVi.trim();
    if (tag.code && name) byCode.set(tag.code.toUpperCase(), name);
  }
  for (const tag of attached) {
    const name = tag.nameVi.trim();
    if (tag.code && name) byCode.set(tag.code.toUpperCase(), name);
  }
  return raw
    .split(/[,;|]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(code => byCode.get(code.toUpperCase()) || code);
}

const REPORT_WASTE_TAG_MIN = 1;
const REPORT_WASTE_TAG_MAX = 12;

const WASTE_TAG_SELECTED_CLASS =
  'cursor-pointer border-transparent bg-emerald-600 text-white hover:bg-emerald-500';
const WASTE_TAG_IDLE_CLASS =
  'cursor-pointer border-transparent bg-secondary text-secondary-foreground hover:bg-emerald-50 hover:text-emerald-800';
/** Padding trong badge — khoảng cách chữ/icon so với viền. */
const WASTE_TAG_BADGE_PAD = 'px-3.5 py-1.5';

function sameWasteTagIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, i) => id === right[i]);
}

/** Local toggle — wasteTagIds gửi kèm PUT /verify. */
function WasteTagPicker({
  attachedTags,
  selectedIds,
  onSelectedIdsChange,
  canEdit,
}: {
  attachedTags: ReportWasteTag[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  canEdit: boolean;
}) {
  const { data: catalog = [], isPending: catalogLoading } = useCatalogWasteTags(canEdit);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const displayTags = useMemo(() => {
    const sortByNameLengthDesc = <T extends { nameVi: string }>(items: T[]): T[] =>
      [...items].sort((a, b) => {
        const byLen = b.nameVi.length - a.nameVi.length;
        if (byLen !== 0) return byLen;
        return a.nameVi.localeCompare(b.nameVi, 'vi');
      });

    if (!canEdit) {
      return sortByNameLengthDesc(
        attachedTags.map(t => ({
          id: t.tagId,
          code: t.code,
          nameVi: t.nameVi.trim(),
        }))
      );
    }

    const byId = new Map<string, { id: string; code: string; nameVi: string }>();
    for (const tag of catalog) {
      const name = tag.nameVi.trim();
      if (tag.id && name) byId.set(tag.id, { id: tag.id, code: tag.code, nameVi: name });
    }
    for (const tag of attachedTags) {
      if (!byId.has(tag.tagId)) {
        const name = tag.nameVi.trim();
        if (tag.tagId && name) {
          byId.set(tag.tagId, { id: tag.tagId, code: tag.code, nameVi: name });
        }
      }
    }
    return sortByNameLengthDesc(Array.from(byId.values()));
  }, [canEdit, catalog, attachedTags]);

  const handleToggle = (tagId: string) => {
    if (!canEdit) return;
    const isSelected = selectedSet.has(tagId);
    if (isSelected) {
      if (selectedIds.length <= REPORT_WASTE_TAG_MIN) {
        toastApiError(undefined, `Cần giữ ít nhất ${REPORT_WASTE_TAG_MIN} thẻ rác thải.`);
        return;
      }
      onSelectedIdsChange(selectedIds.filter(id => id !== tagId));
      return;
    }
    if (selectedIds.length >= REPORT_WASTE_TAG_MAX) {
      toastApiError(undefined, `Tối đa ${REPORT_WASTE_TAG_MAX} thẻ rác thải.`);
      return;
    }
    onSelectedIdsChange([...selectedIds, tagId]);
  };

  if (canEdit && catalogLoading) {
    return <p className="text-sm text-muted-foreground">Đang tải thẻ rác thải...</p>;
  }

  if (displayTags.length === 0) {
    return <p className="text-base font-medium text-muted-foreground">Chưa gắn thẻ</p>;
  }

  return (
    <div
      className="flex w-full min-w-0 flex-wrap gap-2"
      role={canEdit ? 'group' : undefined}
      aria-label={canEdit ? 'Chọn thẻ rác thải' : undefined}
    >
      {displayTags.map(tag => {
        const selected = canEdit ? selectedSet.has(tag.id) : true;
        const icon = getWasteTagFaIcon(tag.code, tag.nameVi);
        if (!canEdit) {
          return (
            <Badge
              key={tag.id}
              className={cn(
                'inline-flex items-center gap-1.5 border-transparent bg-emerald-600 font-medium text-white',
                WASTE_TAG_BADGE_PAD
              )}
            >
              <FontAwesomeIcon icon={icon} className="size-3 opacity-95" aria-hidden />
              {tag.nameVi}
            </Badge>
          );
        }
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleToggle(tag.id)}
            aria-pressed={selected}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Badge
              className={cn(
                'inline-flex items-center gap-1.5 font-medium transition-colors',
                WASTE_TAG_BADGE_PAD,
                selected ? WASTE_TAG_SELECTED_CLASS : WASTE_TAG_IDLE_CLASS
              )}
            >
              <FontAwesomeIcon
                icon={icon}
                className={cn('size-3', selected ? 'opacity-95' : 'opacity-80')}
                aria-hidden
              />
              {tag.nameVi}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

// ── SLA countdown ─────────────────────────────────────────────────────────────

type SlaLevel = 'safe' | 'warn' | 'critical' | 'overdue';

interface SlaTokenSet {
  bar: string;
  badge: string;
  badgeLabel: string;
  countdownBg: string;
  countdownText: string;
  countdownLabel: string;
  verifyBtn: string;
  bannerText: string | null;
}

const SLA_TOKENS: Record<SlaLevel, SlaTokenSet> = {
  safe: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeLabel: 'Trong hạn',
    countdownBg: 'bg-emerald-50 border-emerald-200',
    countdownText: 'text-emerald-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-emerald-600 hover:bg-emerald-500',
    bannerText: null,
  },
  warn: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    badgeLabel: 'Cần chú ý',
    countdownBg: 'bg-amber-50 border-amber-200',
    countdownText: 'text-amber-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-orange-500 hover:bg-orange-400',
    bannerText: null,
  },
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    badgeLabel: 'Sắp hết hạn',
    countdownBg: 'bg-red-50 border-red-200',
    countdownText: 'text-red-700',
    countdownLabel: 'Thời gian còn lại',
    verifyBtn: 'bg-red-600 hover:bg-red-500',
    bannerText: 'Sắp hết hạn xác minh — cần xử lý ngay',
  },
  overdue: {
    bar: 'bg-red-700',
    badge: 'bg-red-700 text-white',
    badgeLabel: 'Quá hạn',
    countdownBg: 'bg-red-100 border-red-300',
    countdownText: 'text-red-700',
    countdownLabel: 'Báo cáo này cần xử xác minh ngay',
    verifyBtn: 'bg-red-700 hover:bg-red-600',
    bannerText: null,
  },
};

/**
 * useSlaCountdown — single 1Hz tick, derive everything else from `now`.
 * Tick stops when component unmounts (clearInterval cleanup).
 */
function useSlaCountdown(createdAt: string, slaDueAt: string | null) {
  const startMs = useMemo(() => new Date(createdAt).getTime(), [createdAt]);
  const endMs = useMemo(
    () => (slaDueAt ? new Date(slaDueAt).getTime() : startMs),
    [slaDueAt, startMs]
  );
  const hasSla = Boolean(slaDueAt);
  const totalMs = Math.max(1, endMs - startMs);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const isOverdue = now >= endMs;
  const elapsedMs = Math.min(totalMs, Math.max(0, now - startMs));
  const remainingMs = Math.max(0, endMs - now);
  const percentElapsed = Math.min(100, (elapsedMs / totalMs) * 100);

  let level: SlaLevel;
  if (isOverdue) level = 'overdue';
  else if (percentElapsed >= 75) level = 'critical';
  else if (percentElapsed >= 50) level = 'warn';
  else level = 'safe';

  return { isOverdue, remainingMs, percentElapsed, level, totalMs, hasSla };
}

function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = sizeBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Sub-components ────────────────────────────────────────────────────────────

function HeaderStrip({
  detail,
  pendingCategoryName,
  isPossibleDuplicate = false,
  isSuspectedViolationRecurrence = false,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  isPossibleDuplicate?: boolean;
  isSuspectedViolationRecurrence?: boolean;
}) {
  return (
    <CardTitle className="flex min-w-0 items-start justify-between gap-3 text-2xl font-bold tracking-tight">
      <span className="min-w-0 flex-1">
        Báo cáo{' '}
        <span className="relative inline-block align-baseline pr-6">
          {pendingCategoryName}
          {isPossibleDuplicate ? (
            <AnimatedHoverTooltip
              name="Nghi ngờ trùng lặp"
              className="absolute -right-1 -top-2.5 z-10 max-w-none"
            >
              <span
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center',
                  'rounded-full bg-amber-500 text-white shadow-sm',
                  'ring-2 ring-white'
                )}
                aria-label="Nghi ngờ trùng lặp"
              >
                <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
              </span>
            </AnimatedHoverTooltip>
          ) : null}
          {isSuspectedViolationRecurrence ? (
            <AnimatedHoverTooltip
              name="Nghi ô nhiễm tái diễn"
              className={cn(
                'absolute z-10 max-w-none',
                isPossibleDuplicate ? 'right-4 -top-2.5' : '-right-1 -top-2.5'
              )}
            >
              <span
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center',
                  'rounded-full bg-orange-500 text-white shadow-sm',
                  'ring-2 ring-white'
                )}
                aria-label="Nghi ô nhiễm tái diễn"
              >
                <History className="size-2.5" aria-hidden strokeWidth={2.75} />
              </span>
            </AnimatedHoverTooltip>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-400">#{detail.code}</span>
    </CardTitle>
  );
}

const GALLERY_PREVIEW_MAX = 5;

function Gallery({
  media,
  address,
  createdAt,
  isSuspicious = false,
  suspiciousReasons = [],
}: {
  media: ReportDetail['media'];
  address: string;
  createdAt: string;
  isSuspicious?: boolean;
  suspiciousReasons?: string[];
}) {
  const [showAll, setShowAll] = useState(false);

  const images = useMemo(() => media.filter(m => m.mediaType === 'Image'), [media]);
  const totalSizeBytes = useMemo(
    () =>
      media.reduce((sum, item) => sum + (Number.isFinite(item.sizeBytes) ? item.sizeBytes : 0), 0),
    [media]
  );
  const total = images.length;
  const hasMore = total > GALLERY_PREVIEW_MAX;
  const suspiciousLabel = suspiciousReasons
    .map(r => r.trim())
    .filter(Boolean)
    .join(', ');
  const showSuspiciousBadge = isSuspicious && Boolean(suspiciousLabel);

  const cards = useMemo((): LayoutGridCard[] => {
    const preview = images.slice(0, GALLERY_PREVIEW_MAX);
    return preview.map((img, i) => {
      const isLastPreview = i === preview.length - 1;
      return {
        id: img.id,
        thumbnail: img.url,
        className: hero5CardClass(i, preview.length),
        content: (
          <div>
            <p className="text-xl font-bold text-white md:text-2xl">Ảnh {i + 1}</p>
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              <span className="rounded-full bg-black/35 px-2 py-1 text-white/95">
                {formatBytes(totalSizeBytes)}
              </span>
              <span className="rounded-full bg-black/35 px-2 py-1 text-white/95">
                {formatDateTime(createdAt)}
              </span>
            </div>
          </div>
        ),
        overlay:
          hasMore && isLastPreview ? (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setShowAll(true);
              }}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-md ring-1 ring-black/5 transition hover:bg-slate-50"
            >
              <Camera className="size-3.5 shrink-0" aria-hidden />
              Xem gallery ({total} ảnh)
            </button>
          ) : undefined,
      };
    });
  }, [images, total, hasMore, totalSizeBytes, createdAt]);

  const suspiciousBadge = showSuspiciousBadge ? (
    <span
      className={cn(
        'pointer-events-none absolute right-3 top-3 z-30 max-w-[min(100%-1.5rem,20rem)]',
        'truncate rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white',
        'shadow-sm ring-1 ring-white/25'
      )}
      title={suspiciousLabel}
    >
      {suspiciousLabel}
    </span>
  ) : null;

  if (total === 0) {
    return (
      <Card className="relative flex h-64 items-center justify-center overflow-hidden border-dashed shadow-none">
        {suspiciousBadge}
        <CardContent className="space-y-2 p-0 text-center text-sm text-muted-foreground">
          <p>Không có hình ảnh</p>
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium">
            <span className="rounded-full bg-muted px-2 py-1 text-foreground">
              {formatBytes(totalSizeBytes)}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-foreground">
              {formatDateTime(createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative h-[min(62vh,520px)] w-full overflow-hidden rounded-xl bg-white">
        {suspiciousBadge}
        <LayoutGrid cards={cards} variant="hero5" className="h-full gap-1 p-0" />
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="flex h-[92vh] max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogDescription className="sr-only">
            Hộp thoại xem tất cả hình ảnh báo cáo theo dạng lưới.
          </DialogDescription>
          <DialogHeader className="shrink-0 space-y-0 border-b px-12 py-4 text-center">
            <DialogTitle className="truncate text-center text-sm font-semibold tracking-tight text-foreground md:text-base">
              {address || 'Hình ảnh báo cáo'}
            </DialogTitle>
          </DialogHeader>

          <div className="shrink-0 border-b px-4 pt-2 md:px-6">
            <div className="inline-flex items-center gap-1.5 border-b-2 border-foreground pb-2 text-sm font-medium text-foreground">
              <Camera className="size-4" aria-hidden />
              Hình ảnh
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={img.url}
                    alt={`Ảnh ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function LocationCard({
  detail,
  pendingCategoryName,
  pendingSeverity,
  pendingCategoryId,
  setPendingCategoryId,
  setPendingSeverity,
  pendingWasteTagIds,
  setPendingWasteTagIds,
  categories,
  catsLoading,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  pendingSeverity: ReportSeverity;
  pendingCategoryId: string;
  setPendingCategoryId: (id: string) => void;
  setPendingSeverity: (s: ReportSeverity) => void;
  pendingWasteTagIds: string[];
  setPendingWasteTagIds: (ids: string[]) => void;
  categories: { id: string; nameVi: string }[];
  catsLoading: boolean;
}) {
  const [mapType, setMapType] = useState<'m' | 'k'>('m');
  const canEditFields = detail.status === 'Submitted';
  const mapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;

  // Always-visible editable Select: underline cue so officer sees the field is editable.
  const editSelectTriggerClass =
    'h-auto w-full rounded-none border-x-0 border-t-0 border-b border-foreground/40 bg-transparent px-0 py-1 text-lg font-medium text-foreground shadow-none focus:border-emerald-500 focus:ring-0 data-[state=open]:border-emerald-500';

  return (
    <div>
      <Card className="rounded-none border-0 border-t border-border bg-transparent shadow-none">
        <CardHeader className="space-y-0 p-0 pt-10">
          <div className="flex gap-2.5">
            <span className="inline-flex h-7 shrink-0 items-center" aria-hidden>
              <ClipboardList className={SECTION_ICON_CLASS} />
            </span>
            <CardTitle className="text-xl leading-7">Thông tin báo cáo ô nhiễm</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-7 pb-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {/* Hàng 1: Loại | Trạng thái — DOM order giữ responsive stack 1 cột */}
            <InfoField icon={Tag} label="Loại ô nhiễm">
              {canEditFields ? (
                <Select
                  value={pendingCategoryId}
                  onValueChange={setPendingCategoryId}
                  disabled={catsLoading}
                >
                  <SelectTrigger className={editSelectTriggerClass}>
                    <SelectValue placeholder={catsLoading ? 'Đang tải...' : 'Chọn loại'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="text-base">
                        {cat.nameVi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-medium text-foreground">{pendingCategoryName}</p>
              )}
            </InfoField>

            <InfoField icon={Shield} label="Trạng thái">
              <div className="text-lg font-medium text-foreground">
                <StatusBadge status={detail.status} />
              </div>
            </InfoField>

            {/* Hàng 2: Mức độ | Lượt báo cáo */}
            <InfoField icon={AlertTriangle} label="Mức độ">
              {canEditFields ? (
                <Select
                  value={pendingSeverity}
                  onValueChange={v => setPendingSeverity(v as ReportSeverity)}
                >
                  <SelectTrigger className={editSelectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Critical', 'High', 'Medium', 'Low'] as ReportSeverity[]).map(s => (
                      <SelectItem key={s} value={s} className="text-base">
                        {REPORT_SEVERITY_LABEL_VI[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <SeverityBadge severity={pendingSeverity} />
              )}
            </InfoField>

            <InfoField icon={Users} label="Lượt báo cáo">
              <div className="text-lg font-medium text-foreground">
                {detail.reporterCount} người
              </div>
            </InfoField>

            {/* Hàng 3: Thẻ rác thải full width */}
            <div className="min-w-0 sm:col-span-2">
              <InfoField icon={Tag} label="Thẻ rác thải">
                <WasteTagPicker
                  attachedTags={detail.wasteTags}
                  selectedIds={pendingWasteTagIds}
                  onSelectedIdsChange={setPendingWasteTagIds}
                  canEdit={canEditFields}
                />
              </InfoField>
            </div>

            {/* Hàng 4: Điểm ưu tiên | Đã mở lại */}
            <InfoField icon={TrendingUp} label="Điểm ưu tiên">
              <div className="text-lg font-medium text-foreground">
                {detail.priorityScore.toFixed(2)}
              </div>
            </InfoField>

            <InfoField icon={RefreshCw} label="Đã mở lại">
              <div className="text-lg font-medium text-foreground">
                {detail.reopenedCount > 0 ? `${detail.reopenedCount} lần` : 'Không'}
              </div>
            </InfoField>

            {/* Hàng 5: Mô tả — cùng gap-y-6 với Điểm ưu tiên (không Separator my-4) */}
            {detail.description ? (
              <div className="min-w-0 sm:col-span-2">
                <InfoField icon={AlignLeft} label="Mô tả">
                  <ExpandableDescription key={detail.description} text={detail.description} />
                </InfoField>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border-0 border-t border-border bg-transparent shadow-none">
        <CardHeader className="space-y-0 p-0 pt-10">
          <div className="flex gap-2.5">
            <span className="inline-flex h-7 shrink-0 items-center" aria-hidden>
              <MapPin className={SECTION_ICON_CLASS} />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl leading-7">Nơi {pendingCategoryName}</CardTitle>
              <CardDescription className="mt-1.5 text-base">{detail.address}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4 pb-6">
          <div className="relative overflow-hidden rounded-xl border border-border">
            <iframe
              key={mapType}
              title="map"
              width="100%"
              height="470"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${detail.latitude},${detail.longitude}&z=15&t=${mapType}&output=embed`}
              className="block"
            />
            <div className="absolute right-3 top-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-10 rounded-full shadow-md"
                    aria-label="Chọn loại bản đồ"
                  >
                    <Layers className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuRadioGroup
                    value={mapType}
                    onValueChange={v => setMapType(v as 'm' | 'k')}
                  >
                    <DropdownMenuRadioItem value="m">
                      <LayoutGridIcon className="size-3.5" />
                      Mặc định
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="k">
                      <LayoutGridIcon className="size-3.5" />
                      Vệ tinh
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button variant="link" className="mt-2 h-auto px-0 text-xs" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="size-3" />
              Mở trên Google Maps
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AiInsightCard({
  detail,
  isPossibleDuplicate,
}: {
  detail: ReportDetail;
  isPossibleDuplicate: boolean;
}) {
  const { data: catalogWasteTags = [] } = useCatalogWasteTags();
  const aiType = detail.aiClassifiedType?.trim();
  const hasAiType = Boolean(aiType);
  const aiTypeLabel = pollutionCategoryLabelVi(aiType);
  const aiConfidence = detail.aiConfidence;
  const aiConfidenceLabel =
    aiConfidence != null && aiConfidence > 0
      ? aiConfidence <= 1
        ? `${Math.round(aiConfidence * 100)}%`
        : `${aiConfidence.toFixed(0)}%`
      : 'Không có';
  const wasteTags = detail.wasteTags
    .map(tag => ({
      id: tag.tagId,
      code: tag.code,
      name: tag.nameVi.trim(),
    }))
    .filter(tag => Boolean(tag.name));
  const aiSuggestedNames = useMemo(
    () =>
      resolveAiWasteTagNames(detail.aiSuggestedWasteTagCodes, detail.wasteTags, catalogWasteTags),
    [detail.aiSuggestedWasteTagCodes, detail.wasteTags, catalogWasteTags]
  );
  const hasAiData =
    hasAiType ||
    (aiConfidence != null && aiConfidence > 0) ||
    aiSuggestedNames.length > 0 ||
    detail.wasteTags.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Phân tích AI</CardTitle>
        {!hasAiData ? (
          <CardDescription>Báo cáo này chưa có dữ liệu phân tích AI từ hệ thống.</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {hasAiType && aiType ? (
          <InsightRow
            label="Loại AI phân loại"
            value={aiTypeLabel}
            tone={detail.severitySetBy === 'AI' ? 'warn' : 'neutral'}
          />
        ) : null}
        <InsightRow
          label="Độ tin cậy AI"
          value={aiConfidenceLabel}
          tone={aiConfidence != null && aiConfidence >= 0.7 ? 'warn' : 'neutral'}
        />
        <Field orientation="horizontal" className="items-start justify-between gap-3">
          <Label className="pt-1 text-base font-normal text-muted-foreground">Gợi ý thẻ rác</Label>
          {aiSuggestedNames.length > 0 ? (
            <div className="flex max-w-[65%] flex-wrap justify-end gap-1.5">
              {aiSuggestedNames.map((name, index) => (
                <Badge
                  key={`${name}-${index}`}
                  variant="secondary"
                  className="inline-flex items-center gap-1.5 font-medium"
                >
                  <FontAwesomeIcon
                    icon={getWasteTagFaIcon(undefined, name)}
                    className="size-3 opacity-80"
                    aria-hidden
                  />
                  {name}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="outline" className="border-0 bg-gray-100 font-semibold text-gray-500">
              Không có
            </Badge>
          )}
        </Field>
        <Field orientation="horizontal" className="items-start justify-between gap-3">
          <Label className="pt-1 text-base font-normal text-muted-foreground">Thẻ rác thải</Label>
          {wasteTags.length > 0 ? (
            <div className="flex max-w-[65%] flex-wrap justify-end gap-1.5">
              {wasteTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="inline-flex items-center gap-1.5 font-medium"
                >
                  <FontAwesomeIcon
                    icon={getWasteTagFaIcon(tag.code, tag.name)}
                    className="size-3 opacity-80"
                    aria-hidden
                  />
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge variant="outline" className="border-0 bg-gray-100 font-semibold text-gray-500">
              Chưa gắn thẻ
            </Badge>
          )}
        </Field>
        <InsightRow
          label="Nghi ngờ trùng"
          value={isPossibleDuplicate ? 'Có' : 'Không'}
          tone={isPossibleDuplicate ? 'warn' : 'neutral'}
        />
      </CardContent>
    </Card>
  );
}

function InsightRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'bg-red-50 text-red-600 ring-red-200'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-gray-100 text-gray-500 ring-transparent';

  return (
    <Field orientation="horizontal" className="items-center justify-between gap-3">
      <Label className="text-base font-normal text-muted-foreground">{label}</Label>
      <Badge variant="outline" className={cn('border-0 font-semibold', toneClass)}>
        {value}
      </Badge>
    </Field>
  );
}

function SlaActionCard({
  detail,
  onVerify,
  onReject,
  isVerifying,
  isRejecting,
  isPossibleDuplicate,
  isSuspectedViolationRecurrence,
}: {
  detail: ReportDetail;
  onVerify: () => void;
  onReject: () => void;
  isVerifying: boolean;
  isRejecting: boolean;
  isPossibleDuplicate?: boolean;
  isSuspectedViolationRecurrence?: boolean;
}) {
  const { isOverdue, remainingMs, percentElapsed, level, totalMs, hasSla } = useSlaCountdown(
    detail.createdAt,
    detail.slaVerifyDueAt
  );
  const tokens = SLA_TOKENS[level];

  const totalHours = Math.round(totalMs / 3600000);
  const startShort = formatShort(detail.createdAt);
  const endShort = detail.slaVerifyDueAt ? formatShort(detail.slaVerifyDueAt) : '—';
  const startFull = formatDateTime(detail.createdAt);
  const endFull = detail.slaVerifyDueAt ? formatDateTime(detail.slaVerifyDueAt) : 'Chưa có';

  return (
    <Card className="overflow-hidden p-0">
      {isPossibleDuplicate ? (
        <Alert className="rounded-none border-x-0 border-t-0 border-amber-200 bg-amber-50 text-amber-900">
          <Copy className="size-4 text-amber-600" />
          <AlertDescription className="font-medium">
            Nghi ngờ trùng lặp — đối chiếu báo cáo gốc trước khi xác minh.
          </AlertDescription>
        </Alert>
      ) : null}
      {isSuspectedViolationRecurrence ? (
        <Alert className="rounded-none border-x-0 border-t-0 border-orange-200 bg-orange-50 text-orange-900">
          <History className="size-4 text-orange-600" />
          <AlertDescription className="font-medium">
            Nghi ô nhiễm tái diễn — kiểm tra báo cáo Closed trước đó trước khi xác minh.
          </AlertDescription>
        </Alert>
      ) : null}
      {tokens.bannerText ? (
        <Alert className="rounded-none border-x-0 border-t-0 border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="size-4" />
          <AlertDescription className="font-medium">{tokens.bannerText}</AlertDescription>
        </Alert>
      ) : null}

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base leading-none">
          <Shield className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span>Hạn xác minh</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className={cn('mb-3 rounded-lg border px-4 py-5 text-center', tokens.countdownBg)}>
          <p
            className={cn('text-3xl font-bold tabular-nums tracking-wider', tokens.countdownText)}
            aria-live="polite"
          >
            {hasSla ? (isOverdue ? 'QUÁ HẠN' : formatHMS(remainingMs)) : '—'}
          </p>
          <p className={cn('mt-1 text-xs', tokens.countdownText)}>{tokens.countdownLabel}</p>
        </div>

        <Progress value={percentElapsed} indicatorClassName={tokens.bar} className="mb-1" />
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{startShort}</span>
          <span className={cn('font-medium', tokens.countdownText)}>
            {Math.round(percentElapsed)}% đã qua
          </span>
          <span>{endShort}</span>
        </div>

        <Card className="mb-5 border-border bg-muted/30 shadow-none">
          <CardContent className="space-y-2 p-3 text-sm">
            <Field orientation="horizontal" className="items-center justify-between">
              <Label className="flex items-center gap-2 font-normal text-muted-foreground">
                <Calendar className="size-3.5" />
                Báo cáo lúc
              </Label>
              <span className="font-medium text-foreground">{startFull}</span>
            </Field>
            <Field orientation="horizontal" className="items-center justify-between">
              <Label className="flex items-center gap-2 font-normal text-muted-foreground">
                <Calendar className="size-3.5" />
                Hạn chót
              </Label>
              <span className="font-medium text-foreground">{endFull}</span>
            </Field>
            <Field orientation="horizontal" className="items-center justify-between">
              <Label className="flex items-center gap-2 font-normal text-muted-foreground">
                <Hourglass className="size-3.5" />
                Tổng thời gian
              </Label>
              <span className="font-medium text-foreground">{totalHours} giờ</span>
            </Field>
          </CardContent>
        </Card>
      </CardContent>

      <CardFooter>
        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            disabled={isVerifying || isRejecting}
            onClick={onVerify}
            aria-busy={isVerifying}
            title={
              isPossibleDuplicate
                ? 'Kiểm tra trùng trước khi xác minh'
                : isSuspectedViolationRecurrence
                  ? 'Kiểm tra tái diễn trước khi xác minh'
                  : 'Xác minh ngay'
            }
            className={cn(
              'w-full text-white',
              isPossibleDuplicate || isSuspectedViolationRecurrence
                ? tokens.verifyBtn
                : 'bg-emerald-600 hover:bg-emerald-500'
            )}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                Đang xác minh…
              </>
            ) : (
              'Xác minh'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isVerifying || isRejecting}
            onClick={onReject}
            className="w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                Đang từ chối…
              </>
            ) : (
              'Từ chối'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function ActionCard({
  detail,
  onAssignNow,
  status,
  onVerify,
  onReject,
  isVerifying,
  isRejecting,
  isPossibleDuplicate,
  isSuspectedViolationRecurrence,
}: {
  detail: ReportDetail;
  onAssignNow: () => void;
  status: ReportStatus;
  onVerify: () => void;
  onReject: () => void;
  isVerifying: boolean;
  isRejecting: boolean;
  isPossibleDuplicate?: boolean;
  isSuspectedViolationRecurrence?: boolean;
}) {
  if (status === 'InProgress') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-blue-200 bg-white shadow-sm">
            <Hourglass className="size-6 text-blue-600" />
          </div>
          <p className={cn('mt-3 text-lg font-semibold', STATUS_TEXT_CLASSES.InProgress)}>
            Đang xử lý
          </p>
          <CardDescription className="mt-1 text-base">
            Báo cáo đã được phân công đội và đang trong quá trình khắc phục.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (status === 'Verified' || status === 'Dispatched') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-emerald-200 bg-white shadow-sm">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <p className="mt-3 text-lg font-semibold text-emerald-700">
            {status === 'Dispatched' ? 'Chờ phân công' : 'Đã xác minh'}
          </p>
          <CardDescription className="mt-1 text-base">
            {status === 'Dispatched'
              ? 'Báo cáo đã dispatch và sẵn sàng gán đội xử lý.'
              : 'Báo cáo đã được xác nhận hợp lệ và sẵn sàng phân công.'}
          </CardDescription>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500"
            onClick={onAssignNow}
          >
            Phân công đội xử lý
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === 'Duplicate') {
    const primaryId = detail.mergedIntoPrimaryReportId;
    const primaryCode = detail.mergedIntoPrimaryReportCode?.trim();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full border border-orange-200 bg-white shadow-sm">
            <Copy className="size-6 text-orange-600" aria-hidden />
          </div>
          <p className={cn('mt-3 text-lg font-semibold', STATUS_TEXT_CLASSES.Duplicate)}>
            Trùng lặp
          </p>
          <CardDescription className="mt-1 text-base">
            {primaryCode
              ? `Báo cáo đã được gộp vào báo cáo gốc ${primaryCode}.`
              : 'Báo cáo đã được đánh dấu trùng lặp và gộp vào báo cáo gốc.'}
          </CardDescription>
        </CardContent>
        {primaryId ? (
          <CardFooter>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-lg border-orange-200 text-orange-800 hover:bg-orange-50 hover:text-orange-900"
            >
              <Link href={`/officer/verify/${encodeURIComponent(primaryId)}`}>Xem báo cáo gốc</Link>
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    );
  }

  if (status !== 'Submitted') {
    const isClosedFamily = status === 'Closed' || status === 'ClosedNoViolation';
    const isRejected = status === 'Rejected';
    const iconWrapClass = isRejected
      ? 'border-rose-200'
      : isClosedFamily
        ? 'border-zinc-200'
        : 'border-slate-200';
    const Icon = isRejected ? XCircle : isClosedFamily ? CheckCircle2 : Shield;
    const iconClass = isRejected
      ? 'text-rose-600'
      : isClosedFamily
        ? 'text-zinc-500'
        : 'text-slate-500';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center px-4 py-5 text-center">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-full border bg-white shadow-sm',
              iconWrapClass
            )}
          >
            <Icon className={cn('size-6', iconClass)} />
          </div>
          <p className={cn('mt-3 text-lg font-semibold', STATUS_TEXT_CLASSES[status])}>
            {reportStatusLabelVi(status)}
          </p>
          {isClosedFamily ? (
            <CardDescription className="mt-1 text-base">
              Báo cáo đã đóng và không còn trong hàng đợi xác minh.
            </CardDescription>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <SlaActionCard
      detail={detail}
      onVerify={onVerify}
      onReject={onReject}
      isVerifying={isVerifying}
      isRejecting={isRejecting}
      isPossibleDuplicate={isPossibleDuplicate}
      isSuspectedViolationRecurrence={isSuspectedViolationRecurrence}
    />
  );
}

function RejectReportDialog({
  open,
  reason,
  onReasonChange,
  onCancel,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const reasonLength = reason.trim().length;
  const isReasonValid = reasonLength >= 20;

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && !isSubmitting && onCancel()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="space-y-2 border-b border-border bg-linear-to-b from-red-50/60 to-transparent px-6 pb-4 pt-6 text-left dark:from-red-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <XCircle className="size-4" aria-hidden />
            </span>
            Từ chối báo cáo
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Vui lòng nhập lý do từ chối tối thiểu 20 ký tự. Báo cáo sẽ chuyển trạng thái sang{' '}
            <span className="font-medium text-foreground">Rejected</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-6 py-5">
          <Label
            htmlFor="reject-reason"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Lý do từ chối
          </Label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={event => onReasonChange(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Nêu rõ thông tin chưa hợp lệ để người gửi có thể chỉnh sửa lại."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-red-300 focus:ring-1 focus:ring-red-100"
          />
          <p
            className={cn(
              'text-right text-xs',
              isReasonValid ? 'text-muted-foreground' : 'font-medium text-red-600'
            )}
          >
            {reasonLength}/20 ký tự tối thiểu
          </p>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!isReasonValid || isSubmitting}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            {isSubmitting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function VerifyDetailClient({
  id,
  onBack,
  detailMode = 'verify',
}: {
  id: string;
  /** Khi có — nút back gọi callback (vd. `/officer/assign/[id]` → danh sách phân công). */
  onBack?: () => void;
  /** `tracking` — hiển thị panel phân công & chuyển giao đội. */
  detailMode?: 'verify' | 'tracking';
}) {
  const router = useRouter();
  const { data: detail, isLoading, isError, refetch } = useReportDetail(id);
  const { data: categories = [], isLoading: catsLoading } = useCatalogPollutionCategories();
  const verifyMutation = useVerifyReport();
  const verifyIdempotencyKeyRef = useRef(createIdempotencyKeyStore());
  const rejectMutation = useRejectReport();

  /** Cùng nguồn flag trùng với hàng đợi — mở DuplicateSuspectDialog trước khi verify. */
  const canFetchProtected = useCanFetchProtected();
  const { data: queueSlice } = useReportQueue(
    {
      page: 1,
      pageSize: 10,
      status: 'Submitted',
      ...(detail?.code ? { search: detail.code } : {}),
    },
    { enabled: canFetchProtected && Boolean(detail?.code) }
  );

  const queueItem = useMemo(
    () => queueSlice?.items.find(item => item.id === id) ?? null,
    [queueSlice?.items, id]
  );

  const isPossibleDuplicate = Boolean(
    queueItem?.isPossibleDuplicate && queueItem.possibleDuplicateOfReportId
  );

  const isSuspectedViolationRecurrence = Boolean(
    detail?.isSuspectedViolationRecurrence || queueItem?.isSuspectedViolationRecurrence
  );

  /** Queue item hoặc stub từ detail — đủ cho DuplicateSuspectDialog mode=recurrence. */
  const suspectDialogRow = useMemo((): ReportQueueItem | null => {
    if (queueItem) return queueItem;
    if (!detail?.isSuspectedViolationRecurrence) return null;
    const image = detail.media.find(m => m.mediaType.toLowerCase().includes('image'));
    return {
      id: detail.id,
      code: detail.code,
      categoryCode: detail.categoryCode,
      categoryName: detail.categoryName,
      severity: detail.severity,
      status: normalizeReportQueueStatus(String(detail.status)),
      latitude: detail.latitude,
      longitude: detail.longitude,
      address: detail.address,
      wardCode: detail.wardCode,
      priorityScore: detail.priorityScore,
      createdAt: detail.createdAt,
      slaVerifyDueAt: detail.slaVerifyDueAt,
      slaResolveDueAt: detail.slaResolveDueAt,
      firstImageUrl: image?.url ?? detail.media[0]?.url ?? null,
      isPossibleDuplicate: false,
      possibleDuplicateOfReportId: null,
      possibleDuplicateOfReportCode: null,
      duplicateDetectionSource: null,
      aiSimilarityScore: null,
      duplicateCandidateCount: 0,
      isSuspectedViolationRecurrence: true,
      suspectedRecurrenceOfReportId: detail.suspectedRecurrenceOfReportId,
      suspectedRecurrenceOfReportCode: detail.priorClosedReport?.code ?? null,
    };
  }, [queueItem, detail]);

  const [pendingCategoryId, setPendingCategoryId] = useState<string>('');
  const [pendingSeverity, setPendingSeverity] = useState<ReportSeverity>('Medium');
  const [pendingWasteTagIds, setPendingWasteTagIds] = useState<string[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [suspectDialogMode, setSuspectDialogMode] = useState<SuspectDialogMode>('duplicate');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyFieldsRemindOpen, setVerifyFieldsRemindOpen] = useState(false);

  // Sync pending state once detail loads / khi đổi báo cáo
  const [syncedReportId, setSyncedReportId] = useState<string | null>(null);
  if (detail && syncedReportId !== detail.id) {
    setPendingCategoryId(detail.categoryId);
    setPendingSeverity(detail.severity);
    setPendingWasteTagIds(detail.wasteTags.map(t => t.tagId).filter(Boolean));
    setSyncedReportId(detail.id);
  }

  const pendingCategoryName =
    categories.find(c => c.id === pendingCategoryId)?.nameVi ?? detail?.categoryName ?? '';

  const serverWasteTagIds = useMemo(
    () => (detail?.wasteTags ?? []).map(t => t.tagId).filter(Boolean),
    [detail?.wasteTags]
  );

  /** Cả 3 loại / mức độ / thẻ giữ nguyên → nhắc cán bộ xác nhận (BR-AI-005). */
  const isClassificationUnchanged = Boolean(
    detail &&
    pendingCategoryId === detail.categoryId &&
    pendingSeverity === detail.severity &&
    sameWasteTagIds(pendingWasteTagIds, serverWasteTagIds)
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Card className="h-72 animate-pulse shadow-none" />
            <Card className="h-64 animate-pulse shadow-none" />
          </div>
          <div className="space-y-4">
            <Card className="h-56 animate-pulse shadow-none" />
            <Card className="h-48 animate-pulse shadow-none" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4">
        <BackLink onBack={onBack} reportId={id} />
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Không thể tải chi tiết báo cáo. Vui lòng thử lại.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAssignNow = () => {
    setAssignDialogOpen(true);
  };

  const handleAssignAfterVerify = () => {
    setSuccessOpen(false);
    router.push(`/officer/assign?highlightReportId=${encodeURIComponent(detail.id)}`);
  };

  const handleAssigned = () => {
    setAssignDialogOpen(false);
    // Embed Phân công (AssignReportsTab): quay về bảng thay vì ở lại detail.
    if (onBack) {
      onBack();
      return;
    }
    void refetch();
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 20) return;

    try {
      const result = await rejectMutation.mutateAsync({
        reportId: detail.id,
        body: { reason },
      });
      toastApiSuccess(result, 'Đã từ chối báo cáo.');
      setRejectDialogOpen(false);
      setRejectReason('');
      await refetch();
    } catch (error) {
      toastApiError(error, 'Không thể từ chối báo cáo.');
    }
  };

  const performVerify = async (): Promise<boolean> => {
    if (pendingWasteTagIds.length < REPORT_WASTE_TAG_MIN) {
      toastApiError(
        undefined,
        `Cần chọn ít nhất ${REPORT_WASTE_TAG_MIN} thẻ rác thải trước khi xác minh.`
      );
      return false;
    }
    if (pendingWasteTagIds.length > REPORT_WASTE_TAG_MAX) {
      toastApiError(undefined, `Tối đa ${REPORT_WASTE_TAG_MAX} thẻ rác thải.`);
      return false;
    }

    const serverWasteTagIds = detail.wasteTags.map(t => t.tagId).filter(Boolean);
    const body: VerifyReportInput = {
      ...(pendingSeverity !== detail.severity ? { overrideSeverity: pendingSeverity } : {}),
      ...(pendingCategoryId !== detail.categoryId ? { overrideCategoryId: pendingCategoryId } : {}),
      ...(!sameWasteTagIds(pendingWasteTagIds, serverWasteTagIds)
        ? { wasteTagIds: pendingWasteTagIds }
        : {}),
    };

    try {
      const result = await verifyMutation.mutateAsync({
        reportId: detail.id,
        body,
        idempotencyKey: verifyIdempotencyKeyRef.current.get(detail.id),
      });
      verifyIdempotencyKeyRef.current.reset();
      toastApiSuccess(result, 'Đã xác minh báo cáo.');
      await refetch();
      if (detailMode === 'verify') {
        setSuccessOpen(true);
      }
      return true;
    } catch (error) {
      toastApiError(error, 'Không thể xác minh báo cáo.');
      return false;
    }
  };

  const handleVerify = async () => {
    // Đồng bộ VerifyPageClient.handleQuickVerify — nghi trùng → dialog, không gọi verify ngay
    if (queueItem?.isPossibleDuplicate && queueItem.possibleDuplicateOfReportId) {
      setSuspectDialogMode('duplicate');
      setDuplicateDialogOpen(true);
      return;
    }

    if (isSuspectedViolationRecurrence && suspectDialogRow) {
      setSuspectDialogMode('recurrence');
      setDuplicateDialogOpen(true);
      return;
    }

    if (isClassificationUnchanged) {
      setVerifyFieldsRemindOpen(true);
      return;
    }

    await performVerify();
  };

  const handleContinueRecurrenceVerify = async () => {
    if (isClassificationUnchanged) {
      setDuplicateDialogOpen(false);
      setSuspectDialogMode('duplicate');
      setVerifyFieldsRemindOpen(true);
      return;
    }
    const ok = await performVerify();
    if (!ok) return;
    setDuplicateDialogOpen(false);
    setSuspectDialogMode('duplicate');
  };

  const handleConfirmVerifyDespiteUnchanged = async () => {
    const ok = await performVerify();
    if (ok) setVerifyFieldsRemindOpen(false);
  };

  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} reportId={detail.id} />

      <div className={cn(DETAIL_PAGE_X_PAD, 'space-y-4')}>
        <HeaderStrip
          detail={detail}
          pendingCategoryName={pendingCategoryName}
          isPossibleDuplicate={isPossibleDuplicate}
          isSuspectedViolationRecurrence={isSuspectedViolationRecurrence}
        />

        {/* Gallery → nội dung bên dưới */}
        <div className="space-y-16">
          <Gallery
            media={detail.media}
            address={detail.address}
            createdAt={detail.createdAt}
            isSuspicious={detail.isSuspicious}
            suspiciousReasons={detail.suspiciousReasons}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left — scrollable content */}
            <div className="min-w-0 space-y-8">
              {/* Title block */}
              <div className="pt-2 pb-2">
                <CardTitle className="text-2xl font-semibold leading-8 tracking-tight">
                  Được báo cáo bởi {detail.reporterName?.trim() || 'Ẩn danh'}
                </CardTitle>
                <CardDescription className="mt-1.5 text-base leading-normal">
                  <MapPin
                    className="mr-1.5 inline size-3.5 shrink-0 text-red-500 align-[-0.125em]"
                    aria-hidden
                  />
                  {detail.address}
                  <span
                    className="mx-1.5 inline-block size-1 shrink-0 rounded-full bg-foreground align-middle"
                    aria-hidden
                  />
                  <time dateTime={detail.createdAt}>
                    {new Date(detail.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </CardDescription>
              </div>

              <LocationCard
                detail={detail}
                pendingCategoryName={pendingCategoryName}
                pendingSeverity={pendingSeverity}
                pendingCategoryId={pendingCategoryId}
                setPendingCategoryId={setPendingCategoryId}
                setPendingSeverity={setPendingSeverity}
                pendingWasteTagIds={pendingWasteTagIds}
                setPendingWasteTagIds={setPendingWasteTagIds}
                categories={categories}
                catsLoading={catsLoading}
              />
            </div>

            {/* Right — sticky: AI insight above action card */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-19 lg:self-start">
              <AiInsightCard detail={detail} isPossibleDuplicate={isPossibleDuplicate} />
              <ActionCard
                detail={detail}
                onAssignNow={handleAssignNow}
                status={detail.status}
                onVerify={() => void handleVerify()}
                onReject={() => setRejectDialogOpen(true)}
                isVerifying={verifyMutation.isPending}
                isRejecting={rejectMutation.isPending}
                isPossibleDuplicate={isPossibleDuplicate}
                isSuspectedViolationRecurrence={isSuspectedViolationRecurrence}
              />
            </div>
          </div>
        </div>
      </div>

      <DuplicateSuspectDialog
        mode={suspectDialogMode}
        row={duplicateDialogOpen ? suspectDialogRow : null}
        parentPreview={null}
        open={duplicateDialogOpen && Boolean(suspectDialogRow)}
        onOpenChange={open => {
          if (!open) {
            setDuplicateDialogOpen(false);
            setSuspectDialogMode('duplicate');
          }
        }}
        onGoToParent={() => {
          const parentId = queueItem?.possibleDuplicateOfReportId;
          setDuplicateDialogOpen(false);
          setSuspectDialogMode('duplicate');
          if (!parentId) return;
          // Back từ detail gốc → list highlight đúng report gốc (user biết mình vừa xem report nào).
          router.push(
            withOfficerFromQuery(
              `/officer/verify/${parentId}`,
              `/officer/verify?highlight=${encodeURIComponent(parentId)}`
            )
          );
        }}
        onResolved={() => {
          setDuplicateDialogOpen(false);
          setSuspectDialogMode('duplicate');
          void refetch();
        }}
        onContinueVerify={() => void handleContinueRecurrenceVerify()}
        isContinuingVerify={verifyMutation.isPending && suspectDialogMode === 'recurrence'}
      />

      <SuccessDialog
        open={successOpen}
        onOpenChange={next => {
          if (!next) setSuccessOpen(false);
        }}
        accent="emerald"
        title="Thành công"
        description="Báo cáo đã được xác minh. Bước tiếp theo, bạn có thể phân công đội xử lý ngay trên trang Phân công."
        secondaryAction={{
          label: 'Để sau',
          onClick: () => setSuccessOpen(false),
        }}
        primaryAction={{
          label: 'Phân công ngay',
          onClick: handleAssignAfterVerify,
        }}
      />

      <LeoAssignDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        reportIds={[detail.id]}
        onAssigned={handleAssigned}
      />

      <RejectReportDialog
        open={rejectDialogOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectDialogOpen(false);
          setRejectReason('');
        }}
        onSubmit={() => void handleReject()}
        isSubmitting={rejectMutation.isPending}
      />

      <Dialog
        open={verifyFieldsRemindOpen}
        onOpenChange={open => {
          if (verifyMutation.isPending) return;
          setVerifyFieldsRemindOpen(open);
        }}
      >
        <DialogContent className={cn('gap-0 overflow-hidden p-0 sm:max-w-md', '[&>button]:hidden')}>
          <div
            className="relative flex h-36 items-center justify-center overflow-hidden bg-amber-600 text-white"
            aria-hidden
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/40" />
              <div className="absolute top-1/2 left-1/2 size-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/35" />
              <div className="absolute top-1/2 left-1/2 size-[13rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/30" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_45%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(180,83,9,0.5)_1px,transparent_1.5px)] bg-size-[14px_14px] opacity-30" />
            </div>
            <div className="relative flex size-16 items-center justify-center rounded-full bg-white shadow-md shadow-amber-950/20">
              <AlertTriangle className="size-8 stroke-[2.5] text-amber-600" aria-hidden />
            </div>
          </div>

          <div className="space-y-2 px-6 pt-6 pb-2 text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Kiểm tra trước khi xác minh
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Bạn chưa chỉnh loại ô nhiễm, mức độ và thẻ rác. Xác nhận đã đúng trước khi xác minh?
            </DialogDescription>
            <ul className="mt-3 space-y-2.5 rounded-lg border border-border bg-muted/40 px-3 py-3 text-left text-sm text-foreground">
              <li>
                <span className="text-muted-foreground">Loại: </span>
                <span className="font-medium">{pendingCategoryName || '—'}</span>
              </li>
              <li>
                <span className="text-muted-foreground">Mức độ: </span>
                <span className="font-medium">{REPORT_SEVERITY_LABEL_VI[pendingSeverity]}</span>
              </li>
              <li className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
                <span className="shrink-0 text-muted-foreground">Thẻ:</span>
                {detail.wasteTags.length > 0 ? (
                  detail.wasteTags.map(tag => (
                    <Badge
                      key={tag.tagId}
                      className="inline-flex h-5 items-center gap-1 border-transparent bg-emerald-600 px-2 py-0 text-xs font-medium text-white"
                    >
                      <FontAwesomeIcon
                        icon={getWasteTagFaIcon(tag.code, tag.nameVi)}
                        className="size-2.5 opacity-95"
                        aria-hidden
                      />
                      {tag.nameVi}
                    </Badge>
                  ))
                ) : (
                  <span className="font-medium">Chưa gắn thẻ</span>
                )}
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 px-6 pt-4 pb-6">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-border bg-background font-medium text-foreground hover:bg-muted/60"
              disabled={verifyMutation.isPending}
              onClick={() => setVerifyFieldsRemindOpen(false)}
            >
              Kiểm tra lại
            </Button>
            <Button
              type="button"
              className="h-11 bg-emerald-600 font-medium text-white hover:bg-emerald-500"
              disabled={verifyMutation.isPending}
              aria-busy={verifyMutation.isPending}
              onClick={() => void handleConfirmVerifyDespiteUnchanged()}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang xác minh…
                </>
              ) : (
                'Tiếp tục xác minh'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackLink({ onBack, reportId }: { onBack?: () => void; reportId?: string }) {
  const listHref = reportId
    ? `/officer/verify?highlight=${encodeURIComponent(reportId)}`
    : '/officer/verify';

  const content = (
    <>
      <ArrowLeft className="size-3.5" />
      Quay lại danh sách
    </>
  );

  if (onBack) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-xs">
        {content}
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
      <Link href={listHref}>{content}</Link>
    </Button>
  );
}
