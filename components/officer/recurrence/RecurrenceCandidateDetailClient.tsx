'use client';

import { CreateInspectionReportDialog } from '@/components/officer/recurrence/CreateInspectionReportDialog';
import {
  useReportImagePreview,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { COMPARE_MAP_FRAME_HEIGHT } from '@/components/officer/verify/compareMapFrame';
import { useViolationRecurrenceComparison } from '@/hooks/useOfficer';
import type {
  ViolationRecurrenceComparison,
  ViolationRecurrenceMedia,
  ViolationRecurrenceReport,
} from '@/lib/api/models/violationRecurrence';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import type { ReportStatus } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { goBackWithListSoftReload } from '@/utils/notificationNavigation';
import { withOfficerFromQuery, officerTrackingDetailHref } from '@/utils/officerNavigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  ImageIcon,
  MapPinned,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

const CompareReportsMap = dynamic(
  () => import('@/components/officer/verify/CompareReportsMap').then(m => m.CompareReportsMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        className={cn('w-full rounded-xl', COMPARE_MAP_FRAME_HEIGHT)}
        aria-label="Đang tải bản đồ"
      />
    ),
  }
);

const RECURRENCE_LIST_PATH = '/officer/recurrence';

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

function formatMeters(meters: number): string {
  const rounded = Math.round(meters);
  if (rounded < 1000) return `${rounded} m`;
  return `${Math.round(rounded / 1000)} km`;
}

/**
 * Deep-link chi tiết theo vòng đời báo cáo — luôn kèm `from` để Quay lại đúng trang so sánh.
 * Closed → reports · Verified → assign · InProgress → tracking · còn lại → reports.
 */
function resolveReportDetailHref(reportId: string, status: ReportStatus, fromPath: string): string {
  if (status === 'InProgress') {
    return officerTrackingDetailHref(reportId, fromPath);
  }
  if (status === 'Verified') {
    return withOfficerFromQuery(`/officer/assign/${reportId}`, fromPath);
  }
  // Closed (+ ClosedNoViolation / Resolved / mặc định xem hồ sơ)
  return withOfficerFromQuery(`/officer/reports/${reportId}`, fromPath);
}

function toGalleryImages(
  media: ViolationRecurrenceMedia[],
  code: string
): (ReportPreviewImage & { type: string })[] {
  return media
    .filter(m => m.url || m.thumbnailUrl)
    .map((m, i) => ({
      url: m.url || m.thumbnailUrl,
      label: `${code} · ảnh ${i + 1}`,
      uploadedAt: m.uploadedAt,
      type: m.type?.trim() ?? '',
    }));
}

