'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Eye,
  GitMerge,
  History,
  ImageIcon,
  Loader2,
  MapPinned,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import {
  useReportImagePreview,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useConfirmDuplicateReport,
  useDismissDuplicateReport,
  useDismissViolationRecurrence,
  useReportDetail,
  useViolationRecurrenceComparison,
} from '@/hooks/useOfficer';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { ReportDetail } from '@/lib/api/models/report';
import type { ReportQueueItem } from '@/lib/api/models/reportQueue';
import type { ViolationRecurrenceReport } from '@/lib/api/models/violationRecurrence';
import { pollutionCategoryLabelVi } from '@/lib/constants/pollutionCategories';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import {
  normalizeReportStatus,
  reportStatusLabelVi,
  type ReportStatus,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { COMPARE_MAP_FRAME_HEIGHT } from '@/components/officer/verify/compareMapFrame';

const CompareReportsMap = dynamic(
  () => import('@/components/officer/verify/CompareReportsMap').then(m => m.CompareReportsMap),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          'flex min-w-0 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500 ring-1 ring-slate-200',
          COMPARE_MAP_FRAME_HEIGHT
        )}
      >
        <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden />
      </div>
    ),
  }
);

export type DuplicateParentPreview = {
  id: string;
  code: string;
  firstImageUrl: string | null;
};

export type SuspectDialogMode = 'duplicate' | 'recurrence';

type DuplicateSuspectDialogProps = {
  row: ReportQueueItem | null;
  /** Preview từ queue nếu báo cáo gốc đang ở trang hiện tại. */
  parentPreview: DuplicateParentPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToParent: () => void;
  /** Sau confirm / dismiss thành công — parent clear highlight. */
  onResolved?: () => void;
  /**
   * `duplicate` — BR-REP-031/032 nghi trùng.
   * `recurrence` — BR-REP-034 nghi ô nhiễm tái phát (reuse layout so sánh).
   */
  mode?: SuspectDialogMode;
  /**
   * Mode recurrence: tiếp tục verify bình thường (giữ cờ tái phát).
   * Parent đóng dialog rồi gọi `verifyReport`.
   */
  onContinueVerify?: () => void | Promise<void>;
  /** Disable nút tiếp tục khi parent đang verify. */
  isContinuingVerify?: boolean;
};

/** Parent đã qua giai đoạn “chỉ cần phân công” — mở chi tiết để theo dõi/xử lý. */
const POST_MERGE_VERIFY_DETAIL_STATUSES = new Set<ReportStatus>([
  'Dispatched',
  'Assigned',
  'InProgress',
  'Resolved',
  'Reopened',
  'Closed',
  'Rejected',
  'Duplicate',
  'PenaltyIssued',
  'ClosedNoViolation',
]);

/**
 * Sau gộp trùng thành công — điều hướng theo status báo gốc:
 * - Verified → trang Phân công, highlight đúng parentId
 * - Dispatched / Assigned / InProgress / … → chi tiết xác minh của báo gốc
 */
function postMergeParentHref(parentId: string, status: string | undefined): string | null {
  if (!parentId) return null;
  const normalized = normalizeReportStatus(status ?? '');
  if (normalized === 'Verified') {
    return `/officer/assign?${new URLSearchParams({ highlightReportId: parentId }).toString()}`;
  }
  if (POST_MERGE_VERIFY_DETAIL_STATUSES.has(normalized)) {
    return `/officer/verify/${encodeURIComponent(parentId)}`;
  }
  return null;
}

/** Mọi URL ảnh từ chi tiết báo cáo; fallback khi media rỗng. */
function reportImageUrls(
  detail: ReportDetail | undefined,
  fallback: string | null = null
): string[] {
  const fromMedia =
    detail?.media
      ?.filter(m => m.mediaType.toLowerCase().includes('image') && Boolean(m.url?.trim()))
      .map(m => m.url.trim()) ?? [];
  if (fromMedia.length > 0) return fromMedia;
  const fb = fallback?.trim();
  return fb ? [fb] : [];
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCoords(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Link Google Maps — không cần API key; mobile thường mở app Maps. */
function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function CoordsLink({
  lat,
  lng,
}: {
  lat: number | null | undefined;
  lng: number | null | undefined;
}) {
  const label = formatCoords(lat, lng);
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return label;
  }
  return (
    <a
      href={googleMapsUrl(lat, lng)}
      target="_blank"
      rel="noopener noreferrer"
      title="Mở vị trí trên Google Maps"
      className={cn(
        'underline-offset-2 transition-colors hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
      )}
    >
      {label}
    </a>
  );
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã báo cáo.');
  } catch {
    toast.error('Không thể sao chép. Hãy chọn và copy thủ công.');
  }
}

