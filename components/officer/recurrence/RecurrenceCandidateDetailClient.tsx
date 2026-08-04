'use client';

import { CreateInspectionReportDialog } from '@/components/officer/recurrence/CreateInspectionReportDialog';
import {
  useReportImagePreview,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { cn } from '@/lib/utils';
import { ArrowLeft, Check, Copy, FileText, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

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

function formatCoords(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function formatMeters(meters: number): string {
  const rounded = Math.round(meters);
  if (rounded < 1000) return `${rounded} m`;
  return `${Math.round(rounded / 1000)} km`;
}

/** Nhãn ngắn — chi tiết nằm trong tooltip. */
function formatDaysSinceClosedLabel(days: number): string {
  if (days <= 0) return 'Vừa đóng';
  if (days === 1) return 'Đóng trước 1 ngày';
  return `Đóng trước ${days} ngày`;
}

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function trackingDetailHref(reportId: string, fromPath: string): string {
  return `/officer/tracking?${new URLSearchParams({
    reportId,
    from: fromPath,
  }).toString()}`;
}

function toPreviewImages(media: ViolationRecurrenceMedia[], code: string): ReportPreviewImage[] {
  return media
    .filter(m => m.url || m.thumbnailUrl)
    .map((m, i) => ({
      url: m.url || m.thumbnailUrl,
      label: `${code} · ảnh ${i + 1}`,
      uploadedAt: m.uploadedAt,
    }));
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

/** Badge loại báo cáo + #code (text-sm) + copy — vị trí phía trên ảnh như trước. */
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
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span
        className={cn(
          'inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
          roleTone === 'suspect' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
        )}
      >
        {roleLabel}
      </span>
      <div className="group/copyrow flex min-w-0 items-center gap-1">
        <Link
          href={trackingDetailHref(side.id, fromPath)}
          title={side.code}
          className={cn(
            'min-w-0 truncate text-sm font-bold tabular-nums text-slate-900 no-underline',
            'hover:text-sky-700 hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
          )}
        >
          #{side.code}
        </Link>
        <CopyIconButton
          value={side.code}
          label={`Sao chép mã ${side.code}`}
          successMessage="Đã sao chép mã báo cáo."
        />
      </div>
    </div>
  );
}

/**
 * Section ảnh như layout detail trước đó —
 * ảnh lớn (hero) + stack ảnh phụ; nghi tái phát: hero bên phải.
 */
function MediaStrip({
  media,
  code,
  onPreview,
  heroSide,
}: {
  media: ViolationRecurrenceMedia[];
  code: string;
  onPreview: ReportPreviewHandler;
  /** Nghi tái phát: ảnh lớn bên phải · Đã đóng: ảnh lớn bên trái */
  heroSide: 'left' | 'right';
}) {
  const images = toPreviewImages(media, code);
  if (!images.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200/80 sm:h-56">
        <ImageIcon className="size-8" aria-hidden />
      </div>
    );
  }

  const hero = images[0]!;
  const rest = images.slice(1);

  const heroButton = (
    <button
      type="button"
      className={cn(
        'relative min-h-0 min-w-0 self-stretch overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80',
        rest.length > 0 ? 'flex-[1.75]' : 'w-full flex-1'
      )}
      onClick={() => onPreview(hero)}
      aria-label={`Xem ảnh ${code}`}
    >
      <Image
        src={hero.url}
        alt={hero.label}
        fill
        className="object-cover"
        sizes="(max-width:768px) 70vw, 30vw"
        unoptimized
        priority={false}
      />
    </button>
  );

  if (rest.length === 0) {
    return <div className="flex h-48 sm:h-56">{heroButton}</div>;
  }

  const stack = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 self-stretch">
      {rest.map((img, i) => (
        <button
          key={`${img.url}-${i}`}
          type="button"
          className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80"
          onClick={() => onPreview(img)}
          aria-label={img.label}
        >
          <Image src={img.url} alt="" fill className="object-cover" sizes="120px" unoptimized />
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-48 gap-1.5 sm:h-56">
      {heroSide === 'left' ? (
        <>
          {heroButton}
          {stack}
        </>
      ) : (
        <>
          {stack}
          {heroButton}
        </>
      )}
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

/** Field so sánh — khớp `DuplicateSuspectDialog` recurrence mode. */
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

/** Skeleton mirror layout so sánh — media 2 cột + hàng field. */
function CompareDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy aria-label="Đang tải">
      <div className="flex shrink-0 items-stretch gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-lg sm:h-56" />
        </div>
        <div
          className="mx-1 flex w-10 shrink-0 items-center justify-center sm:mx-2 sm:w-14"
          aria-hidden
        >
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-lg sm:h-56" />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
        <Skeleton className="h-7 w-28 rounded-lg" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      <div>
        {Array.from({ length: 6 }, (_, i) => (
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
    </div>
  );
}

/**
 * Body so sánh — MediaStrip + LinkPulse + bảng field (dialog style).
 * Badge + #code nằm trên ảnh như layout trước.
 */
function RecurrenceCompareBody({
  comparison,
  fromPath,
  onPreview,
}: {
  comparison: ViolationRecurrenceComparison;
  fromPath: string;
  onPreview: ReportPreviewHandler;
}) {
  const { currentReport: current, priorClosedReport: prior } = comparison;
  const { daysSincePriorClosed, distanceMeters } = comparison;

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
          <MediaStrip
            media={current.media}
            code={current.code}
            onPreview={onPreview}
            heroSide="right"
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
          <MediaStrip media={prior.media} code={prior.code} onPreview={onPreview} heroSide="left" />
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-3">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
                {formatDaysSinceClosedLabel(daysSincePriorClosed)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Số ngày kể từ khi báo cáo gốc đã đóng đến hiện tại
            </TooltipContent>
          </Tooltip>

          {prior.hadPriorInspection ? (
            <span
              title="Báo cáo Closed trước đã từng có hồ sơ thanh tra"
              className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200/80"
            >
              Đã từng thanh tra
            </span>
          ) : null}
        </div>
      </TooltipProvider>

      <div>
        {RECURRENCE_COMPARE_FIELDS.map(field => (
          <div key={field.key} className="grid grid-cols-2">
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

export function RecurrenceCandidateDetailClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = typeof params.id === 'string' ? params.id : '';
  const fromPath = reportId ? `${RECURRENCE_LIST_PATH}/${reportId}` : RECURRENCE_LIST_PATH;
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false);

  const { data, isPending, isError, isFetching, refetch } =
    useViolationRecurrenceComparison(reportId);

  const allPreviewImages = useMemo(() => {
    if (!data) return [];
    return [
      ...toPreviewImages(data.currentReport.media, data.currentReport.code),
      ...toPreviewImages(data.priorClosedReport.media, data.priorClosedReport.code),
    ];
  }, [data]);

  const { openPreview, previewDialog } = useReportImagePreview(allPreviewImages);

  return (
    <div className="flex flex-1 flex-col pb-8">
      <header className="mb-4 space-y-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-slate-600"
            onClick={() => router.push(RECURRENCE_LIST_PATH)}
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
        <RecurrenceCompareBody comparison={data} fromPath={fromPath} onPreview={openPreview} />
      )}

      {previewDialog}

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
