'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  ImageIcon,
  Loader2,
  MapPin,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react';

import {
  useReportImagePreview,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { TYPE_LABEL as TEAM_TYPE_LABEL_VI } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportProgress } from '@/hooks/useReport';
import {
  useApproveReopenRequest,
  useRejectReopenRequest,
  useReportDetail,
  officerKeys,
} from '@/hooks/useOfficer';
import { useQueryClient } from '@tanstack/react-query';
import type {
  ReportAssignment,
  ReportDetail,
  ReportMedia,
  ReportPendingReopenRequest,
  ReportReopenHistoryItem,
} from '@/lib/api/models/report';
import type { ReportProgressImage } from '@/lib/api/models/reportProgress';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { getTeamTypeClasses, getTeamTypeLabel } from '@/lib/constants/adminTeams';
import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { navigateAfterOverlayClose } from '@/lib/utils/radixUi';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** MapLibre + Goong Maptiles — cùng stack /officer/map & ReportLocationMap. */
const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

const BADGE_BASE =
  'inline-flex max-w-full min-w-0 items-center truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none';

const TAB_TRIGGER_CLASS = cn(
  'relative h-auto rounded-none border-0 bg-transparent px-0 pb-2.5 pt-0 text-sm font-medium text-muted-foreground shadow-none',
  'data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:bg-brand after:transition-transform',
  'data-[state=active]:after:scale-x-100'
);

