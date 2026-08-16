'use client';

/**
 * Chi tiết báo cáo hàng đợi phân công — `/company/assign/[id]`.
 * Layout parity VerifyDetailClient / AssignReportDetailClient (không có AiInsightCard).
 * Data: GET /v1/reports/company-reports/{id}
 *   L4 `useCompanyReportDetail` → L2 `fetchCompanyReportDetail` → L1
 *   `adaptCompanyReportDetail` (`lib/api/adapters/company.adapter.ts`).
 * Không dùng GET /v1/reports/company-assignments/{id} (đó là tracking).
 */

import { CompanyAssignTeamDialog } from '@/components/company/assign/CompanyAssignTeamDialog';
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
import { Label } from '@/components/ui/label';
import { LayoutGrid, hero5CardClass, type LayoutGridCard } from '@/components/ui/layout-grid';
import { useCompanyReportDetail } from '@/hooks/useCompany';
import type { CompanyAssignmentDetail, CompanyAssignmentWasteTag } from '@/lib/api/models/company';
import type { ReportSeverity, ReportStatus } from '@/lib/api/models/report';
import { getWasteTagFaIcon } from '@/lib/constants/adminWasteTags';
import { REPORT_SEVERITY_LABEL_VI } from '@/lib/constants/reportActions';
import { normalizeReportStatus, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  AlertTriangle,
  AlignLeft,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardList,
  Copy,
  Hourglass,
  Layers,
  LayoutGrid as LayoutGridIcon,
  MapPin,
  RefreshCw,
  Shield,
  Tag,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const DETAIL_PAGE_X_PAD = 'px-14 xl:px-24';
const GALLERY_PREVIEW_MAX = 5;
const INFO_ICON_CLASS =
  'flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40';
const SECTION_ICON_CLASS = 'size-5 shrink-0 text-emerald-600';
const WASTE_TAG_BADGE_PAD = 'px-3.5 py-1.5';

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

type CompanyAssignReportDetailClientProps = {
  reportId: string;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

function toReportSeverity(value: string): ReportSeverity | null {
  if (value === 'Critical' || value === 'High' || value === 'Medium' || value === 'Low') {
    return value;
  }
  return null;
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-xs">
      <ArrowLeft className="size-3.5" />
      Quay lại danh sách
    </Button>
  );
}

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

function WasteTagBadges({ tags }: { tags: CompanyAssignmentWasteTag[] }) {
  const displayTags = useMemo(
    () =>
      [...tags]
        .map(t => ({ id: t.tagId, code: t.code, nameVi: t.nameVi.trim() }))
        .filter(t => Boolean(t.nameVi))
        .sort((a, b) => {
          const byLen = b.nameVi.length - a.nameVi.length;
          if (byLen !== 0) return byLen;
          return a.nameVi.localeCompare(b.nameVi, 'vi');
        }),
    [tags]
  );

  if (displayTags.length === 0) {
    return <p className="text-base font-medium text-muted-foreground">Chưa gắn thẻ</p>;
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2">
      {displayTags.map(tag => {
        const icon = getWasteTagFaIcon(tag.code, tag.nameVi);
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
      })}
    </div>
  );
}

function HeaderStrip({ detail }: { detail: CompanyAssignmentDetail }) {
  return (
    <CardTitle className="flex min-w-0 items-start justify-between gap-3 text-2xl font-bold tracking-tight">
      <span className="min-w-0 flex-1">
        Báo cáo{' '}
        <span className="relative inline-block align-baseline pr-6">{detail.categoryName}</span>
      </span>
      <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-400">#{detail.code}</span>
    </CardTitle>
  );
}

function Gallery({ detail }: { detail: CompanyAssignmentDetail }) {
  const [showAll, setShowAll] = useState(false);

  const images = useMemo(
    () =>
      (detail.citizenMedia ?? []).filter(
        m => m.type === 'Image' || m.type.toLowerCase().includes('image')
      ),
    [detail.citizenMedia]
  );

  const total = images.length;
  const hasMore = total > GALLERY_PREVIEW_MAX;

  const cards = useMemo((): LayoutGridCard[] => {
    const preview = images.slice(0, GALLERY_PREVIEW_MAX);
    return preview.map((img, i) => {
      const isLastPreview = i === preview.length - 1;
      return {
        id: img.id,
        thumbnail: img.thumbnailUrl ?? img.url,
        className: hero5CardClass(i, preview.length),
        content: (
          <div>
            <p className="text-xl font-bold text-white md:text-2xl">Ảnh {i + 1}</p>
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              <span className="rounded-full bg-black/35 px-2 py-1 text-white/95">
                {formatBytes(0)}
              </span>
              <span className="rounded-full bg-black/35 px-2 py-1 text-white/95">
                {formatDateTime(img.uploadedAt)}
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
  }, [images, total, hasMore]);

  if (total === 0) {
    return (
      <Card className="relative flex h-64 items-center justify-center overflow-hidden border-dashed shadow-none">
        <CardContent className="space-y-2 p-0 text-center text-sm text-muted-foreground">
          <p>Không có hình ảnh</p>
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium">
            <span className="rounded-full bg-muted px-2 py-1 text-foreground">
              {formatBytes(0)}
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-foreground">
              {formatDateTime(detail.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative h-[min(62vh,520px)] w-full overflow-hidden rounded-xl bg-white">
        <LayoutGrid cards={cards} variant="hero5" className="h-full gap-1 p-0" />
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="flex h-[92vh] max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogDescription className="sr-only">
            Hộp thoại xem tất cả hình ảnh báo cáo theo dạng lưới.
          </DialogDescription>
          <DialogHeader className="shrink-0 space-y-0 border-b px-12 py-4 text-center">
            <DialogTitle className="truncate text-center text-sm font-semibold tracking-tight text-foreground md:text-base">
              {detail.address || 'Hình ảnh báo cáo'}
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
                    src={img.thumbnailUrl ?? img.url}
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

/** Thông tin báo cáo ô nhiễm + Nơi {category} — parity LocationCard (read-only). */
function PollutionInfoSection({ detail }: { detail: CompanyAssignmentDetail }) {
  const [mapType, setMapType] = useState<'m' | 'k'>('m');
  const status = normalizeReportStatus(detail.status);
  const severity = toReportSeverity(detail.severity);
  const mapsUrl = `https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`;
  const hasCategory = Boolean(detail.categoryName?.trim());

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
            {hasCategory ? (
              <InfoField icon={Tag} label="Loại ô nhiễm">
                <p className="text-lg font-medium text-foreground">{detail.categoryName}</p>
              </InfoField>
            ) : null}

            <InfoField icon={Shield} label="Trạng thái">
              <div className="text-lg font-medium text-foreground">
                <StatusBadge status={status} />
              </div>
            </InfoField>

            {severity ? (
              <InfoField icon={AlertTriangle} label="Mức độ">
                <SeverityBadge severity={severity} />
              </InfoField>
            ) : null}

            {detail.reopenedCount != null ? (
              <InfoField icon={RefreshCw} label="Đã mở lại">
                <div className="text-lg font-medium text-foreground">
                  {detail.reopenedCount > 0 ? `${detail.reopenedCount} lần` : 'Không'}
                </div>
              </InfoField>
            ) : null}

            <div className="min-w-0 sm:col-span-2">
              <InfoField icon={Tag} label="Thẻ rác thải">
                <WasteTagBadges tags={detail.wasteTags} />
              </InfoField>
            </div>

            {detail.priorityScore != null && Number.isFinite(detail.priorityScore) ? (
              <InfoField icon={TrendingUp} label="Điểm ưu tiên">
                <div className="text-lg font-medium text-foreground">
                  {detail.priorityScore.toFixed(2)}
                </div>
              </InfoField>
            ) : null}

            {detail.description?.trim() ? (
              <div className="min-w-0 sm:col-span-2">
                <InfoField icon={AlignLeft} label="Mô tả">
                  <ExpandableDescription
                    key={detail.description}
                    text={detail.description.trim()}
                  />
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
              <CardTitle className="text-xl leading-7">Nơi {detail.categoryName}</CardTitle>
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

/** Action card — parity VerifyDetailClient ActionCard (assign context, không verify/reject). */
function AssignActionCard({
  detail,
  onAssign,
  onReassign,
}: {
  detail: CompanyAssignmentDetail;
  onAssign: () => void;
  onReassign: () => void;
}) {
  const status = normalizeReportStatus(detail.status);
  const hasTeam = Boolean(detail.assignment?.teamId);
  const canReassign = detail.canReassign && hasTeam;

  if (hasTeam) {
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
            Báo cáo đã được phân công đội
            {detail.assignment?.teamName ? (
              <>
                {' '}
                <span className="font-medium text-foreground">{detail.assignment.teamName}</span>
              </>
            ) : null}{' '}
            và đang trong quá trình khắc phục.
          </CardDescription>
        </CardContent>
        {canReassign ? (
          <CardFooter>
            <Button
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500"
              onClick={onReassign}
            >
              <UserPlus className="mr-2 size-4" />
              Phân công lại
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    );
  }

  if (status === 'Verified' || status === 'Dispatched' || status === 'InProgress') {
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
            {status === 'Dispatched' ? 'Chờ phân công' : 'Sẵn sàng phân công'}
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
            onClick={onAssign}
          >
            <UserPlus className="mr-2 size-4" />
            Phân công đội xử lý
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === 'Duplicate') {
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
            Báo cáo đã được đánh dấu trùng lặp.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trạng thái</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center px-4 py-5 text-center">
        <StatusBadge status={status} />
        <CardDescription className="mt-3 text-base">
          Báo cáo không còn trong hàng đợi phân công.
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackLink onBack={onBack} />
      <div className={cn(DETAIL_PAGE_X_PAD, 'space-y-4')}>
        <div className="h-9 w-2/3 max-w-md animate-pulse rounded bg-muted" />
        <div className="h-[min(62vh,520px)] animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Card className="h-64 animate-pulse shadow-none" />
            <Card className="h-72 animate-pulse shadow-none" />
          </div>
          <Card className="h-56 animate-pulse shadow-none" />
        </div>
      </div>
    </div>
  );
}

export function CompanyAssignReportDetailClient({
  reportId,
}: CompanyAssignReportDetailClientProps) {
  const router = useRouter();
  const {
    data: detail,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useCompanyReportDetail(reportId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'reassign'>('assign');
  const [successOpen, setSuccessOpen] = useState(false);

  const assignListHref = `/company/assign?${new URLSearchParams({ highlightReportId: reportId }).toString()}`;

  const goBackToList = () => router.push(assignListHref);
  const goToTracking = () =>
    router.push(`/company/tracking?reportId=${encodeURIComponent(reportId)}`);

  const handleAssignSuccess = () => {
    setAssignOpen(false);
    setSuccessOpen(true);
    void refetch();
  };

  const handleSuccessDialogChange = (open: boolean) => {
    if (!open) {
      setSuccessOpen(false);
      goBackToList();
    }
  };

  if (isPending) {
    return <DetailSkeleton onBack={goBackToList} />;
  }

  if (isError || !detail) {
    return (
      <div className="space-y-4">
        <BackLink onBack={goBackToList} />
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Không thể tải chi tiết báo cáo.
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('mr-1.5 size-3.5', isFetching && 'animate-spin')} />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const verifiedByName = detail.verifiedByName?.trim();

  return (
    <div className="space-y-4">
      <BackLink onBack={goBackToList} />

      <div className={cn(DETAIL_PAGE_X_PAD, 'space-y-4')}>
        <HeaderStrip detail={detail} />

        <div className="space-y-16">
          <Gallery detail={detail} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0 space-y-8">
              <div className="pt-2 pb-2">
                {verifiedByName ? (
                  <CardTitle className="text-2xl font-semibold leading-8 tracking-tight">
                    Được xác minh bởi {verifiedByName}
                  </CardTitle>
                ) : null}
                <CardDescription
                  className={cn('text-base leading-normal', verifiedByName ? 'mt-1.5' : undefined)}
                >
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

              <PollutionInfoSection detail={detail} />
            </div>

            <div className="flex flex-col gap-4 lg:sticky lg:top-19 lg:self-start">
              <AssignActionCard
                detail={detail}
                onAssign={() => {
                  setAssignMode('assign');
                  setAssignOpen(true);
                }}
                onReassign={() => {
                  setAssignMode('reassign');
                  setAssignOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <CompanyAssignTeamDialog
        open={assignOpen}
        reportId={reportId}
        reportCode={detail.code}
        mode={assignMode}
        oldTeamId={detail.assignment?.teamId ?? null}
        oldTeamName={detail.assignment?.teamName ?? null}
        onClose={() => setAssignOpen(false)}
        onSuccess={handleAssignSuccess}
        showSuccessToast={false}
      />

      <SuccessDialog
        open={successOpen}
        onOpenChange={handleSuccessDialogChange}
        accent="emerald"
        title="Phân công thành công"
        description={
          <>
            Báo cáo <span className="font-medium text-foreground">#{detail.code}</span> đã được gán
            đội xử lý. Bạn có thể theo dõi tiến trình tại mục{' '}
            <span className="font-medium text-foreground">Theo dõi xử lý</span>.
          </>
        }
        secondaryAction={{
          label: 'Quay lại danh sách',
          onClick: () => handleSuccessDialogChange(false),
        }}
        primaryAction={{
          label: 'Theo dõi xử lý',
          onClick: () => {
            setSuccessOpen(false);
            goToTracking();
          },
        }}
      />
    </div>
  );
}