/** Nhãn VI cho `media[].type` — khớp `lib/constants/mediaType.ts`. */
function mediaTypeLabelVi(type: string): string {
  switch (type) {
    case 'Image':
      return 'Ảnh từ người dân';
    case 'Video':
      return 'Video';
    case 'Before':
      return 'Ảnh trước xử lý';
    case 'Progress':
      return 'Ảnh đang xử lý';
    case 'After':
      return 'Ảnh sau xử lý';
    case 'Inspection':
      return 'Thanh tra';
    case 'ReopenEvidence':
      return 'Minh chứng mở lại';
    default:
      return type;
  }
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

function SeverityPill({ severity }: { severity: ViolationRecurrenceReport['severity'] }) {
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

/** Badge loại báo cáo + #code + «Xem chi tiết» — navigate theo status + `from` back. */
function SidePanelHeader({
  side,
  roleLabel,
  roleTone,
  fromPath,
}: {
  side: ViolationRecurrenceReport;
  roleLabel: string;
  roleTone: 'suspect' | 'prior';
  fromPath: string;
}) {
  const detailHref = resolveReportDetailHref(side.id, side.status, fromPath);

  return (
    <div className="flex min-w-0 w-full flex-wrap items-center gap-2">
      <span
        className={cn(
          'inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
          roleTone === 'suspect' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
        )}
      >
        {roleLabel}
      </span>
      <div className="group/copyrow flex min-w-0 items-center gap-1">
        <span
          title={side.code}
          className="min-w-0 truncate text-sm font-bold tabular-nums text-slate-900"
        >
          #{side.code}
        </span>
        <CopyIconButton
          value={side.code}
          label={`Sao chép mã ${side.code}`}
          successMessage="Đã sao chép mã báo cáo."
        />
      </div>
      <Link
        href={detailHref}
        className={cn(
          'ml-auto shrink-0 text-xs font-medium text-sky-700 transition-colors',
          'hover:text-sky-800 hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
        )}
      >
        Xem chi tiết
      </Link>
    </div>
  );
}

const CAROUSEL_EASE = [0.22, 1, 0.36, 1] as const;
const CAROUSEL_DURATION = 0.42;

/**
 * Gallery 4:3 — cùng layout ảnh `FeaturedEvidenceGallery` (ReopenDetailClient).
 * Ảnh ngang fill; ảnh dọc object-contain + blur hai bên.
 */
function FeaturedEvidenceGallery({
  media,
  code,
  latitude,
  longitude,
  emptyLabel = 'Không có ảnh minh chứng',
  showTypeBadge = false,
}: {
  media: ViolationRecurrenceMedia[];
  code: string;
  latitude?: number;
  longitude?: number;
  emptyLabel?: string;
  /** Badge `type` góc phải trên ảnh chính — chỉ Báo cáo đã đóng. */
  showTypeBadge?: boolean;
}) {
  const galleryItems = toGalleryImages(media, code);
  const images: ReportPreviewImage[] = galleryItems.map(({ url, label, uploadedAt, type }) => {
    const typeLabel = showTypeBadge ? mediaTypeLabelVi(type) : '';
    return {
      url,
      label,
      uploadedAt,
      ...(typeLabel ? { typeLabel } : {}),
    };
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const mapLocation = useMemo(() => {
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      (latitude === 0 && longitude === 0)
    ) {
      return null;
    }
    return { latitude, longitude };
  }, [latitude, longitude]);

  const { setPreviewIndex, previewDialog } = useReportImagePreview(images, {
    mapLocation,
  });

  if (images.length === 0) {
    return (
      <div className="mx-auto flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-slate-50 text-sm text-muted-foreground">
        <ImageIcon className="size-6 text-slate-400" aria-hidden />
        <span>{emptyLabel}</span>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const featured = images[safeIndex]!;
  const featuredTypeLabel = mediaTypeLabelVi(galleryItems[safeIndex]?.type ?? '');
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < images.length - 1;

  const goTo = (next: number) => {
    if (next === safeIndex || next < 0 || next >= images.length) return;
    setDirection(next > safeIndex ? 1 : -1);
    setActiveIndex(next);
  };

  const openLightbox = () => {
    setPreviewIndex(safeIndex);
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={featured.url}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir >= 0 ? '28%' : '-28%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir >= 0 ? '-28%' : '28%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: CAROUSEL_DURATION, ease: CAROUSEL_EASE }}
            className="absolute inset-0"
          >
            {/* Pillarbox: ảnh cover + blur lấp phần thiếu; ảnh gốc contain ở trên */}
            <div className="pointer-events-none absolute -inset-[18%]" aria-hidden>
              <Image
                src={featured.url}
                alt=""
                fill
                unoptimized
                className="scale-110 object-cover blur-3xl"
                sizes="(max-width: 768px) 50vw, 28vw"
              />
            </div>
            <button
              type="button"
              onClick={openLightbox}
              className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/50"
              aria-label={`Phóng to ${featured.label}`}
            >
              <Image
                src={featured.url}
                alt={featured.label}
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 28vw"
              />
            </button>
          </motion.div>
        </AnimatePresence>

        {showTypeBadge && featuredTypeLabel ? (
          <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm">
            {featuredTypeLabel}
          </span>
        ) : null}

        {hasPrev ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-20 size-7 -translate-y-1/2 rounded-md bg-white/95 text-slate-700 shadow-md hover:bg-white"
            onClick={e => {
              e.stopPropagation();
              goTo(safeIndex - 1);
            }}
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}

        {hasNext ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-20 size-7 -translate-y-1/2 rounded-md bg-white/95 text-slate-700 shadow-md hover:bg-white"
            onClick={e => {
              e.stopPropagation();
              goTo(safeIndex + 1);
            }}
            aria-label="Ảnh sau"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}

        <span className="pointer-events-none absolute bottom-2 right-2 z-20 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
          {safeIndex + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-1.5 overflow-x-auto overflow-y-visible py-1.5">
          {images.map((img, index) => {
            const isActive = index === safeIndex;
            return (
              <li key={`${img.url}-${index}`} className="shrink-0 p-0.5">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Chọn ${img.label}`}
                  aria-pressed={isActive}
                  className={cn(
                    'relative block size-10 cursor-pointer overflow-hidden rounded-md bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 sm:size-12',
                    isActive
                      ? 'ring-2 ring-slate-900 ring-offset-1'
                      : 'ring-1 ring-border hover:ring-slate-400'
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {previewDialog}
    </div>
  );
}

/** Line ngang + chấm sáng ping-pong — parity `DuplicateSuspectDialog.LinkPulse`. */
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
        tall ? 'min-h-28 self-stretch' : 'h-full min-h-16'
      )}
      aria-hidden
    >
      <div ref={trackRef} className="relative h-px w-full">
        <div className="absolute inset-0 bg-linear-to-r from-amber-400 via-slate-300 to-sky-400" />
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

type RecurrenceCompareField = {
  key: string;
  label: string;
  render: (side: ViolationRecurrenceReport) => ReactNode;
};

/** Thứ tự khớp dialog xác minh: địa chỉ → thời điểm → loại → mức độ → thanh tra. */
const RECURRENCE_COMPARE_FIELDS: RecurrenceCompareField[] = [
  {
    key: 'address',
    label: 'Địa chỉ',
    render: d => d.address?.trim() || '—',
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
    key: 'inspection',
    label: 'Đã thanh tra',
    render: d => (d.hadPriorInspection ? 'Có' : 'Không'),
  },
  {
    key: 'description',
    label: 'Mô tả',
    render: d => d.description?.trim() || '—',
  },
];

/** Skeleton mirror layout so sánh — media 2 cột + hàng field. */
function CompareDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Đang tải">
      <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
        </div>
        <div
          className="mx-1 flex w-10 shrink-0 items-center justify-center sm:mx-2 sm:w-14"
          aria-hidden
        >
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="aspect-4/3 w-full rounded-lg" />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>

      <div>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="grid grid-cols-2">
            <div className="flex flex-col items-center gap-1.5 border-r border-slate-200 px-2 py-4 sm:px-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2 py-4 sm:px-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className={cn('w-full rounded-xl', COMPARE_MAP_FRAME_HEIGHT)} />
      </div>
    </div>
  );
}

/**
 * Body so sánh — gallery 4:3 + LinkPulse + bảng field (dialog style).
 * Badge + #code nằm trên ảnh như layout trước.
 */
function RecurrenceCompareBody({
  comparison,
  fromPath,
}: {
  comparison: ViolationRecurrenceComparison;
  fromPath: string;
}) {
  const { currentReport: current, priorClosedReport: prior } = comparison;
  const { distanceMeters } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SidePanelHeader
            side={current}
            roleLabel="Nghi tái diễn"
            roleTone="suspect"
            fromPath={fromPath}
          />
          <FeaturedEvidenceGallery
            media={current.media}
            code={current.code}
            latitude={current.latitude}
            longitude={current.longitude}
          />
        </div>
        <LinkPulse tall />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <SidePanelHeader
            side={prior}
            roleLabel="Báo cáo đã đóng"
            roleTone="prior"
            fromPath={fromPath}
          />
          <FeaturedEvidenceGallery
            media={prior.media}
            code={prior.code}
            latitude={prior.latitude}
            longitude={prior.longitude}
            showTypeBadge
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent side="top">Khoảng cách GPS giữa hai vị trí báo cáo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
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

      <section className="min-w-0 w-full space-y-2.5" aria-label="Bản đồ vị trí hai báo cáo">
        <div className="flex min-w-0 items-center gap-2 px-0.5">
          <MapPinned className="size-4 shrink-0 text-slate-500" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-800">Vị trí trên bản đồ</h3>
          <span className="min-w-0 truncate text-xs text-slate-500">
            · cách nhau ~{formatMeters(distanceMeters)}
          </span>
        </div>
        <CompareReportsMap
          className="min-w-0 w-full"
          legend={{ suspect: 'Nghi tái diễn', original: 'Báo cáo đã đóng' }}
          pins={[
            {
              latitude: current.latitude,
              longitude: current.longitude,
              label: current.code,
              tone: 'suspect',
            },
            {
              latitude: prior.latitude,
              longitude: prior.longitude,
              label: prior.code,
              tone: 'original',
            },
          ]}
        />
      </section>
    </motion.div>
  );
}

export function RecurrenceCandidateDetailClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const reportId = typeof params.id === 'string' ? params.id : '';
  const fromPath = reportId ? `${RECURRENCE_LIST_PATH}/${reportId}` : RECURRENCE_LIST_PATH;
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false);

  const { data, isPending, isError, isFetching, refetch } =
    useViolationRecurrenceComparison(reportId);

  return (
    <div className="flex flex-1 flex-col px-4 pb-8 sm:px-6 lg:px-8 xl:px-10">
      <header className="mb-4 space-y-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-slate-600"
            onClick={() =>
              goBackWithListSoftReload({
                router,
                queryClient,
                from: null,
                fallbackHref: reportId
                  ? `${RECURRENCE_LIST_PATH}?${new URLSearchParams({ highlight: reportId }).toString()}`
                  : RECURRENCE_LIST_PATH,
              })
            }
          >
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại danh sách
          </Button>
          {isFetching && !isPending ? (
            <Skeleton className="size-4 rounded-full" aria-label="Đang cập nhật" />
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Chi tiết báo cáo tái diễn
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Đối chiếu báo cáo hiện tại với báo cáo đã đóng để quyết định mở thanh tra hoặc bác bỏ
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5 bg-sky-700 text-white hover:bg-sky-600"
            disabled={!reportId || isPending || isError || !data}
            onClick={() => setCreateInspectionOpen(true)}
          >
            <FileText className="size-4" aria-hidden />
            Tạo hồ sơ thanh tra
          </Button>
        </div>
      </header>

      {isPending ? (
        <CompareDetailSkeleton />
      ) : isError || !data ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-destructive">Không tải được chi tiết so sánh tái diễn.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-medium text-sky-700 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <RecurrenceCompareBody comparison={data} fromPath={fromPath} />
      )}

      {reportId ? (
        <CreateInspectionReportDialog
          open={createInspectionOpen}
          onOpenChange={setCreateInspectionOpen}
          reportId={reportId}
        />
      ) : null}
    </div>
  );
}