function formatDateTime(iso: string | null | undefined): string {
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

function hasReportCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

/** Section cuối tab — preview MapLibre/Goong + link Google Maps (pattern tracking detail). */
function ViewOnMapSection({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address?: string | null;
}) {
  if (!hasReportCoords(latitude, longitude)) {
    return (
      <section className="space-y-3">
        <p className="text-md font-semibold">Xem trên bản đồ</p>
        <p className="text-sm text-muted-foreground">Báo cáo chưa có tọa độ GPS hợp lệ.</p>
      </section>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <section className="space-y-3">
      <p className="text-md font-semibold">Xem trên bản đồ</p>
      <div className="overflow-hidden rounded-xl bg-muted/40">
        <ReportLocationMap
          latitude={latitude}
          longitude={longitude}
          className="h-44 w-full sm:h-52 md:h-60"
        />
      </div>
      {address ? (
        <p className="flex items-start gap-1.5 text-sm leading-snug text-foreground/85">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{address}</span>
        </p>
      ) : null}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand tabular-nums hover:underline"
      >
        <ExternalLink className="size-3" aria-hidden />
        Mở Google Maps · {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </a>
    </section>
  );
}

/**
 * Ảnh hiển thị được — BE dùng MediaType: Image | ReopenEvidence | Before | After | …
 * (không chỉ chuỗi chứa "image").
 */
function isImageMedia(media: ReportMedia): boolean {
  const type = media.mediaType.trim().toLowerCase();
  const mime = media.mimeType?.trim().toLowerCase() ?? '';

  if (mime.startsWith('video/') || type === 'video') return false;
  if (mime.startsWith('image/')) return true;
  if (!media.url?.trim()) return false;

  return (
    type.includes('image') ||
    type === 'reopenevidence' ||
    type === 'before' ||
    type === 'after' ||
    type === 'progress' ||
    type === 'inspection'
  );
}

/** Progress API images → shape dùng chung gallery. */
function progressImagesToMedia(images: ReportProgressImage[]): ReportMedia[] {
  return images.map(img => ({
    id: img.id,
    mediaType: String(img.mediaType || 'Image'),
    url: img.url,
    mimeType: img.mimeType,
    sizeBytes: img.sizeBytes,
  }));
}

/**
 * Gallery — khung cố định tỉ lệ ngang điện thoại (4:3).
 * Ảnh ngang: fill khung; ảnh dọc: object-contain + blur 2 bên → luôn thấy whole image.
 * Section nhỏ hơn ~3 bậc so với full-bleed trước đó.
 */
const CAROUSEL_EASE = [0.22, 1, 0.36, 1] as const;
const CAROUSEL_DURATION = 0.42;

function FeaturedEvidenceGallery({
  items,
  emptyLabel = 'Không có ảnh minh chứng',
  latitude,
  longitude,
}: {
  items: ReportMedia[];
  emptyLabel?: string;
  latitude?: number;
  longitude?: number;
}) {
  const images = items.filter(isImageMedia);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const previewImages: ReportPreviewImage[] = useMemo(
    () =>
      images.map((img, i) => ({
        url: img.url,
        label: `Minh chứng ${i + 1}`,
      })),
    [images]
  );

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

  const { setPreviewIndex, previewDialog } = useReportImagePreview(previewImages, {
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
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-slate-900/90">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={featured.id || featured.url}
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
            <Image
              src={featured.url}
              alt=""
              fill
              unoptimized
              aria-hidden
              className="scale-125 object-cover opacity-45 blur-2xl"
              sizes="(max-width: 672px) 100vw, 672px"
            />
            <div className="pointer-events-none absolute inset-0 bg-slate-900/25" aria-hidden />
            <button
              type="button"
              onClick={openLightbox}
              className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/50"
              aria-label={`Phóng to ảnh minh chứng ${safeIndex + 1}`}
            >
              <Image
                src={featured.url}
                alt={`Minh chứng ${safeIndex + 1}`}
                fill
                unoptimized
                priority
                className="object-contain"
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </button>
          </motion.div>
        </AnimatePresence>

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
              <li key={img.id || `${img.url}-${index}`} className="shrink-0 p-0.5">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Chọn ảnh minh chứng ${index + 1}`}
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

function AssignmentsSummary({ assignments }: { assignments: ReportAssignment[] }) {
  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có phân công.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {assignments.map(a => {
        const percent = Math.max(0, Math.min(100, Math.round(a.progressPercent)));
        const statusLabel = ASSIGNMENT_STATUS_LABEL[a.status] ?? a.status;
        const teamTypeLabel = TEAM_TYPE_LABEL_VI[a.teamType] ?? getTeamTypeLabel(a.teamType);
        const completedLabel = a.completedAt ? formatDateTime(a.completedAt) : null;

        return (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5 sm:gap-3.5"
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white sm:size-11',
                assignmentAvatarColor(a.teamId || a.teamName)
              )}
              aria-hidden
            >
              {getTeamInitials(a.teamName)}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-1.5">
                <p className="truncate text-sm font-semibold leading-5 text-foreground">
                  {a.teamName}
                </p>
                {teamTypeLabel ? (
                  <span
                    className={cn(
                      '-mt-0.5 inline-flex shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4',
                      getTeamTypeClasses(a.teamType)
                    )}
                  >
                    {teamTypeLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{statusLabel}</span>
                {completedLabel ? (
                  <>
                    {' '}
                    lúc <span className="tabular-nums">{completedLabel}</span>
                  </>
                ) : null}
              </p>

              {/* Progress dưới tên trên mobile */}
              <div className="mt-2 sm:hidden">
                <AssignmentRowProgress percent={percent} />
              </div>
            </div>

            <div className="hidden min-w-0 shrink-0 sm:block sm:w-36 md:w-40">
              <AssignmentRowProgress percent={percent} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const ASSIGNMENT_AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
] as const;

function assignmentAvatarColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
  return ASSIGNMENT_AVATAR_COLORS[Math.abs(h) % ASSIGNMENT_AVATAR_COLORS.length]!;
}

function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

function AssignmentRowProgress({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex min-w-0 items-center gap-2" aria-label={`Tiến độ ${clamped}%`}>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground sm:text-sm">
        {clamped}%
      </span>
    </div>
  );
}

/** Ảnh after do team cập nhật — lightbox, không dùng gallery featured. */
function AfterCleanupGallery({
  items,
  latitude,
  longitude,
}: {
  items: ReportMedia[];
  latitude?: number;
  longitude?: number;
}) {
  const images = items.filter(isImageMedia);
  const previewImages: ReportPreviewImage[] = useMemo(
    () =>
      images.map((img, i) => ({
        url: img.url,
        label: `Sau xử lý ${i + 1}`,
      })),
    [images]
  );

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

  const { setPreviewIndex, previewDialog } = useReportImagePreview(previewImages, {
    mapLocation,
  });

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Team chưa cập nhật ảnh sau xử lý.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img, index) => (
          <li key={img.id || `${img.url}-${index}`}>
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className="relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden rounded-lg bg-muted ring-1 ring-border transition hover:ring-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              aria-label={`Phóng to ảnh sau xử lý ${index + 1}`}
            >
              <Image
                src={img.url}
                alt={`Ảnh sau xử lý ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 200px"
              />
            </button>
          </li>
        ))}
      </ul>
      {previewDialog}
    </>
  );
}

/** Action panel — cùng pattern ActionCard / SlaActionCard (VerifyDetailClient). */
function ReopenActionCard({
  hasPending,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  detail: ReportDetail;
  hasPending: boolean;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const busy = isApproving || isRejecting;

  return (
    <Card className="overflow-hidden p-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="size-4" aria-hidden />
          Quyết định
        </CardTitle>
        <CardDescription>Duyệt để mở lại hoặc từ chối yêu cầu không hợp lý.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center px-4 pb-8 pt-5 text-center">
        <div className="flex size-11 items-center justify-center rounded-full border border-amber-200 bg-white shadow-sm">
          <ClipboardList className="size-6 text-amber-700" aria-hidden />
        </div>
        <p className="mt-3 text-lg font-semibold text-foreground">
          {hasPending ? 'Chờ duyệt mở lại' : 'Không còn yêu cầu'}
        </p>
      </CardContent>

      {hasPending ? (
        <CardFooter className="hidden lg:flex">
          <div className="flex w-full flex-col gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={onApprove}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isApproving ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
              Xác nhận
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onReject}
              className="w-full border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
            >
              {isRejecting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
              Từ chối
            </Button>
          </div>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function RejectReopenDialog({
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
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto p-0 sm:w-full">
        <DialogHeader className="space-y-2 border-b border-border bg-linear-to-b from-red-50/60 to-transparent px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6 dark:from-red-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
              <XCircle className="size-4" aria-hidden />
            </span>
            Từ chối yêu cầu mở lại
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Vui lòng nhập lý do từ chối tối thiểu 20 ký tự. Báo cáo giữ nguyên trạng thái hiện tại;
            người gửi có thể xem lý do từ chối.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-6 py-5">
          <Label
            htmlFor="reject-reopen-reason"
            className="text-xs font-medium uppercase text-muted-foreground"
          >
            Lý do từ chối
          </Label>
          <textarea
            id="reject-reopen-reason"
            value={reason}
            onChange={event => onReasonChange(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Nêu rõ vì sao yêu cầu mở lại chưa đủ cơ sở để duyệt."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-red-300 focus:ring-1 focus:ring-red-100"
          />
          <p
            className={cn(
              'text-right text-xs',
              isReasonValid ? 'text-muted-foreground' : 'font-medium text-red-600'
            )}
          >
            {reasonLength}/20 ký tự tối thiểu · tối đa 600
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

function ApproveReopenDialog({
  open,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && !isSubmitting && onCancel()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto p-0 sm:w-full">
        <DialogHeader className="space-y-3 bg-linear-to-b from-emerald-50/70 to-transparent px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6 dark:from-emerald-500/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="size-4" aria-hidden />
            </span>
            Xác nhận mở lại báo cáo
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <p>
                Báo cáo sẽ chuyển từ trạng thái{' '}
                <span className="font-medium text-foreground">Đã giải quyết</span>
                {' → '}
                <span className="font-medium text-foreground">Đã mở lại</span>.
              </p>
              <p>
                Sau khi duyệt, bạn sẽ được chuyển sang màn{' '}
                <span className="font-medium text-foreground">Phân công</span> để điều phối đội xử
                lý tiếp.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {isSubmitting ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
            {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BackControl({ onBack }: { onBack?: () => void }) {
  const content = (
    <>
      <ArrowLeft className="size-3.5" />
      {onBack ? 'Quay lại' : 'Quay lại danh sách'}
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
      <Link href="/officer/reopen">{content}</Link>
    </Button>
  );
}

function reopenStatusBadge(status: string): { label: string; className: string } {
  const key = status.trim().toLowerCase();
  if (key === 'pending') {
    return {
      label: 'Chờ duyệt',
      className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
    };
  }
  if (key === 'approved') {
    return {
      label: 'Đã duyệt',
      className: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
    };
  }
  if (key === 'rejected') {
    return {
      label: 'Đã từ chối',
      className: 'bg-red-50 text-red-800 ring-1 ring-red-200/80',
    };
  }
  return {
    label: status || '—',
    className: 'bg-muted text-muted-foreground ring-1 ring-border',
  };
}

/**
 * Ưu tiên item Pending trong `reopenHistory` (đủ field + ảnh).
 * Fallback: khớp `pendingReopenRequest`, hoặc synthesize từ pending.
 */
function resolveActiveReopenRequest(
  history: ReportReopenHistoryItem[],
  pending: ReportPendingReopenRequest | null
): ReportReopenHistoryItem | null {
  const pendingFromHistory = history.find(item => item.status.trim().toLowerCase() === 'pending');
  if (pendingFromHistory) return pendingFromHistory;

  if (pending) {
    const matched = history.find(item => item.requestId === pending.requestId);
    if (matched) return matched;
    return {
      requestId: pending.requestId,
      reason: pending.reason,
      status: 'Pending',
      requestedAt: pending.requestedAt,
      requestedById: '',
      requestedByName: null,
      reviewedAt: null,
      reviewedById: null,
      reviewedByName: null,
      rejectionReason: null,
      evidenceMedia: pending.evidenceMedia,
    };
  }

  return history[0] ?? null;
}

function ReopenRequestTab({
  history,
  pending,
  categoryName,
  address,
  latitude,
  longitude,
  onBack,
}: {
  history: ReportReopenHistoryItem[];
  pending: ReportPendingReopenRequest | null;
  categoryName: string;
  address: string;
  latitude: number;
  longitude: number;
  onBack?: () => void;
}) {
  const active = resolveActiveReopenRequest(history, pending);
  const pastItems = active ? history.filter(item => item.requestId !== active.requestId) : history;

  if (!active && history.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>Không còn yêu cầu mở lại đang chờ</span>
          {onBack ? (
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              Về danh sách
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/officer/reopen">Về danh sách</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!active) return null;

  const statusBadge = reopenStatusBadge(active.status);

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">
      <section>
        <FeaturedEvidenceGallery
          items={active.evidenceMedia}
          latitude={latitude}
          longitude={longitude}
        />
      </section>

      <section className="space-y-0">
        {/* Title: mobile stack badge; sm+ badge overlay phải */}
        <div className="flex flex-col gap-2 sm:relative sm:flex-row sm:items-start sm:gap-3 sm:pr-28">
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-lg font-semibold leading-snug text-foreground sm:text-xl md:text-2xl">
              <span>{categoryName || '—'}</span>
              <span className="text-sm font-normal text-muted-foreground sm:text-base md:text-lg">
                được báo cáo bởi{' '}
                <span className="font-medium text-foreground">
                  {active.requestedByName || 'Công dân'}
                </span>
              </span>
            </h2>
          </div>
          <span
            className={cn(
              BADGE_BASE,
              'self-start shrink-0 px-2 py-1 text-[11px] sm:absolute sm:right-0 sm:top-0',
              statusBadge.className
            )}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Address + thời gian gửi */}
        <div className="mt-1.5 flex gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {address || '—'}
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/80">
              {formatDateTime(active.requestedAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-md font-semibold">Lý do mở lại</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-[15px] sm:leading-7">
            {active.reason || '—'}
          </p>
        </div>

        {active.rejectionReason ? (
          <div className="mt-6 space-y-2 rounded-lg bg-red-50/80 px-3 py-3 dark:bg-red-500/10">
            <p className="text-xs font-medium uppercase tracking-wide text-red-700">
              Lý do từ chối
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-900 dark:text-red-100">
              {active.rejectionReason}
            </p>
          </div>
        ) : null}
      </section>

      {/* 3) Lịch sử các lần yêu cầu khác (nếu có) */}
      {pastItems.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Lịch sử yêu cầu mở lại ({pastItems.length})
          </h3>
          <ul className="space-y-3">
            {pastItems.map(item => {
              const badge = reopenStatusBadge(item.status);
              const thumb = item.evidenceMedia.find(isImageMedia);
              return (
                <li key={item.requestId} className="flex gap-3 rounded-xl bg-muted/30 px-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {thumb ? (
                      <Image
                        src={thumb.url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="size-4 opacity-40" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(BADGE_BASE, badge.className)}>{badge.label}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDateTime(item.requestedAt)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-foreground">{item.reason || '—'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.requestedByName || 'Công dân'}
                      {item.reviewedByName ? ` · Duyệt bởi ${item.reviewedByName}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <ViewOnMapSection latitude={latitude} longitude={longitude} address={address} />
    </div>
  );
}

function ResolvedReportTab({ detail }: { detail: ReportDetail }) {
  const statusLabel = reportStatusLabelVi(detail.status);
  const statusBadgeClass =
    REPORT_STATUS_BADGE_CLASSES[detail.status as keyof typeof REPORT_STATUS_BADGE_CLASSES] ??
    'bg-muted text-muted-foreground';

  /**
   * `detail.media` từ GET /reports/{id} có thể lẫn minh chứng reopen.
   * Ảnh báo cáo gốc lấy từ progress.media.submissionImages.
   * Ảnh after do team cập nhật — gom với section phân công.
   */
  const { data: progress, isPending: isProgressPending } = useReportProgress(detail.id);
  const originalReportMedia = progressImagesToMedia(progress?.media.submissionImages ?? []);
  const afterCleanupMedia = progressImagesToMedia(progress?.media.afterImages ?? []);

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">
      <section>
        {isProgressPending ? (
          <div className="aspect-4/3 w-full animate-pulse rounded-lg bg-muted/40" />
        ) : (
          <FeaturedEvidenceGallery
            items={originalReportMedia}
            emptyLabel="Không có ảnh báo cáo gốc"
            latitude={detail.latitude}
            longitude={detail.longitude}
          />
        )}
      </section>

      <section className="space-y-0">
        <div className="flex flex-col gap-2 sm:relative sm:flex-row sm:items-start sm:gap-3 sm:pr-28">
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-lg font-semibold leading-snug text-foreground sm:text-xl md:text-2xl">
              <span>{detail.categoryName || '—'}</span>
              <span className="text-sm font-normal text-muted-foreground sm:text-base md:text-lg">
                được báo cáo bởi{' '}
                <span className="font-medium text-foreground">
                  {detail.reporterName || 'Công dân'}
                </span>
              </span>
            </h2>
          </div>
          <span
            className={cn(
              BADGE_BASE,
              'self-start shrink-0 px-2 py-1 text-[11px] sm:absolute sm:right-0 sm:top-0',
              statusBadgeClass
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-1.5 flex gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {detail.address || '—'}
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/80">
              {formatDateTime(detail.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-md font-semibold">Mô tả</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-[15px] sm:leading-7">
            {detail.description || '—'}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="size-4 text-muted-foreground" aria-hidden />
          Phân công lần trước
        </h3>
        <AssignmentsSummary assignments={detail.assignments} />

        <div className="space-y-2 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ImageIcon className="size-3.5" aria-hidden />
            Ảnh sau xử lý
          </p>
          <p className="text-xs text-muted-foreground">Do team cập nhật khi hoàn thành xử lý.</p>
          {isProgressPending ? (
            <div className="h-24 animate-pulse rounded-lg bg-muted/40" />
          ) : (
            <AfterCleanupGallery
              items={afterCleanupMedia}
              latitude={detail.latitude}
              longitude={detail.longitude}
            />
          )}
        </div>
      </section>

      <ViewOnMapSection
        latitude={detail.latitude}
        longitude={detail.longitude}
        address={detail.address}
      />
    </div>
  );
}

type ReopenDetailClientProps = {
  id: string;
  onBack?: () => void;
};

/** Chi tiết yêu cầu mở lại báo cáo [LEO] — duyệt / từ chối pending reopen. */
export function ReopenDetailClient({ id, onBack }: ReopenDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: detail, isLoading, isError } = useReportDetail(id);
  const approveMutation = useApproveReopenRequest();
  const rejectMutation = useRejectReopenRequest();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 pb-8 lg:px-10">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        <div className="mx-auto w-full max-w-5xl xl:max-w-6xl">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="aspect-4/3 animate-pulse rounded-lg bg-muted" />
              <div className="h-40 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4 px-6 pb-8 lg:px-10">
        <BackControl onBack={onBack} />
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Không thể tải chi tiết báo cáo. Vui lòng thử lại.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const pending =
    detail.hasPendingReopenRequest && detail.pendingReopenRequest
      ? detail.pendingReopenRequest
      : null;

  const handleApprove = async () => {
    if (!pending) return;
    try {
      const result = await approveMutation.mutateAsync({
        reportId: id,
        requestId: pending.requestId,
      });
      toastApiSuccess(result, 'Đã xác nhận mở lại báo cáo.');
      setApproveOpen(false);
      // Đảm bảo queue Phân công (Verified/Rejected/Reopened) refetch trước khi highlight.
      await queryClient.invalidateQueries({ queryKey: officerKeys.queue() });
      navigateAfterOverlayClose(() => {
        router.push(`/officer/assign?${new URLSearchParams({ highlightReportId: id }).toString()}`);
      });
    } catch (error) {
      toastApiError(error, 'Không thể xác nhận yêu cầu mở lại.');
    }
  };

  const handleReject = async () => {
    if (!pending) return;
    const reason = rejectReason.trim();
    if (reason.length < 20) return;

    try {
      const result = await rejectMutation.mutateAsync({
        reportId: id,
        requestId: pending.requestId,
        body: { reason },
      });
      toastApiSuccess(result, 'Đã từ chối yêu cầu mở lại.');
      setRejectOpen(false);
      setRejectReason('');
      if (onBack) {
        onBack();
      } else {
        navigateAfterOverlayClose(() => {
          router.push('/officer/reopen');
        });
      }
    } catch (error) {
      toastApiError(error, 'Không thể từ chối yêu cầu mở lại.');
    }
  };

  return (
    <div className="relative space-y-6 pb-28 sm:pb-10 lg:pb-8">
      <Tabs defaultValue="request" className="w-full min-w-0 space-y-6">
        {/* Header + tabs — layout cũ full-bleed */}
        <div className="space-y-6 px-6 lg:px-10">
          <BackControl onBack={onBack} />

          <div className="min-w-0 space-y-1.5">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              <RotateCcw className="size-5 shrink-0 text-emerald-600" aria-hidden />
              Yêu cầu mở lại
              <span className="font-mono text-base font-medium text-muted-foreground">
                #{detail.code}
              </span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Đối chiếu minh chứng yêu cầu mở lại với báo cáo đã giải quyết, rồi xác nhận hoặc từ
              chối.
            </p>
          </div>

          <TabsList className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="request" className={TAB_TRIGGER_CLASS}>
              Yêu cầu mở lại
            </TabsTrigger>
            <TabsTrigger value="resolved" className={TAB_TRIGGER_CLASS}>
              Báo cáo đã giải quyết
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Nội dung ảnh + card — căn giữa, sát cạnh */}
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-4 xl:max-w-6xl">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="order-2 min-w-0 lg:order-1">
              <TabsContent value="request" className="mt-0 focus-visible:ring-0">
                <ReopenRequestTab
                  history={detail.reopenHistory}
                  pending={pending}
                  categoryName={detail.categoryName}
                  address={detail.address}
                  latitude={detail.latitude}
                  longitude={detail.longitude}
                  onBack={onBack}
                />
              </TabsContent>

              <TabsContent value="resolved" className="mt-0 focus-visible:ring-0">
                <ResolvedReportTab detail={detail} />
              </TabsContent>
            </div>

            <div className="order-1 flex flex-col gap-4 lg:sticky lg:top-19 lg:order-2 lg:self-start">
              <ReopenActionCard
                detail={detail}
                hasPending={Boolean(pending)}
                onApprove={() => setApproveOpen(true)}
                onReject={() => setRejectOpen(true)}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            </div>
          </div>
        </div>
      </Tabs>

      {/* Mobile sticky CTA — tránh mất nút quyết định khi cuộn */}
      {pending ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => setRejectOpen(true)}
              className="min-h-11 flex-1 border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              ) : null}
              Từ chối
            </Button>
            <Button
              type="button"
              disabled={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => setApproveOpen(true)}
              className="min-h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {approveMutation.isPending ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              ) : null}
              Xác nhận
            </Button>
          </div>
        </div>
      ) : null}

      <ApproveReopenDialog
        open={approveOpen}
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => void handleApprove()}
        isSubmitting={approveMutation.isPending}
      />

      <RejectReopenDialog
        open={rejectOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onSubmit={() => void handleReject()}
        isSubmitting={rejectMutation.isPending}
      />
    </div>
  );
}