function CompareThumb({
  url,
  alt,
  loading,
  tone,
  badgeLabel,
  onPreview,
}: {
  url: string | null;
  alt: string;
  loading?: boolean;
  tone: 'suspect' | 'original';
  /** Override nhãn badge góc ảnh (mặc định “Trùng lặp” khi tone=suspect). */
  badgeLabel?: string;
  onPreview?: ReportPreviewHandler;
}) {
  const canPreview = Boolean(url && !loading && onPreview);
  const showBadge = tone === 'suspect' && badgeLabel !== '';
  const resolvedBadge = badgeLabel ?? 'Trùng lặp';

  return (
    <div className="group relative aspect-3/2 w-full overflow-hidden rounded-xl bg-slate-100">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-slate-400" aria-hidden />
        </div>
      ) : url ? (
        <Image src={url} alt={alt} fill sizes="200px" className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400">
          <ImageIcon className="size-6" aria-hidden />
          <span className="text-[10px]">Không có ảnh</span>
        </div>
      )}

      {showBadge ? (
        <span
          className={cn(
            'pointer-events-none absolute left-2 top-2 z-20',
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'bg-amber-500 text-[10px] font-bold uppercase tracking-wide text-white',
            'shadow-sm ring-1 ring-white/30'
          )}
        >
          {resolvedBadge === 'Tái diễn' ? (
            <History className="size-2.5" aria-hidden strokeWidth={2.75} />
          ) : (
            <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
          )}
          {resolvedBadge}
        </span>
      ) : null}

      {canPreview ? (
        <button
          type="button"
          onClick={() => onPreview?.({ url: url!, label: alt })}
          aria-label={`Xem trước ảnh ${alt}`}
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center',
            'bg-black/0 transition-colors duration-200',
            'hover:bg-black/45 focus-visible:bg-black/45',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60'
          )}
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-full',
              'bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm',
              'opacity-0 transition-opacity duration-200',
              'group-hover:opacity-100 group-focus-within:opacity-100'
            )}
          >
            <Eye className="size-4" aria-hidden />
          </span>
        </button>
      ) : null}
    </div>
  );
}

