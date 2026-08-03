'use client';

import { useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, ImageIcon, Loader2, MapPinned, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import {
  detectionSourceLabel,
  formatSimilarity,
  isAiDetectionSource,
} from '@/components/officer/duplicates/DuplicateCandidateCompareDialog';
import {
  useReportImagePreview,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { AnimatedHoverTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { useDuplicateCandidateDetail } from '@/hooks/useOfficer';
import type {
  DuplicateCandidateDetail,
  DuplicateCandidateDetailMedia,
  DuplicateCandidateDetailSide,
} from '@/lib/api/models/duplicateCandidateDetail';
import {
  REPORT_SEVERITY_BADGE_CLASSES,
  REPORT_SEVERITY_LABEL_VI,
} from '@/lib/constants/reportActions';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';

const DUPLICATES_LIST_PATH = '/officer/duplicates';

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

function formatCoords(lat: number, lng: number): string {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return '—';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatHoursSince(hours: number): string {
  if (hours < 24) return `${Math.round(hours)} giờ`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem > 0 ? `${days} ngày ${rem} giờ` : `${days} ngày`;
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

function toPreviewImages(
  media: DuplicateCandidateDetailMedia[],
  code: string
): ReportPreviewImage[] {
  return media
    .filter(m => m.url || m.thumbnailUrl)
    .map((m, i) => ({
      url: m.url || m.thumbnailUrl,
      label: `${code} · ảnh ${i + 1}`,
      uploadedAt: m.uploadedAt,
    }));
}

type CompareField = {
  key: string;
  label: string;
  render: (side: DuplicateCandidateDetailSide) => ReactNode;
  compareValue: (side: DuplicateCandidateDetailSide) => string;
  highlightDiff?: boolean;
};

const COMPARE_FIELDS: CompareField[] = [
  {
    key: 'status',
    label: 'Trạng thái',
    render: d => (
      <span
        className={cn(
          'inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium',
          REPORT_STATUS_BADGE_CLASSES[d.status]
        )}
      >
        {reportStatusLabelVi(d.status)}
      </span>
    ),
    compareValue: d => d.status,
  },
  {
    key: 'severity',
    label: 'Mức độ',
    render: d => (
      <span
        className={cn(
          'inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-medium',
          REPORT_SEVERITY_BADGE_CLASSES[d.severity]
        )}
      >
        {REPORT_SEVERITY_LABEL_VI[d.severity]}
      </span>
    ),
    compareValue: d => d.severity,
  },
  {
    key: 'category',
    label: 'Loại ô nhiễm',
    render: d => d.categoryName?.trim() || d.categoryCode || '—',
    compareValue: d => (d.categoryCode || d.categoryName || '').toLowerCase(),
  },
  {
    key: 'address',
    label: 'Địa chỉ',
    render: d => d.address?.trim() || '—',
    compareValue: d => (d.address?.trim() || '').toLowerCase(),
  },
  {
    key: 'coords',
    label: 'Tọa độ GPS',
    render: d => (
      <a
        href={googleMapsUrl(d.latitude, d.longitude)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sky-700 underline-offset-2 hover:underline"
      >
        {formatCoords(d.latitude, d.longitude)}
        <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
      </a>
    ),
    compareValue: d => formatCoords(d.latitude, d.longitude),
  },
  {
    key: 'description',
    label: 'Mô tả',
    render: d => (
      <span className="whitespace-pre-wrap break-words">{d.description?.trim() || '—'}</span>
    ),
    compareValue: d => (d.description?.trim() || '').toLowerCase(),
  },
  {
    key: 'createdAt',
    label: 'Thời điểm tạo',
    render: d => formatShortDate(d.createdAt),
    compareValue: d => d.createdAt || '',
    highlightDiff: false,
  },
];

function MediaStrip({
  media,
  code,
  onPreview,
}: {
  media: DuplicateCandidateDetailMedia[];
  code: string;
  onPreview: ReportPreviewHandler;
}) {
  const images = toPreviewImages(media, code);
  if (!images.length) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
        <ImageIcon className="size-8" aria-hidden />
      </div>
    );
  }

  const hero = images[0]!;
  const rest = images.slice(1, 5);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80"
        onClick={() => onPreview(hero)}
        aria-label={`Xem ảnh ${code}`}
      >
        <Image
          src={hero.url}
          alt={hero.label}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 40vw"
          unoptimized
        />
      </button>
      {rest.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {rest.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              className="relative aspect-square overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/80"
              onClick={() => onPreview(img)}
              aria-label={img.label}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidePanelHeader({
  side,
  roleLabel,
  roleTone,
  fromPath,
}: {
  side: DuplicateCandidateDetailSide;
  roleLabel: string;
  roleTone: 'suspect' | 'primary';
  fromPath: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <span
        className={cn(
          'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
          roleTone === 'suspect' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
        )}
      >
        {roleLabel}
      </span>
      <Link
        href={trackingDetailHref(side.id, fromPath)}
        className="block min-w-0 truncate text-lg font-bold tabular-nums text-slate-900 hover:text-sky-700 hover:underline"
      >
        {side.code}
      </Link>
      <p className="truncate text-xs text-slate-500" title={side.id}>
        {side.id}
      </p>
    </div>
  );
}

function InsightChips({ detail }: { detail: DuplicateCandidateDetail }) {
  const similarity = formatSimilarity(detail.aiSimilarityScore);
  const isAi = isAiDetectionSource(detail.duplicateDetectionSource);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatedHoverTooltip name="Khoảng cách GPS giữa hai vị trí báo cáo">
        <span
          className={cn(
            'inline-flex cursor-help items-center rounded-lg px-3 py-1 text-xs font-semibold',
            detail.distanceMeters <= 200
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
              : detail.distanceMeters <= 1000
                ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
                : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80'
          )}
        >
          Cách nhau ~{formatMeters(detail.distanceMeters)}
        </span>
      </AnimatedHoverTooltip>

      <AnimatedHoverTooltip name="Thời gian kể từ khi báo cáo gốc được tạo">
        <span className="inline-flex cursor-help items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
          Cách gốc {formatHoursSince(detail.hoursSincePrimaryCreated)}
        </span>
      </AnimatedHoverTooltip>

      {similarity ? (
        <AnimatedHoverTooltip
          name="Điểm tương đồng AI"
          designation="Chỉ gợi ý — cán bộ quyết định cuối"
        >
          <span className="inline-flex cursor-help items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 ring-1 ring-violet-200/80">
            AI {similarity}
          </span>
        </AnimatedHoverTooltip>
      ) : null}

      <AnimatedHoverTooltip
        name="Nguồn phát hiện trùng lặp"
        designation={detail.duplicateDetectionSource ?? undefined}
      >
        <span
          className={cn(
            'inline-flex cursor-help items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
            isAi
              ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
              : 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
          )}
        >
          {isAi ? (
            <Sparkles className="size-3 shrink-0" aria-hidden />
          ) : (
            <MapPinned className="size-3 shrink-0" aria-hidden />
          )}
          {detectionSourceLabel(detail.duplicateDetectionSource)}
        </span>
      </AnimatedHoverTooltip>
    </div>
  );
}

function CompareMatrix({
  left,
  right,
}: {
  left: DuplicateCandidateDetailSide;
  right: DuplicateCandidateDetailSide | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {COMPARE_FIELDS.map(field => {
        const shouldHighlight = field.highlightDiff !== false && right != null;
        const differs = shouldHighlight && field.compareValue(left) !== field.compareValue(right);
        return (
          <div
            key={field.key}
            className={cn(
              'grid grid-cols-1 border-b border-slate-100 last:border-b-0 md:grid-cols-[8rem_1fr_1fr]',
              differs && 'bg-amber-50/40'
            )}
          >
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase md:border-r md:border-b-0">
              {field.label}
            </div>
            <div
              className={cn(
                'min-w-0 px-3 py-2.5 text-sm text-slate-800 md:border-r md:border-slate-100',
                differs && 'font-medium'
              )}
            >
              {field.render(left)}
            </div>
            <div
              className={cn('min-w-0 px-3 py-2.5 text-sm text-slate-800', differs && 'font-medium')}
            >
              {right ? field.render(right) : <span className="text-slate-400">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailBody({
  detail,
  fromPath,
  onPreview,
}: {
  detail: DuplicateCandidateDetail;
  fromPath: string;
  onPreview: ReportPreviewHandler;
}) {
  const { report, primaryReport } = detail;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex min-h-0 flex-1 flex-col gap-5"
    >
      <InsightChips detail={detail} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="min-w-0 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/20 p-3 sm:p-4">
          <SidePanelHeader
            side={report}
            roleLabel="Nghi trùng"
            roleTone="suspect"
            fromPath={fromPath}
          />
          <MediaStrip media={report.media} code={report.code} onPreview={onPreview} />
        </section>

        <section className="min-w-0 space-y-3 rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-3 sm:p-4">
          {primaryReport ? (
            <>
              <SidePanelHeader
                side={primaryReport}
                roleLabel="Báo cáo gốc"
                roleTone="primary"
                fromPath={fromPath}
              />
              <MediaStrip
                media={primaryReport.media}
                code={primaryReport.code}
                onPreview={onPreview}
              />
            </>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
              <ImageIcon className="size-8 opacity-40" aria-hidden />
              <p>Chưa gắn được báo cáo gốc</p>
            </div>
          )}
        </section>
      </div>

      <div>
        <div className="mb-2 hidden grid-cols-[8rem_1fr_1fr] gap-0 md:grid">
          <div />
          <p className="px-3 text-xs font-semibold text-amber-800">Nghi trùng · {report.code}</p>
          <p className="px-3 text-xs font-semibold text-emerald-800">
            Gốc · {primaryReport?.code ?? '—'}
          </p>
        </div>
        <CompareMatrix left={report} right={primaryReport} />
      </div>
    </motion.div>
  );
}

export function DuplicateCandidateDetailClient() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = typeof params.id === 'string' ? params.id : '';
  const fromPath = reportId ? `${DUPLICATES_LIST_PATH}/${reportId}` : DUPLICATES_LIST_PATH;

  const { data, isPending, isError, isFetching, refetch } = useDuplicateCandidateDetail(reportId);

  const allPreviewImages = useMemo(() => {
    if (!data) return [];
    return [
      ...toPreviewImages(data.report.media, data.report.code),
      ...(data.primaryReport
        ? toPreviewImages(data.primaryReport.media, data.primaryReport.code)
        : []),
    ];
  }, [data]);

  const { openPreview, previewDialog } = useReportImagePreview(allPreviewImages);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-4 shrink-0 space-y-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 px-2 text-slate-600"
            onClick={() => router.push(DUPLICATES_LIST_PATH)}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại danh sách
          </Button>
          {isFetching && !isPending ? (
            <Loader2 className="size-4 animate-spin text-slate-400" aria-label="Đang cập nhật" />
          ) : null}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Chi tiết nghi trùng lặp
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đối chiếu báo cáo hiện tại với báo cáo gốc để quyết định gộp hoặc bác bỏ
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {isPending ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-slate-400" />
          </div>
        ) : isError || !data ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-destructive">Không tải được chi tiết so sánh trùng lặp.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <DetailBody detail={data} fromPath={fromPath} onPreview={openPreview} />
        )}
      </div>

      {previewDialog}
    </div>
  );
}
