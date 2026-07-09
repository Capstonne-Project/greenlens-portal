'use client';

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
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ClickableReportImage,
  useReportImagePreview,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { useReportDetail, useVerifyReport } from '@/hooks/useOfficer';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { ReportDetail, ReportSeverity, ReportStatus } from '@/lib/api/services/fetchReport';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Hourglass,
  LayoutGrid,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

const SEVERITY_LABEL: Record<ReportSeverity, string> = {
  Critical: 'Nghiêm trọng',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};

const SEVERITY_SET_BY_LABEL: Record<string, string> = {
  User: 'Người dùng',
  AI: 'Hệ thống AI',
  Officer: 'Cán bộ',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  Submitted: 'Chờ xác minh',
  Verified: 'Đã xác minh',
  Dispatched: 'Chờ phân công',
  Assigned: 'Đã phân công',
  InProgress: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng',
  Rejected: 'Từ chối',
  Duplicate: 'Trùng lặp',
  PenaltyIssued: 'Đã xử phạt',
  ClosedNoViolation: 'Đóng — không vi phạm',
};

/** Badge mức độ — chỉ dùng ở chế độ xem, không áp dụng dropdown Select. */
const SEVERITY_CLASS: Record<ReportSeverity, string> = {
  Critical: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  High: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
};

const STATUS_CLASS: Record<ReportStatus, string> = {
  Submitted: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Verified: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Dispatched: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Assigned: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  InProgress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Resolved: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  Closed: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
  Rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Duplicate: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  PenaltyIssued: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
  ClosedNoViolation: 'bg-stone-100 text-stone-600 ring-1 ring-stone-200',
};