/** 1 ảnh → CompareThumb; ≥2 ảnh → shadcn Carousel. */
function CompareSideMedia({
  urls,
  alt,
  loading,
  tone,
  badgeLabel,
  onPreview,
}: {
  urls: string[];
  alt: string;
  loading?: boolean;
  tone: 'suspect' | 'original';
  badgeLabel?: string;
  onPreview?: ReportPreviewHandler;
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setSlideIndex(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  if (loading || urls.length <= 1) {
    return (
      <CompareThumb
        url={urls[0] ?? null}
        alt={alt}
        loading={loading}
        tone={tone}
        badgeLabel={badgeLabel}
        onPreview={onPreview}
      />
    );
  }

  const showBadge = tone === 'suspect' && badgeLabel !== '';
  const resolvedBadge = badgeLabel ?? 'Trùng lặp';

  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-xl bg-slate-100">
      {showBadge ? (
        <span
          className={cn(
            'pointer-events-none absolute left-2 top-2 z-20',
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
            'bg-amber-500 text-[10px] font-bold uppercase tracking-wide text-white',
            'shadow-sm ring-1 ring-white/30'
          )}
        >
          {resolvedBadge === 'Tái diễn' ? (
            <History className="size-2.5" aria-hidden strokeWidth={2.75} />
          ) : (
            <Copy className="size-2.5" aria-hidden strokeWidth={2.75} />
          )}
          {resolvedBadge}
        </span>
      ) : null}

      <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="ml-0">
          {urls.map((url, index) => {
            const label = `${alt} · ${index + 1}`;
            return (
              <CarouselItem key={`${url}-${index}`} className="pl-0">
                <button
                  type="button"
                  onClick={() => onPreview?.({ url, label })}
                  aria-label={`Xem trước ${label}`}
                  className={cn(
                    'group relative aspect-3/2 w-full overflow-hidden',
                    'cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40'
                  )}
                >
                  <Image
                    src={url}
                    alt={label}
                    fill
                    sizes="(max-width: 768px) 45vw, 280px"
                    className="object-cover"
                    unoptimized
                  />
                  <span
                    className={cn(
                      'absolute inset-0 z-10 flex items-center justify-center',
                      'bg-black/0 transition-colors duration-200',
                      'group-hover:bg-black/35 group-focus-visible:bg-black/35'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full',
                        'bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm',
                        'opacity-0 transition-opacity duration-200',
                        'group-hover:opacity-100 group-focus-visible:opacity-100'
                      )}
                    >
                      <Eye className="size-4" aria-hidden />
                    </span>
                  </span>
                </button>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious
          type="button"
          variant="secondary"
          className="left-2 top-1/2 z-20 size-8 border-0 bg-white/90 text-slate-800 shadow-sm hover:bg-white disabled:opacity-40"
        />
        <CarouselNext
          type="button"
          variant="secondary"
          className="right-2 top-1/2 z-20 size-8 border-0 bg-white/90 text-slate-800 shadow-sm hover:bg-white disabled:opacity-40"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center">
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white">
            {slideIndex + 1}/{urls.length}
          </span>
        </div>
      </Carousel>
    </div>
  );
}

function ReportCodeChip({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyCode(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-2.5 w-full space-y-1 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <button
        type="button"
        onClick={() => void handleCopy()}
        title="Sao chép mã để tìm kiếm"
        className={cn(
          'group inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1',
          'bg-white text-xs font-semibold tabular-nums text-slate-800',
          'ring-1 ring-slate-200 transition-colors',
          'hover:bg-slate-50 hover:ring-slate-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        <span className="truncate">{code}</span>
        {copied ? (
          <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <Copy
            className="size-3.5 shrink-0 text-slate-400 group-hover:text-slate-600"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}

/** Line ngang + chấm sáng ping-pong mượt (transform + mirror). */
function LinkPulse({ tall }: { tall?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [travelX, setTravelX] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      setTravelX(Math.max(0, el.clientWidth - 10));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={cn(
        'relative mx-1 flex w-10 shrink-0 items-center justify-center sm:mx-2 sm:w-14',
        tall ? 'min-h-24 self-stretch' : 'h-full min-h-16'
      )}
      aria-hidden
    >
      <div ref={trackRef} className="relative h-px w-full">
        <div className="absolute inset-0 bg-linear-to-r from-amber-400 via-slate-300 to-brand" />
        <div className="absolute inset-y-0 left-0 w-full overflow-hidden">
          <motion.div
            className="absolute -inset-y-0.5 w-8 bg-linear-to-r from-transparent via-white/70 to-transparent"
            animate={travelX > 0 ? { x: [-16, travelX + 6] } : undefined}
            transition={{
              duration: 1.55,
              ease: [0.45, 0.05, 0.55, 0.95],
              repeat: Infinity,
              repeatType: 'mirror',
            }}
          />
        </div>
        {travelX > 0 ? (
          <motion.span
            className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full bg-amber-500 will-change-transform shadow-[0_0_12px_rgba(245,158,11,0.95)]"
            initial={{ x: 0 }}
            animate={{ x: travelX }}
            transition={{
              duration: 1.55,
              ease: [0.45, 0.05, 0.55, 0.95],
              repeat: Infinity,
              repeatType: 'mirror',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function formatWasteTags(detail: ReportDetail): string {
  if (!detail.wasteTags?.length) return '—';
  return (
    detail.wasteTags
      .map(t => t.nameVi?.trim() || t.code)
      .filter(Boolean)
      .join(', ') || '—'
  );
}

function formatAiClassifiedType(detail: ReportDetail): string {
  return pollutionCategoryLabelVi(detail.aiClassifiedType);
}

/** Haversine (m) — tín hiệu quan trọng khi quyết định gộp trùng cùng điểm. */
function metersBetween(a: ReportDetail, b: ReportDetail): number | null {
  if (
    a.latitude == null ||
    a.longitude == null ||
    b.latitude == null ||
    b.longitude == null ||
    Number.isNaN(a.latitude) ||
    Number.isNaN(a.longitude) ||
    Number.isNaN(b.latitude) ||
    Number.isNaN(b.longitude)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function formatMeters(meters: number): string {
  const rounded = Math.round(meters);
  if (rounded < 1000) return `${rounded} m`;
  return `${Math.round(rounded / 1000)} km`;
}

function SeverityPill({ severity }: { severity: ReportDetail['severity'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold',
        REPORT_SEVERITY_BADGE_CLASSES[severity]
      )}
    >
      {REPORT_SEVERITY_LABEL_VI[severity]}
    </span>
  );
}

type CompareField = {
  key: string;
  label: string;
  render: (detail: ReportDetail) => ReactNode;
};

/**
 * Field đủ để cán bộ quyết định gộp / bác bỏ.
 * Thứ tự: địa chỉ → loại → thời điểm → mức độ → thành phần → AI.
 * Vị trí GPS so trên map bên dưới (không còn hàng tọa độ).
 */
const COMPARE_FIELDS: CompareField[] = [
  {
    key: 'address',
    label: 'Địa chỉ',
    render: d => d.address?.trim() || '—',
  },
  {
    key: 'category',
    label: 'Loại ô nhiễm',
    render: d => d.categoryName?.trim() || d.categoryCode || '—',
  },
  {
    key: 'createdAt',
    label: 'Thời điểm báo cáo',
    render: d => formatShortDate(d.createdAt),
  },
  {
    key: 'severity',
    label: 'Mức độ',
    render: d => <SeverityPill severity={d.severity} />,
  },
  {
    key: 'wasteTags',
    label: 'Thành phần',
    render: d => formatWasteTags(d),
  },
  {
    key: 'aiClassifiedType',
    label: 'Loại AI phân loại',
    render: d => formatAiClassifiedType(d),
  },
];

function VerifiedRecordsCompare({
  suspect,
  parent,
  suspectImageUrls,
  parentImageUrls,
  suspectLoading,
  onPreview,
}: {
  suspect: ReportDetail;
  parent: ReportDetail;
  suspectImageUrls: string[];
  parentImageUrls: string[];
  suspectLoading?: boolean;
  onPreview: ReportPreviewHandler;
}) {
  const distanceM = metersBetween(suspect, parent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-5"
    >
      <div className="flex min-w-0 shrink-0 items-start gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <CompareSideMedia
            urls={suspectImageUrls}
            alt={`${suspect.code} · Đang xác minh`}
            loading={suspectLoading}
            tone="suspect"
            onPreview={onPreview}
          />
        </div>
        <LinkPulse tall />
        <div className="min-w-0 flex-1">
          <CompareSideMedia
            urls={parentImageUrls}
            alt={`${parent.code} · Báo cáo gốc`}
            tone="original"
            onPreview={onPreview}
          />
        </div>
      </div>

      {(distanceM != null || parent.reporterCount > 1) && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
          {distanceM != null ? (
            <AnimatedHoverTooltip name="Khoảng cách GPS giữa vị trí hai báo cáo">
              <span
                className={cn(
                  'inline-flex cursor-help items-center rounded-lg px-3 py-1 text-xs font-semibold',
                  distanceM <= 200
                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                    : distanceM <= 1000
                      ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80'
                )}
              >
                Cách nhau ~{formatMeters(distanceM)}
              </span>
            </AnimatedHoverTooltip>
          ) : null}
          {parent.reporterCount > 1 ? (
            <AnimatedHoverTooltip name="Số người đã báo cáo trùng vào báo cáo gốc này">
              <span className="inline-flex cursor-help items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/25">
                Gốc có {parent.reporterCount} người báo
              </span>
            </AnimatedHoverTooltip>
          ) : null}
        </div>
      )}

      {/* Mỗi hàng border-r bên trái → đường dọc liên tục giữa 2 cột (như mẫu) */}
      <div>
        <div className="grid grid-cols-2">
          <div className="border-r border-slate-200 px-2 pb-1 text-center sm:px-5">
            <button
              type="button"
              onClick={() => void copyCode(suspect.code)}
              title="Sao chép mã báo cáo"
              className={cn(
                'max-w-full truncate text-lg font-bold tracking-tight text-slate-900 tabular-nums',
                'transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
              )}
            >
              {suspect.code}
            </button>
            <p className="mt-1 text-xs font-medium text-slate-500">Đang xác minh</p>
          </div>
          <div className="px-2 pb-1 text-center sm:px-5">
            <button
              type="button"
              onClick={() => void copyCode(parent.code)}
              title="Sao chép mã báo cáo"
              className={cn(
                'max-w-full truncate text-lg font-bold tracking-tight text-slate-900 tabular-nums',
                'transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
              )}
            >
              {parent.code}
            </button>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Báo cáo gốc · {reportStatusLabelVi(parent.status)}
            </p>
          </div>
        </div>

        {COMPARE_FIELDS.map(field => (
          <div
            key={field.key}
            className="grid grid-cols-2 transition-colors duration-150 hover:bg-slate-50/90"
          >
            <div className="flex flex-col items-center gap-1.5 border-r border-slate-200 px-2 py-4 text-center sm:px-5">
              <p className="text-xs font-normal uppercase text-slate-500">{field.label}</p>
              <div className="text-sm leading-relaxed font-semibold wrap-break-word text-slate-800">
                {field.render(suspect)}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center sm:px-5">
              <p className="text-xs font-normal uppercase text-slate-500">{field.label}</p>
              <div className="text-sm leading-relaxed font-semibold wrap-break-word text-slate-800">
                {field.render(parent)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="min-w-0 w-full space-y-2.5" aria-label="Bản đồ vị trí hai báo cáo">
        <div className="flex min-w-0 items-center gap-2 px-0.5">
          <MapPinned className="size-4 shrink-0 text-slate-500" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-800">Vị trí trên bản đồ</h3>
          {distanceM != null ? (
            <span className="min-w-0 truncate text-xs text-slate-500">
              · cách nhau ~{formatMeters(distanceM)}
            </span>
          ) : null}
        </div>
        <CompareReportsMap
          className="min-w-0 w-full"
          pins={[
            {
              latitude: suspect.latitude,
              longitude: suspect.longitude,
              label: suspect.code,
              tone: 'suspect',
            },
            {
              latitude: parent.latitude,
              longitude: parent.longitude,
              label: parent.code,
              tone: 'original',
            },
          ]}
        />
      </section>
    </motion.div>
  );
}

function firstRecurrenceImageUrl(report: ViolationRecurrenceReport): string | null {
  if (!report.media?.length) return null;
  const image = report.media.find(m => m.type.toLowerCase().includes('image'));
  const pick = image ?? report.media[0];
  return pick?.thumbnailUrl || pick?.url || null;
}

type RecurrenceCompareField = {
  key: string;
  label: string;
  render: (side: ViolationRecurrenceReport) => ReactNode;
};

const RECURRENCE_COMPARE_FIELDS: RecurrenceCompareField[] = [
  {
    key: 'address',
    label: 'Địa chỉ',
    render: d => d.address?.trim() || '—',
  },
  {
    key: 'coords',
    label: 'Tọa độ GPS',
    render: d => <CoordsLink lat={d.latitude} lng={d.longitude} />,
  },
  {
    key: 'category',
    label: 'Loại ô nhiễm',
    render: d => d.categoryName?.trim() || d.categoryCode || '—',
  },
  {
    key: 'severity',
    label: 'Mức độ',
    render: d => <SeverityPill severity={d.severity} />,
  },
  {
    key: 'description',
    label: 'Mô tả',
    render: d => d.description?.trim() || '—',
  },
  {
    key: 'createdAt',
    label: 'Thời điểm báo cáo',
    render: d => formatShortDate(d.createdAt),
  },
  {
    key: 'closedAt',
    label: 'Thời điểm đóng',
    render: d => formatShortDate(d.closedAt),
  },
  {
    key: 'inspection',
    label: 'Đã thanh tra trước',
    render: d => (d.hadPriorInspection ? 'Có' : 'Không'),
  },
];

/** So sánh current vs prior Closed — reuse layout VerifiedRecordsCompare (BR-REP-034). */
function RecurrenceRecordsCompare({
  current,
  prior,
  currentImageUrl,
  priorImageUrl,
  daysSincePriorClosed,
  distanceMeters,
  onPreview,
}: {
  current: ViolationRecurrenceReport;
  prior: ViolationRecurrenceReport;
  currentImageUrl: string | null;
  priorImageUrl: string | null;
  daysSincePriorClosed: number;
  distanceMeters: number;
  onPreview: ReportPreviewHandler;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex min-h-0 flex-1 flex-col gap-5"
    >
      <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <CompareThumb
            url={currentImageUrl}
            alt={`${current.code} · Báo cáo hiện tại`}
            tone="suspect"
            badgeLabel="Tái diễn"
            onPreview={onPreview}
          />
        </div>
        <LinkPulse tall />
        <div className="min-w-0 flex-1">
          <CompareThumb
            url={priorImageUrl}
            alt={`${prior.code} · Đã đóng trước đó`}
            tone="original"
            onPreview={onPreview}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
        <AnimatedHoverTooltip name="Khoảng cách GPS giữa hai vị trí báo cáo">
          <span
            className={cn(
              'inline-flex cursor-help items-center rounded-lg px-3 py-1 text-xs font-semibold',
              distanceMeters <= 200
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                : distanceMeters <= 1000
                  ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                  : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80'
            )}
          >
            Cách nhau ~{formatMeters(distanceMeters)}
          </span>
        </AnimatedHoverTooltip>
        <AnimatedHoverTooltip name="Số ngày kể từ khi báo cáo Closed trước được đóng">
          <span className="inline-flex cursor-help items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
            Cách lần đóng trước {daysSincePriorClosed} ngày
          </span>
        </AnimatedHoverTooltip>
        {prior.hadPriorInspection ? (
          <AnimatedHoverTooltip name="Báo cáo Closed trước đã từng có hồ sơ thanh tra">
            <span className="inline-flex cursor-help items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200/80">
              Đã từng thanh tra
            </span>
          </AnimatedHoverTooltip>
        ) : null}
      </div>

      <div>
        <div className="grid grid-cols-2">
          <div className="border-r border-slate-200 px-2 pb-1 text-center sm:px-5">
            <button
              type="button"
              onClick={() => void copyCode(current.code)}
              title="Sao chép mã báo cáo"
              className={cn(
                'max-w-full truncate text-lg font-bold tracking-tight text-slate-900 tabular-nums',
                'transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
              )}
            >
              {current.code}
            </button>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Hiện tại · {reportStatusLabelVi(current.status)}
            </p>
          </div>
          <div className="px-2 pb-1 text-center sm:px-5">
            <button
              type="button"
              onClick={() => void copyCode(prior.code)}
              title="Sao chép mã báo cáo"
              className={cn(
                'max-w-full truncate text-lg font-bold tracking-tight text-slate-900 tabular-nums',
                'transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
              )}
            >
              {prior.code}
            </button>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Closed trước · {reportStatusLabelVi(prior.status)}
            </p>
          </div>
        </div>

        {RECURRENCE_COMPARE_FIELDS.map(field => (
          <div
            key={field.key}
            className="grid grid-cols-2 transition-colors duration-150 hover:bg-slate-50/90"
          >
            <div className="flex flex-col items-center gap-1.5 border-r border-slate-200 px-2 py-4 text-center sm:px-5">
              <p className="text-xs font-normal uppercase text-slate-500">{field.label}</p>
              <div className="text-sm leading-relaxed font-semibold wrap-break-word text-slate-800">
                {field.render(current)}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 py-4 text-center sm:px-5">
              <p className="text-xs font-normal uppercase text-slate-500">{field.label}</p>
              <div className="text-sm leading-relaxed font-semibold wrap-break-word text-slate-800">
                {field.render(prior)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RecurrenceSuspectDialogBody({
  row,
  open,
  onOpenChange,
  onResolved,
  onContinueVerify,
  isContinuingVerify = false,
}: {
  row: ReportQueueItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved?: () => void;
  onContinueVerify?: () => void | Promise<void>;
  isContinuingVerify?: boolean;
}) {
  /**
   * Path `{id}` = báo cáo hiện tại đang gắn cờ tái phát (Swagger BR-REP-034).
   * Prior Closed nằm trong `data.priorClosedReport` (khớp `suspectedRecurrenceOfReportId`).
   */
  const reportId = row.id;

  const {
    data: comparison,
    isPending,
    isError,
  } = useViolationRecurrenceComparison(reportId, { enabled: open && Boolean(reportId) });

  const dismissMutation = useDismissViolationRecurrence();
  const actionPending = dismissMutation.isPending || isContinuingVerify;

  const currentImageUrl = comparison ? firstRecurrenceImageUrl(comparison.currentReport) : null;
  const priorImageUrl = comparison ? firstRecurrenceImageUrl(comparison.priorClosedReport) : null;

  const previewImages: ReportPreviewImage[] = [];
  if (currentImageUrl && comparison) {
    previewImages.push({
      url: currentImageUrl,
      label: `${comparison.currentReport.code} · Hiện tại`,
    });
  }
  if (priorImageUrl && comparison) {
    previewImages.push({
      url: priorImageUrl,
      label: `${comparison.priorClosedReport.code} · Closed trước`,
    });
  }

  const { openPreview, previewDialog } = useReportImagePreview(previewImages);

  const handleDismiss = async () => {
    try {
      const result = await dismissMutation.mutateAsync({ reportId });
      toastApiSuccess(result, 'Đã xóa nghi ô nhiễm tái diễn.');
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      toastApiError(error, 'Không thể xóa nghi ô nhiễm tái diễn.');
    }
  };

  const handleContinueVerify = async () => {
    try {
      await onContinueVerify?.();
    } catch {
      // Parent đã toast lỗi verify — giữ dialog nếu parent không đóng.
    }
  };

  const priorCode =
    comparison?.priorClosedReport.code ??
    row.suspectedRecurrenceOfReportCode ??
    row.suspectedRecurrenceOfReportId ??
    '—';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex h-[min(94vh,68rem)] w-[calc(100%-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-slate-200 p-0',
            'sm:max-w-7xl xl:max-w-[88rem]'
          )}
        >
          {isPending ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
            </div>
          ) : isError || !comparison ? (
            <>
              <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 sm:px-7">
                <DialogHeader className="space-y-0 text-left">
                  <DialogTitle className="text-lg text-slate-900">
                    Không tải được so sánh tái diễn
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    Không thể đối chiếu với báo cáo Closed trước (
                    <span className="font-semibold tabular-nums">{priorCode}</span>). Có thể tiếp
                    tục xác minh hoặc thử lại sau.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:px-7">
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionPending}
                  onClick={() => void handleDismiss()}
                  className={cn(
                    'border-slate-300 text-slate-700',
                    'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                  )}
                >
                  {dismissMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <XCircle className="size-4" aria-hidden />
                  )}
                  Xóa nghi tái diễn
                </Button>
                <Button
                  type="button"
                  disabled={actionPending || !onContinueVerify}
                  onClick={() => void handleContinueVerify()}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {isContinuingVerify ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <BadgeCheck className="size-4" aria-hidden />
                  )}
                  Tiếp tục xác minh
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 sm:px-7">
                <DialogHeader className="space-y-0 text-left">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/25"
                      aria-hidden
                    >
                      <History className="size-5" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0 space-y-1.5 pt-0.5">
                      <DialogTitle className="text-lg leading-snug text-slate-900">
                        Nghi ô nhiễm tái diễn
                      </DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed text-slate-600">
                        Đối chiếu báo cáo hiện tại với case Closed trước{' '}
                        <span className="font-semibold tabular-nums text-slate-800">
                          {comparison.priorClosedReport.code}
                        </span>
                        . Rác tái diễn thông thường →{' '}
                        <span className="font-semibold text-slate-800">Xóa nghi tái diễn</span>. Cần
                        xử lý tiếp →{' '}
                        <span className="font-semibold text-slate-800">Tiếp tục xác minh</span>.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 [scrollbar-gutter:stable]">
                <RecurrenceRecordsCompare
                  current={comparison.currentReport}
                  prior={comparison.priorClosedReport}
                  currentImageUrl={currentImageUrl}
                  priorImageUrl={priorImageUrl}
                  daysSincePriorClosed={comparison.daysSincePriorClosed}
                  distanceMeters={comparison.distanceMeters}
                  onPreview={openPreview}
                />
              </div>

              <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:gap-2 sm:px-7">
                <Button
                  type="button"
                  disabled={actionPending}
                  onClick={() => void handleDismiss()}
                  className={cn(
                    'border-slate-300 bg-white text-slate-700',
                    'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700',
                    'focus-visible:ring-rose-400/40'
                  )}
                  variant="outline"
                >
                  {dismissMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <XCircle className="size-4" aria-hidden />
                  )}
                  Xóa nghi tái diễn
                </Button>
                <Button
                  type="button"
                  disabled={actionPending || !onContinueVerify}
                  onClick={() => void handleContinueVerify()}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {isContinuingVerify ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <BadgeCheck className="size-4" aria-hidden />
                  )}
                  Tiếp tục xác minh
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {previewDialog}
    </>
  );
}

export function DuplicateSuspectDialog({
  row,
  parentPreview,
  open,
  onOpenChange,
  onGoToParent,
  onResolved,
  mode = 'duplicate',
  onContinueVerify,
  isContinuingVerify,
}: DuplicateSuspectDialogProps) {
  // Tách body để tránh conditional hooks khi đổi mode.
  if (mode === 'recurrence') {
    if (!row) return null;
    return (
      <RecurrenceSuspectDialogBody
        row={row}
        open={open}
        onOpenChange={onOpenChange}
        onResolved={onResolved}
        onContinueVerify={onContinueVerify}
        isContinuingVerify={isContinuingVerify}
      />
    );
  }

  return (
    <DuplicateSuspectDialogBody
      row={row}
      parentPreview={parentPreview}
      open={open}
      onOpenChange={onOpenChange}
      onGoToParent={onGoToParent}
      onResolved={onResolved}
    />
  );
}

function DuplicateSuspectDialogBody({
  row,
  parentPreview,
  open,
  onOpenChange,
  onGoToParent,
  onResolved,
}: Omit<DuplicateSuspectDialogProps, 'mode'>) {
  const router = useRouter();
  const parentId = row?.possibleDuplicateOfReportId ?? '';
  const suspectId = row?.id ?? '';

  const { data: parentDetail, isPending: parentLoading } = useReportDetail(
    open && parentId ? parentId : ''
  );
  const { data: suspectDetail, isPending: suspectLoading } = useReportDetail(
    open && suspectId ? suspectId : ''
  );

  const confirmMutation = useConfirmDuplicateReport();
  const dismissMutation = useDismissDuplicateReport();
  const actionPending = confirmMutation.isPending || dismissMutation.isPending;

  const parentStatus = parentDetail?.status;
  const canCompareWithParent = parentStatus === 'Verified' || parentStatus === 'InProgress';

  const parentCode =
    parentDetail?.code ??
    parentPreview?.code ??
    row?.possibleDuplicateOfReportCode ??
    parentId ??
    '—';

  const suspectImageUrls = reportImageUrls(suspectDetail, row?.firstImageUrl ?? null);
  const parentImageUrls = reportImageUrls(parentDetail, parentPreview?.firstImageUrl ?? null);

  const previewImages: ReportPreviewImage[] = [
    ...suspectImageUrls.map((url, index) => ({
      url,
      label: `${row?.code ?? 'Báo cáo'} · Đang xác minh · ${index + 1}`,
    })),
    ...parentImageUrls.map((url, index) => ({
      url,
      label: `${parentCode} · Báo cáo gốc · ${index + 1}`,
    })),
  ];

  const { openPreview, previewDialog } = useReportImagePreview(previewImages);

  const handleDismiss = async () => {
    if (!row) return;
    try {
      const result = await dismissMutation.mutateAsync({ reportId: row.id });
      toastApiSuccess(result, 'Đã bác bỏ nghi ngờ trùng lặp.');
      onOpenChange(false);
      onResolved?.();
    } catch (error) {
      toastApiError(error, 'Không thể bác bỏ nghi ngờ trùng lặp.');
    }
  };

  const handleConfirm = async () => {
    if (!row || !parentId) return;
    try {
      const result = await confirmMutation.mutateAsync({
        reportId: row.id,
        body: { primaryReportId: parentId },
      });
      toastApiSuccess(result, 'Đã gộp báo cáo trùng lặp.');
      onOpenChange(false);
      onResolved?.();
      const nextHref = postMergeParentHref(parentId, parentStatus);
      if (nextHref) {
        router.push(nextHref);
      }
    } catch (error) {
      toastApiError(error, 'Không thể gộp báo cáo trùng lặp.');
    }
  };

  const showLoading = open && Boolean(parentId) && parentLoading;
  const dialogWide = canCompareWithParent;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 overflow-hidden border-slate-200 p-0',
            dialogWide
              ? 'h-[min(94vh,68rem)] w-[calc(100%-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-7xl xl:max-w-[88rem]'
              : 'max-h-[min(92vh,60rem)] w-[calc(100%-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-2xl'
          )}
        >
          {row ? (
            showLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
              </div>
            ) : (
              <>
                <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-6 sm:px-7">
                  <DialogHeader className="space-y-0 text-left">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl',
                          canCompareWithParent
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                        )}
                        aria-hidden
                      >
                        <Copy className="size-5" strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0 space-y-1.5 pt-0.5">
                        <DialogTitle className="text-lg leading-snug text-slate-900">
                          {canCompareWithParent
                            ? 'So sánh 2 báo cáo'
                            : 'Nghi ngờ báo cáo trùng lặp'}
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed text-slate-600">
                          {canCompareWithParent ? (
                            <>
                              Báo cáo gốc{' '}
                              <span className="font-semibold tabular-nums text-slate-800">
                                {parentCode}
                              </span>{' '}
                              đang ở trạng thái{' '}
                              <span className="font-semibold text-brand-dark">
                                {reportStatusLabelVi(parentStatus ?? '')}
                              </span>
                              . Đối chiếu thông tin hai bên rồi chọn{' '}
                              <span className="font-semibold text-slate-800">bác bỏ</span> hoặc{' '}
                              <span className="font-semibold text-slate-800">gộp trùng</span>.
                            </>
                          ) : (
                            <>
                              Báo cáo gốc{' '}
                              <span className="font-semibold tabular-nums text-amber-800">
                                {parentCode}
                              </span>{' '}
                              vẫn đang{' '}
                              <span className="font-semibold text-amber-800">chờ xác minh</span>.
                              Hãy xác minh báo cáo{' '}
                              <span className="font-semibold tabular-nums text-slate-800">
                                {parentCode}
                              </span>{' '}
                              trước, rồi quay lại xử lý báo cáo nghi trùng này.
                            </>
                          )}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div
                  className={cn(
                    'min-h-0 flex-1',
                    dialogWide
                      ? 'flex flex-col overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 [scrollbar-gutter:stable]'
                      : 'overflow-y-auto overscroll-contain px-6 py-5 sm:px-7 [scrollbar-gutter:stable]'
                  )}
                >
                  {canCompareWithParent && parentDetail && suspectDetail ? (
                    <VerifiedRecordsCompare
                      suspect={suspectDetail}
                      parent={parentDetail}
                      suspectImageUrls={suspectImageUrls}
                      parentImageUrls={parentImageUrls}
                      suspectLoading={suspectLoading}
                      onPreview={openPreview}
                    />
                  ) : (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <CompareSideMedia
                          urls={suspectImageUrls}
                          alt={`${row.code} · Đang xác minh`}
                          tone="suspect"
                          onPreview={openPreview}
                        />
                        <ReportCodeChip code={row.code} label="Đang xác minh" />
                      </div>

                      <LinkPulse />

                      <div className="min-w-0 flex-1">
                        <CompareSideMedia
                          urls={parentImageUrls}
                          alt={`${parentCode} · Báo cáo gốc`}
                          loading={parentLoading}
                          tone="original"
                          onPreview={openPreview}
                        />
                        <ReportCodeChip code={parentCode} label="Báo cáo gốc" />
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:gap-2 sm:px-7">
                  {canCompareWithParent ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionPending}
                        onClick={() => void handleDismiss()}
                        className={cn(
                          'border-slate-300 text-slate-700',
                          'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700',
                          'focus-visible:ring-rose-400/40'
                        )}
                      >
                        {dismissMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <XCircle className="size-4" aria-hidden />
                        )}
                        Từ chối nghi trùng
                      </Button>
                      <Button
                        type="button"
                        disabled={actionPending || !parentId}
                        onClick={() => void handleConfirm()}
                        className="bg-amber-600 text-white hover:bg-amber-500"
                      >
                        {confirmMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                          <GitMerge className="size-4" aria-hidden />
                        )}
                        Xác nhận gộp trùng
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                      </Button>
                      <Button
                        type="button"
                        className="bg-amber-600 text-white hover:bg-amber-500"
                        onClick={onGoToParent}
                        disabled={!row.possibleDuplicateOfReportId}
                      >
                        Đi đến xác minh
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            )
          ) : null}
        </DialogContent>
      </Dialog>
      {previewDialog}
    </>
  );
}