function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return (
    <Badge variant="outline" className={cn('border-0 font-semibold', SEVERITY_CLASS[severity])}>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <Badge variant="outline" className={cn('border-0 font-semibold', STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Sub-components ────────────────────────────────────────────────────────────

function HeaderStrip({
  detail,
  pendingCategoryName,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
}) {
  return (
    <CardTitle className="text-2xl font-bold tracking-tight">
      Khu vực {pendingCategoryName} tại {detail.address}
    </CardTitle>
  );
}

type GalleryImage = ReportDetail['media'][number];

const GALLERY_IMAGE_LABEL = 'Ảnh báo cáo';

function toPreviewImages(images: GalleryImage[]): ReportPreviewImage[] {
  return images.map(img => ({
    url: img.url,
    label: GALLERY_IMAGE_LABEL,
  }));
}

function GalleryImg({
  img,
  sizes,
  className = '',
  onPreview,
}: {
  img: GalleryImage;
  sizes: string;
  className?: string;
  onPreview: (image: ReportPreviewImage) => void;
}) {
  return (
    <ClickableReportImage
      url={img.url}
      label={GALLERY_IMAGE_LABEL}
      onPreview={onPreview}
      className={cn('relative overflow-hidden rounded-none', className)}
      sizes={sizes}
      showTimestamp={false}
      unoptimized
    />
  );
}

function GalleryModal({
  images,
  open,
  onOpenChange,
  onPreview,
}: {
  images: GalleryImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreview: (image: ReportPreviewImage) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tất cả ảnh ({images.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, i) => (
            <ClickableReportImage
              key={img.id}
              url={img.url}
              label={`Ảnh ${i + 1}`}
              onPreview={onPreview}
              className="aspect-[4/3] w-full rounded-lg"
              sizes="33vw"
              showTimestamp={false}
              unoptimized
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Gallery({ media }: { media: ReportDetail['media'] }) {
  const images = media.filter(m => m.mediaType === 'Image');
  const [showAll, setShowAll] = useState(false);
  const previewImages = useMemo(() => toPreviewImages(images), [images]);
  const { openPreview, previewDialog } = useReportImagePreview(previewImages);

  if (images.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center border-dashed shadow-none">
        <CardContent className="p-0 text-sm text-muted-foreground">Không có hình ảnh</CardContent>
      </Card>
    );
  }

  const showAllBtn = (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => setShowAll(true)}
      className="absolute bottom-3 right-3 z-10 h-8 rounded-full bg-background/90 shadow"
    >
      <Camera className="size-3.5" />
      Xem tất cả {images.length} ảnh
    </Button>
  );

  const H = 'h-[480px]';
  const gap = 'gap-0.5';

  let grid: React.ReactNode;

  if (images.length === 1) {
    grid = (
      <ClickableReportImage
        url={images[0]!.url}
        label={GALLERY_IMAGE_LABEL}
        onPreview={openPreview}
        className={cn('relative w-full overflow-hidden rounded-xl', H)}
        sizes="100vw"
        showTimestamp={false}
        unoptimized
      />
    );
  } else if (images.length === 2) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]!} sizes="50vw" onPreview={openPreview} />
        <GalleryImg img={images[1]!} sizes="50vw" onPreview={openPreview} />
      </div>
    );
  } else if (images.length === 3) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]!} sizes="50vw" onPreview={openPreview} />
        <div className={`grid grid-rows-2 ${gap}`}>
          <GalleryImg img={images[1]!} sizes="50vw" onPreview={openPreview} />
          <GalleryImg img={images[2]!} sizes="50vw" onPreview={openPreview} />
        </div>
      </div>
    );
  } else if (images.length === 4) {
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]!} sizes="50vw" onPreview={openPreview} />
        <div className={`grid grid-rows-2 ${gap}`}>
          <GalleryImg img={images[1]!} sizes="50vw" onPreview={openPreview} />
          <div className={`grid grid-cols-2 ${gap}`}>
            <GalleryImg img={images[2]!} sizes="25vw" onPreview={openPreview} />
            <GalleryImg img={images[3]!} sizes="25vw" onPreview={openPreview} />
          </div>
        </div>
      </div>
    );
  } else {
    const sides = images.slice(1, 5);
    const hasMore = images.length > 5;
    grid = (
      <div className={`grid ${H} grid-cols-2 ${gap} overflow-hidden rounded-xl`}>
        <GalleryImg img={images[0]!} sizes="50vw" onPreview={openPreview} />
        <div className={`relative grid grid-cols-2 grid-rows-2 ${gap}`}>
          {sides.map((img, i) => {
            const isLast = i === 3;
            return (
              <div key={img.id} className="relative overflow-hidden">
                <GalleryImg img={img} sizes="25vw" onPreview={openPreview} />
                {isLast && hasMore ? showAllBtn : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {previewDialog}
      {grid}
      <GalleryModal
        images={images}
        open={showAll}
        onOpenChange={setShowAll}
        onPreview={openPreview}
      />
    </>
  );
}

function LocationCard({
  detail,
  pendingCategoryName,
  pendingSeverity,
  editing,
  pendingCategoryId,
  setPendingCategoryId,
  setPendingSeverity,
  categories,
  catsLoading,
}: {
  detail: ReportDetail;
  pendingCategoryName: string;
  pendingSeverity: ReportSeverity;
  editing: boolean;
  pendingCategoryId: string;
  setPendingCategoryId: (id: string) => void;
  setPendingSeverity: (s: ReportSeverity) => void;
  categories: { id: string; nameVi: string }[];
  catsLoading: boolean;
}) {
  const [mapType, setMapType] = useState<'m' | 'k'>('m');
  const mapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;

  const readOnlyItems: Array<{
    icon: typeof TrendingUp;
    label: string;
    value: ReactNode;
  }> = [
    { icon: TrendingUp, label: 'Điểm ưu tiên', value: detail.priorityScore.toFixed(2) },
    { icon: Users, label: 'Lượt báo cáo', value: `${detail.reporterCount} người` },
    {
      icon: RefreshCw,
      label: 'Trạng thái',
      value: <StatusBadge status={detail.status} />,
    },
    {
      icon: RefreshCw,
      label: 'Đã mở lại',
      value: detail.reopenedCount > 0 ? `${detail.reopenedCount} lần` : 'Không',
    },
  ];

  // Inline-edit Select trigger: underline only, no border-box, matches read-only display size.
  const editSelectTriggerClass =
    'h-auto w-full rounded-none border-x-0 border-t-0 border-b border-foreground/40 bg-transparent px-0 py-1 text-lg font-medium text-foreground shadow-none focus:border-emerald-500 focus:ring-0 data-[state=open]:border-emerald-500';

  const infoIconClass =
    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40';

  return (
    <div>
      <Card className="rounded-none border-0 border-t border-border bg-transparent shadow-none">
        <CardHeader className="space-y-0 p-0 pt-6">
          <CardTitle className="text-2xl">Thông tin báo cáo ô nhiễm</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-5 pb-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className={infoIconClass}>
                <Tag className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <Label className="font-normal text-muted-foreground">Loại ô nhiễm</Label>
                {editing ? (
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
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className={infoIconClass}>
                <AlertTriangle className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <Label className="font-normal text-muted-foreground">Mức độ</Label>
                {editing ? (
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
                          {SEVERITY_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-0.5">
                    <SeverityBadge severity={pendingSeverity} />
                  </div>
                )}
              </div>
            </div>

            {readOnlyItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className={infoIconClass}>
                  <Icon className="size-4 text-muted-foreground" />
                </span>
                <div>
                  <Label className="font-normal text-muted-foreground">{label}</Label>
                  <div className="mt-0.5 text-lg font-medium text-foreground">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {detail.description ? (
            <>
              <Separator className="my-4" />
              <div className="flex items-start gap-3">
                <span className={infoIconClass}>
                  <AlignLeft className="size-4 text-muted-foreground" />
                </span>
                <div>
                  <Label className="font-normal text-muted-foreground">Mô tả</Label>
                  <p className="text-base leading-relaxed text-foreground">{detail.description}</p>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-none border-0 border-t border-border bg-transparent shadow-none">
        <CardHeader className="space-y-0 p-0 pt-6">
          <CardTitle className="text-xl">Nơi {pendingCategoryName}</CardTitle>
          <CardDescription className="text-base">{detail.address}</CardDescription>
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
                      <LayoutGrid className="size-3.5" />
                      Mặc định
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="k">
                      <LayoutGrid className="size-3.5" />
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

function AiInsightCard({ detail }: { detail: ReportDetail }) {
  const suspicious = detail.priorityScore >= 0.7;
  const possibleDuplicate = detail.reporterCount > 1;
  const reopened = detail.reopenedCount > 0;
  const aiType = detail.aiClassifiedType?.trim();
  const hasAiType = Boolean(aiType);
  const aiConfidence = detail.aiConfidence;
  const aiConfidenceLabel =
    aiConfidence != null && aiConfidence > 0
      ? aiConfidence <= 1
        ? `${Math.round(aiConfidence * 100)}%`
        : `${aiConfidence.toFixed(0)}%`
      : 'Không có';
  const wasteTagLabel =
    detail.wasteTags.length > 0
      ? detail.wasteTags.map(tag => tag.nameVi).join(', ')
      : 'Chưa gắn thẻ';
  const aiSuggestedLabel = detail.aiSuggestedWasteTagCodes?.trim() || 'Không có';
  const hasAiData =
    hasAiType ||
    (aiConfidence != null && aiConfidence > 0) ||
    Boolean(detail.aiSuggestedWasteTagCodes?.trim()) ||
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
            value={aiType}
            tone={detail.severitySetBy === 'AI' ? 'warn' : 'neutral'}
          />
        ) : null}
        <InsightRow
          label="Độ tin cậy AI"
          value={aiConfidenceLabel}
          tone={aiConfidence != null && aiConfidence >= 0.7 ? 'warn' : 'neutral'}
        />
        <InsightRow label="Gợi ý mã thẻ rác" value={aiSuggestedLabel} tone="neutral" />
        <InsightRow label="Thẻ rác thải" value={wasteTagLabel} tone="neutral" />
        <InsightRow
          label="Nghi ngờ trùng"
          value={possibleDuplicate ? `${detail.reporterCount} báo cáo` : 'Không'}
          tone={possibleDuplicate ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Khả nghi"
          value={suspicious ? 'Có' : 'Không'}
          tone={suspicious ? 'danger' : 'neutral'}
        />
        <InsightRow
          label="Đã mở lại"
          value={reopened ? `${detail.reopenedCount} lần` : 'Không'}
          tone={reopened ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Điểm ưu tiên"
          value={detail.priorityScore.toFixed(2)}
          tone={suspicious ? 'warn' : 'neutral'}
        />
        <InsightRow
          label="Mức độ đặt bởi"
          value={SEVERITY_SET_BY_LABEL[detail.severitySetBy] ?? detail.severitySetBy}
          tone={detail.severitySetBy === 'AI' ? 'warn' : 'neutral'}
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
  editingCategory,
  onToggleEditCategory,
  onVerify,
  isVerifying,
}: {
  detail: ReportDetail;
  editingCategory: boolean;
  onToggleEditCategory: () => void;
  onVerify: () => void;
  isVerifying: boolean;
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
      {tokens.bannerText ? (
        <Alert className="rounded-none border-x-0 border-t-0 border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="size-4" />
          <AlertDescription className="font-medium">{tokens.bannerText}</AlertDescription>
        </Alert>
      ) : null}

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="size-4" />
          Thời hạn xác minh
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

      <CardFooter className="flex-col gap-2">
        <Button
          variant="outline"
          onClick={onToggleEditCategory}
          className={
            editingCategory
              ? 'w-full border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
              : 'w-full'
          }
          aria-pressed={editingCategory}
        >
          {editingCategory ? (
            <Check className="mr-1.5 size-4" />
          ) : (
            <SlidersHorizontal className="mr-1.5 size-4" />
          )}
          {editingCategory ? 'Hoàn tất chỉnh' : 'Chỉnh loại'}
        </Button>
        <Button
          type="button"
          disabled={isVerifying}
          onClick={onVerify}
          className={cn('w-full text-white', tokens.verifyBtn)}
        >
          {isVerifying ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
          Xác minh
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActionCard({
  detail,
  onAssignNow,
  status,
  editingCategory,
  onToggleEditCategory,
  onVerify,
  isVerifying,
}: {
  detail: ReportDetail;
  onAssignNow: () => void;
  status: ReportStatus;
  editingCategory: boolean;
  onToggleEditCategory: () => void;
  onVerify: () => void;
  isVerifying: boolean;
}) {
  if (status === 'InProgress') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center rounded-lg bg-purple-50/70 px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-purple-100 ring-4 ring-purple-50">
            <Hourglass className="size-6 text-purple-600" />
          </div>
          <p className="mt-3 text-lg font-semibold text-purple-700">Đang xử lý</p>
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
        <CardContent className="flex flex-col items-center rounded-lg bg-emerald-50/70 px-4 py-5 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-50">
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
            className="w-full rounded-full bg-emerald-600 hover:bg-emerald-500"
            onClick={onAssignNow}
          >
            Phân công đội xử lý
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status !== 'Submitted') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center rounded-lg bg-muted/50 px-4 py-5 text-center">
          <p className="text-lg font-semibold text-foreground">{status}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SlaActionCard
      detail={detail}
      editingCategory={editingCategory}
      onToggleEditCategory={onToggleEditCategory}
      onVerify={onVerify}
      isVerifying={isVerifying}
    />
  );
}

function VerifyAssignPromptDialog({
  open,
  onCancel,
  onAssign,
}: {
  open: boolean;
  onCancel: () => void;
  onAssign: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Xác minh thành công</DialogTitle>
          <DialogDescription>
            Bạn có muốn phân công đội xử lý cho báo cáo này ngay không?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="button" className="bg-emerald-600 hover:bg-emerald-500" onClick={onAssign}>
            Phân công
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
  /** Khi embed (vd. tab Phân công) — quay lại danh sách thay vì route /officer/verify */
  onBack?: () => void;
  /** `tracking` — hiển thị panel phân công & chuyển giao đội. */
  detailMode?: 'verify' | 'tracking';
}) {
  const router = useRouter();
  const { data: detail, isLoading, isError, refetch } = useReportDetail(id);
  const { data: categories = [], isLoading: catsLoading } = useCatalogPollutionCategories();
  const verifyMutation = useVerifyReport();

  const [pendingCategoryId, setPendingCategoryId] = useState<string>('');
  const [pendingSeverity, setPendingSeverity] = useState<ReportSeverity>('Medium');
  const [editingCategory, setEditingCategory] = useState(false);
  const [assignPromptOpen, setAssignPromptOpen] = useState(false);

  // Sync pending state once detail loads (runs once)
  const [synced, setSynced] = useState(false);
  if (detail && !synced) {
    setPendingCategoryId(detail.categoryId);
    setPendingSeverity(detail.severity);
    setSynced(true);
  }

  const pendingCategoryName =
    categories.find(c => c.id === pendingCategoryId)?.nameVi ?? detail?.categoryName ?? '';

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
        <BackLink onBack={onBack} />
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>Không thể tải chi tiết báo cáo. Vui lòng thử lại.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAssignNow = () => {
    if (onBack && detailMode !== 'tracking') {
      onBack();
      return;
    }
    router.push(`/officer/assign?highlightReportId=${detail.id}`);
  };

  const handleAssignAfterVerify = () => {
    setAssignPromptOpen(false);
    router.push(`/officer/assign?highlightReportId=${detail.id}`);
  };

  const handleVerify = async () => {
    const body = {
      ...(pendingSeverity !== detail.severity ? { overrideSeverity: pendingSeverity } : {}),
      ...(pendingCategoryId !== detail.categoryId ? { overrideCategoryId: pendingCategoryId } : {}),
    };

    try {
      const result = await verifyMutation.mutateAsync({ reportId: detail.id, body });
      toastApiSuccess(result, 'Đã xác minh báo cáo.');
      setEditingCategory(false);
      await refetch();
      if (detailMode === 'verify') {
        setAssignPromptOpen(true);
      }
    } catch (error) {
      toastApiError(error, 'Không thể xác minh báo cáo.');
    }
  };

  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} />

      <HeaderStrip detail={detail} pendingCategoryName={pendingCategoryName} />

      <Gallery media={detail.media} />

      {/* Content below gallery — padded on both sides */}
      <div className="px-14 xl:px-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left — scrollable content */}
          <div className="min-w-0 space-y-4">
            {/* Title block */}
            <div className="pt-2 pb-2">
              <CardTitle className="text-3xl font-bold tracking-tight">
                Được báo cáo bởi{' '}
                {SEVERITY_SET_BY_LABEL[detail.severitySetBy] ?? detail.severitySetBy}
              </CardTitle>
              <CardDescription className="mt-1.5 flex items-center gap-1.5 text-base">
                <MapPin className="size-3.5 shrink-0 text-red-500" />
                <span>{detail.address}</span>
                <span className="size-1 rounded-full bg-foreground" />
                <span>
                  {new Date(detail.createdAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </CardDescription>
            </div>

            <LocationCard
              detail={detail}
              pendingCategoryName={pendingCategoryName}
              pendingSeverity={pendingSeverity}
              editing={editingCategory}
              pendingCategoryId={pendingCategoryId}
              setPendingCategoryId={setPendingCategoryId}
              setPendingSeverity={setPendingSeverity}
              categories={categories}
              catsLoading={catsLoading}
            />

            {detailMode === 'tracking' && (
              // <ReportAssignmentPanel detail={detail} onGoToAssign={handleAssignNow} />
              <div>ReportAssignmentPanel</div>
            )}
          </div>

          {/* Right — sticky: AI insight above action card */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-19 lg:self-start">
            <AiInsightCard detail={detail} />
            <ActionCard
              detail={detail}
              onAssignNow={handleAssignNow}
              status={detail.status}
              editingCategory={editingCategory}
              onToggleEditCategory={() => setEditingCategory(v => !v)}
              onVerify={() => void handleVerify()}
              isVerifying={verifyMutation.isPending}
            />
          </div>
        </div>
      </div>

      <VerifyAssignPromptDialog
        open={assignPromptOpen}
        onCancel={() => setAssignPromptOpen(false)}
        onAssign={handleAssignAfterVerify}
      />
    </div>
  );
}

function BackLink({ onBack }: { onBack?: () => void }) {
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
      <Link href="/officer/verify">{content}</Link>
    </Button>
  );
}
