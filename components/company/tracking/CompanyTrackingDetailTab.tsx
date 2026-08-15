'use client';

import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ImageZoomPane } from '@/components/ui/image-zoom-pane';
import { LayoutGrid, hero5CardClass, type LayoutGridCard } from '@/components/ui/layout-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyAssignTeamDialog } from '@/components/company/assign/CompanyAssignTeamDialog';
import { useCompanyAssignmentDetail } from '@/hooks/useCompany';
import type {
  CompanyAssignmentDetail,
  CompanyAssignmentMediaItem,
  CompanyAssignmentTeamDetail,
  CompanyAssignmentTimelineEntry,
} from '@/lib/api/models/company';
import type { ReportStatus } from '@/lib/api/models/report';
import {
  REPORT_STATUS_BADGE_CLASSES,
  normalizeReportStatus,
  reportStatusLabelVi,
} from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  assignmentStatusLabel,
  formatCompanyDateTime,
  formatSlaRemaining,
  queueSeverityClasses,
  queueSeverityLabel,
  teamTaskAcceptanceText,
} from '@/utils/companyUi';
import {
  AlignLeft,
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  ExternalLink,
  Eye,
  FilePlus2,
  ImageIcon,
  MapPin,
  MessageSquareWarning,
  Pencil,
  RefreshCw,
  RotateCcw,
  Users,
  UserPlus,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface CompanyTrackingDetailTabProps {
  reportId: string;
  onBack: () => void;
}

/* ─── Shared types / constants ───────────────────────────────────────────── */

type PreviewImage = {
  url: string;
  label: string;
  uploadedAt?: string;
};

type PreviewHandler = (image: PreviewImage) => void;

type LifecycleState = 'done' | 'current' | 'pending';

interface MediaStageImage {
  url: string;
  uploadedAt?: string;
}

/** Một lần cập nhật tiến độ (từ assignment.progressUpdates). */
interface ProgressUpdateStageItem {
  id: string;
  progressPercent: number;
  progressNote: string | null;
  updatedAt: string;
  updatedByName: string;
  teamName: string;
  images: MediaStageImage[];
}

interface LifecycleStage {
  key: string;
  step: number;
  label: string;
  at: string | null;
  meta?: string | null;
  /** Highlight meta (vd. đội từ chối). */
  metaTone?: 'default' | 'danger';
  assignmentItems?: {
    assignmentId: string;
    teamId: string;
    teamName: string;
    subtitle?: ReactNode;
  }[];
  mediaLabel?: string;
  mediaEmptyHint?: string;
  images?: MediaStageImage[];
  /** Step Cập nhật tiến độ — nhiều lần update (không dùng media.progressImages). */
  progressUpdates?: ProgressUpdateStageItem[];
  /** «Được cập nhật bởi …» dưới ảnh trước/sau — giống step tiến độ. */
  updatedByName?: string | null;
  noteBelowMedia?: string | null;
  state: LifecycleState;
}

const AVATAR_COLORS = [
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-emerald-200 text-emerald-800',
  'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800',
] as const;

const ASSIGNMENT_STATUS_BADGE: Record<string, string> = {
  Assigned: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  InProgress: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  Completed: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  Declined: 'bg-red-50 text-red-700 ring-red-200/80',
  Escalated: 'bg-amber-50 text-amber-800 ring-amber-200/80',
};

const GALLERY_PREVIEW_MAX = 5;

/* ─── Pure helpers ───────────────────────────────────────────────────────── */

function formatPreviewDateTime(iso?: string): string {
  if (!iso) return '';
  return formatCompanyDateTime(iso);
}

/** Chỉ giờ:phút — caption dưới ảnh progress update. */
function formatTimeOnly(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nullIso(iso: string | null | undefined): string | null {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
}

function latestUploadedAt(images: CompanyAssignmentMediaItem[]): string | null {
  if (images.length === 0) return null;
  return (
    [...images].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)).at(-1)?.uploadedAt ?? null
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

function hashColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

function usefulReason(reason?: string | null): string | null {
  const value = reason?.trim();
  if (!value || value === 'string' || value === '[ADMIN] string') return null;
  return value;
}

function teamLeaderName(team: CompanyAssignmentTeamDetail): string {
  return team.members.find(m => m.isLeader)?.fullName?.trim() || '—';
}

function hasValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

/* ─── Image preview (duplicated — no officer imports) ────────────────────── */

function ImagePreviewDialog({
  images,
  index,
  onClose,
  onChangeIndex,
}: {
  images: PreviewImage[];
  index: number | null;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}) {
  const current = index !== null ? images[index] : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < images.length - 1;

  return (
    <Dialog open={index !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className={cn(
          'fixed inset-0 left-0 top-0 z-200 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0',
          'flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white shadow-none',
          'data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0',
          '[&>button.absolute]:hidden'
        )}
      >
        <DialogDescription className="sr-only">
          Hộp thoại xem trước ảnh. Cuộn để phóng to, kéo để di chuyển, double-click để reset.
        </DialogDescription>
        {current ? (
          <>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-20 size-10 rounded-full text-white hover:bg-white/15"
                onClick={onClose}
              >
                <X className="size-6" />
                <span className="sr-only">Đóng</span>
              </Button>
              {hasPrev ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/15 sm:left-6"
                  onClick={() => onChangeIndex((index ?? 0) - 1)}
                >
                  <ChevronLeft className="size-7" />
                  <span className="sr-only">Ảnh trước</span>
                </Button>
              ) : null}
              <div className="relative h-full w-full">
                <ImageZoomPane key={current.url} src={current.url} alt={current.label} />
              </div>
              {hasNext ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full text-white hover:bg-white/15 sm:right-6"
                  onClick={() => onChangeIndex((index ?? 0) + 1)}
                >
                  <ChevronRight className="size-7" />
                  <span className="sr-only">Ảnh tiếp theo</span>
                </Button>
              ) : null}
            </div>
            <DialogHeader className="shrink-0 space-y-0.5 border-t border-white/10 bg-black/90 px-4 py-3 text-left sm:px-6">
              <DialogTitle className="text-sm font-medium text-white">{current.label}</DialogTitle>
              <DialogDescription className="text-xs text-white/70">
                Cuộn để zoom · kéo để pan · double-click để reset
                {images.length > 1 ? ` · ${(index ?? 0) + 1}/${images.length}` : ''}
                {current.uploadedAt ? ` · ${formatPreviewDateTime(current.uploadedAt)}` : ''}
              </DialogDescription>
            </DialogHeader>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ClickableImage({
  url,
  label,
  uploadedAt,
  onPreview,
  className,
  sizes = '160px',
  showTimestamp = true,
}: {
  url: string;
  label: string;
  uploadedAt?: string;
  onPreview: PreviewHandler;
  className?: string;
  sizes?: string;
  showTimestamp?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPreview({ url, label, uploadedAt })}
      aria-label={`Xem ảnh ${label}`}
      className={cn(
        'group relative cursor-zoom-in overflow-hidden bg-muted ring-1 ring-border/60 transition hover:ring-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        className
      )}
    >
      <Image
        src={url}
        alt={label}
        fill
        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        sizes={sizes}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/45"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white opacity-0 shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Eye className="size-5" />
        </span>
      </span>
      {showTimestamp && uploadedAt ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-1 text-[10px] text-white">
          {formatPreviewDateTime(uploadedAt)}
        </span>
      ) : null}
    </button>
  );
}

/* ─── Layout primitives ──────────────────────────────────────────────────── */

function MetaRow({
  icon: Icon,
  label,
  children,
  align = 'center',
}: {
  icon: typeof CircleDot;
  label: string;
  children: ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1',
        align === 'start' ? 'items-start' : 'items-center'
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0 self-center text-muted-foreground',
          align === 'start' && 'mt-0.5 self-start'
        )}
        aria-hidden
      />
      <span
        className={cn(
          'text-sm leading-5 text-muted-foreground',
          align === 'start' ? 'pt-0.5' : 'leading-5'
        )}
      >
        {label}
      </span>
      <div className={cn('min-w-0 text-sm leading-5', align === 'center' && 'flex items-center')}>
        {children}
      </div>
    </div>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedH, setCollapsedH] = useState(0);
  const [fullH, setFullH] = useState(0);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const body = text.trimEnd();

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
      const collapsed = Math.round(lineHeight * 2);
      setFullH(full);
      setCollapsedH(Math.min(collapsed, full));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [body]);

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
            className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground/90"
          >
            {body}
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
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent"
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
          className="mt-0.5 text-xs font-semibold text-brand transition-colors hover:text-brand/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
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

function SectionBlock({
  children,
  className,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('w-full min-w-0', className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {title}
            </h2>
            {description ? (
              <div className="mt-1.5 text-xs text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function TeamRowProgress({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex min-w-0 items-center gap-2.5" aria-label={`Tiến độ ${clamped}%`}>
      <div className="h-2 w-full min-w-16 max-w-36 flex-1 overflow-hidden rounded-full bg-slate-100 sm:w-28 sm:flex-none">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-800">{clamped}%</span>
    </div>
  );
}

/* ─── Lifecycle spine (right column) ─────────────────────────────────────── */

function LifecycleSpine({
  stages,
  onPreview,
}: {
  stages: LifecycleStage[];
  onPreview: PreviewHandler;
}) {
  const [progressOpen, setProgressOpen] = useState(true);

  const currentKey =
    stages.find(s => s.state === 'current')?.key ??
    stages.find(s => s.state === 'pending')?.key ??
    stages[stages.length - 1]?.key ??
    '';

  return (
    <ol className="relative overflow-visible px-1 pt-2">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const isDone = stage.state === 'done';
        const isCurrent = stage.key === currentKey;
        const hasMedia = stage.mediaLabel != null;
        const images = stage.images ?? [];
        const isProgressStep = stage.key === 'progress';
        const progressCollapsed = isProgressStep && !progressOpen;
        const progressCount = stage.progressUpdates?.length ?? 0;

        return (
          <li key={stage.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast ? (
              <span
                className={cn(
                  'absolute top-7 left-3.75 z-0 w-px translate-x-[-0.5px]',
                  'h-[calc(100%-1.75rem)]',
                  isDone ? 'bg-brand' : 'bg-slate-200'
                )}
                aria-hidden
              />
            ) : null}

            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center overflow-visible">
              {isCurrent ? (
                <span
                  className="media-step-pulse-ring pointer-events-none absolute inset-0 z-0 rounded-full bg-brand/30"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                  isDone && 'bg-brand text-brand-foreground',
                  isCurrent &&
                    !isDone &&
                    'border-2 border-brand bg-white text-brand shadow-sm ring-4 ring-brand/15',
                  !isDone && !isCurrent && 'border border-slate-200 bg-white text-slate-400'
                )}
                aria-hidden
              >
                {isDone ? <Check className="size-4" /> : stage.step}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                  {isProgressStep ? (
                    <button
                      type="button"
                      onClick={() => setProgressOpen(v => !v)}
                      aria-expanded={progressOpen}
                      className={cn(
                        'inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md text-left',
                        'transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'
                      )}
                    >
                      <h3
                        className={cn(
                          'text-sm font-semibold',
                          isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                        )}
                      >
                        {stage.label}
                      </h3>
                      <motion.span
                        animate={{ rotate: progressOpen ? 180 : 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex"
                      >
                        <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
                      </motion.span>
                      {!progressOpen && progressCount > 0 ? (
                        <span className="text-[11px] font-medium tabular-nums text-slate-400">
                          ({progressCount})
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <h3
                      className={cn(
                        'text-sm font-semibold',
                        isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                      )}
                    >
                      {stage.label}
                    </h3>
                  )}
                  {isCurrent ? (
                    <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                      Hiện tại
                    </span>
                  ) : null}
                </div>
                {stage.key !== 'progress' ? (
                  <span className="shrink-0 text-right text-xs tabular-nums text-slate-500">
                    {stage.at ? (
                      formatCompanyDateTime(stage.at)
                    ) : isDone ? (
                      '—'
                    ) : (
                      <span className="italic text-slate-400">Chưa thực hiện</span>
                    )}
                  </span>
                ) : null}
              </div>

              {stage.meta ? (
                <p
                  className={cn(
                    'mt-1.5 max-w-lg text-sm leading-relaxed',
                    stage.metaTone === 'danger' ? 'font-medium text-red-600' : 'text-slate-500'
                  )}
                >
                  {stage.meta}
                </p>
              ) : null}

              {stage.assignmentItems && stage.assignmentItems.length > 0 ? (
                <ul className="mt-2.5 flex flex-col gap-2.5">
                  {stage.assignmentItems.map(item => (
                    <li key={item.assignmentId} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
                          hashColor(item.teamId)
                        )}
                        aria-hidden
                      >
                        {getInitials(item.teamName)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{item.teamName}</p>
                        {item.subtitle ? (
                          <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {stage.progressUpdates ? (
                <AnimatePresence initial={false}>
                  {!progressCollapsed ? (
                    <motion.div
                      key={`${stage.key}-progress`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2.5">
                        {stage.progressUpdates.length === 0 ? (
                          <p className="text-sm italic text-slate-400">
                            {stage.mediaEmptyHint ?? 'Chưa có cập nhật tiến độ.'}
                          </p>
                        ) : (
                          <ul className="mt-1 flex flex-col gap-10">
                            {stage.progressUpdates.map(update => {
                              const percent = Math.max(
                                0,
                                Math.min(100, Math.round(update.progressPercent))
                              );
                              return (
                                <li key={update.id} className="space-y-2 py-1">
                                  <div className="space-y-1">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <p className="text-sm font-semibold text-slate-800">
                                        Tiến độ{' '}
                                        <span className="tabular-nums text-emerald-700">
                                          {percent}%
                                        </span>
                                      </p>
                                      <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                                        {formatCompanyDateTime(update.updatedAt)}
                                      </span>
                                    </div>
                                    {update.updatedByName?.trim() ? (
                                      <p className="text-xs text-slate-500">
                                        Được cập nhật bởi {update.updatedByName.trim()}
                                      </p>
                                    ) : null}
                                  </div>
                                  {update.images.length > 0 ? (
                                    <ul className="flex flex-wrap gap-2 pt-0.5">
                                      {update.images.map(img => (
                                        <li
                                          key={`${update.id}-${img.url}-${img.uploadedAt}`}
                                          className="w-20 sm:w-24"
                                        >
                                          <ClickableImage
                                            url={img.url}
                                            label={`Tiến độ ${percent}%`}
                                            uploadedAt={img.uploadedAt}
                                            onPreview={onPreview}
                                            showTimestamp={false}
                                            className="aspect-square w-full rounded-lg"
                                          />
                                          {img.uploadedAt ? (
                                            <p className="mt-1 text-center text-[11px] leading-snug text-slate-500 tabular-nums">
                                              {formatTimeOnly(img.uploadedAt)}
                                            </p>
                                          ) : null}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                  {update.progressNote?.trim() ? (
                                    <p
                                      className={cn(
                                        'relative max-w-lg rounded-r-md py-1.5 pl-3 pr-2',
                                        'bg-emerald-50/60 text-sm leading-relaxed text-slate-600',
                                        'whitespace-pre-wrap wrap-break-word'
                                      )}
                                    >
                                      <span
                                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-400/70"
                                        aria-hidden
                                      />
                                      <span className="font-semibold text-slate-700">
                                        Ghi chú:{' '}
                                      </span>
                                      {update.progressNote.trim()}
                                    </p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              ) : hasMedia ? (
                <div className="mt-2.5">
                  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    {stage.mediaLabel}
                    <span className="ml-1.5 tabular-nums">({images.length})</span>
                  </p>
                  {stage.updatedByName?.trim() ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Được cập nhật bởi {stage.updatedByName.trim()}
                    </p>
                  ) : null}
                  {images.length === 0 ? (
                    <p className="mt-1.5 text-sm italic text-slate-400">{stage.mediaEmptyHint}</p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {images.map(img => (
                        <li key={`${img.url}-${img.uploadedAt}`} className="w-20 sm:w-24">
                          <ClickableImage
                            url={img.url}
                            label={stage.mediaLabel ?? stage.label}
                            uploadedAt={img.uploadedAt}
                            onPreview={onPreview}
                            showTimestamp={false}
                            className="aspect-square w-full rounded-lg"
                          />
                          {img.uploadedAt ? (
                            <p className="mt-1 text-center text-[11px] leading-snug text-slate-500 tabular-nums">
                              {formatPreviewDateTime(img.uploadedAt)}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  {stage.noteBelowMedia?.trim() ? (
                    <p className="mt-2.5 max-w-lg text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-slate-600">
                      <span className="font-semibold text-slate-700">Ghi chú: </span>
                      {stage.noteBelowMedia.trim()}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Tiến trình công ty:
 * Phân công đội → Đội nhận việc → Bắt đầu xử lý → Cập nhật tiến độ →
 * Nghiệm thu hiện trường → Đã giải quyết (resolved/closed).
 */
function buildCompanyLifecycleStages(data: CompanyAssignmentDetail): LifecycleStage[] {
  const { media, status } = data;
  const assignments: CompanyAssignmentTeamDetail[] =
    data.assignment != null ? [data.assignment] : data.teamAssignments;
  const normalized = normalizeReportStatus(status);
  const hasTeams = assignments.length > 0;
  const firstAssignedAt =
    nullIso(assignments[0]?.assignedAt) ?? nullIso(data.dispatchedToCompanyAt);
  const anyAccepted = assignments.some(t => Boolean(nullIso(t.acceptedAt)));
  const firstAcceptedAt = assignments.map(t => nullIso(t.acceptedAt)).find(Boolean) ?? null;
  const isResolved = Boolean(nullIso(data.resolvedAt) || nullIso(data.closedAt));
  const terminal =
    normalized === 'Resolved' ||
    normalized === 'Closed' ||
    normalized === 'ClosedNoViolation' ||
    isResolved;

  const assignItems = assignments.map(team => {
    const byName = team.assignedByName?.trim();
    return {
      assignmentId: team.assignmentId,
      teamId: team.teamId,
      teamName: team.teamName,
      subtitle: byName ? (
        <>
          Điều phối bởi quản lý <span className="font-semibold text-slate-700">{byName}</span>
        </>
      ) : (
        'Điều phối bởi quản lý công ty'
      ),
    };
  });

  const anyDeclined = assignments.some(t => t.status === 'Declined');

  const acceptItems = assignments.map(team => {
    const accepted = nullIso(team.acceptedAt);
    const leader =
      team.teamLeaderName?.trim() || team.members.find(m => m.isLeader)?.fullName?.trim() || '';
    return {
      assignmentId: team.assignmentId,
      teamId: team.teamId,
      teamName: team.teamName,
      subtitle: accepted ? (
        leader ? (
          <>
            Đã nhận việc bởi <span className="font-semibold text-slate-700">{leader}</span> (trưởng
            nhóm)
          </>
        ) : (
          'Đã nhận việc'
        )
      ) : team.status === 'Declined' ? (
        <span className="text-red-600">Đội đã từ chối task</span>
      ) : (
        'Chưa nhận việc'
      ),
    };
  });

  /** Meta step «Đội nhận việc» — Declined: không dùng «Chưa có đội nào nhận việc»; lý do xem tab Tiến độ. */
  let acceptedMeta: string | null = null;
  if (hasTeams && !anyAccepted) {
    acceptedMeta = anyDeclined
      ? 'Đội đã từ chối nhận việc. Xem lý do ở tab Tiến độ.'
      : 'Chưa có đội nào nhận việc.';
  }

  const progressUpdates: ProgressUpdateStageItem[] = assignments
    .flatMap(a =>
      (a.progressUpdates ?? []).map(u => ({
        id: u.id,
        progressPercent: u.progressPercent,
        progressNote: u.progressNote ?? null,
        updatedAt: u.updatedAt,
        updatedByName: u.updatedByName,
        teamName: a.teamName,
        images: u.images.map(img => ({ url: img.url, uploadedAt: img.uploadedAt })),
      }))
    )
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  const progressSource = assignments[0] ?? null;
  const mediaUpdatedBy = progressSource?.progressUpdatedByName?.trim() || null;

  const stages: LifecycleStage[] = [
    {
      key: 'assigned',
      step: 1,
      label: 'Phân công đội',
      at: firstAssignedAt,
      meta: !hasTeams ? 'Chưa có đội được phân công.' : null,
      assignmentItems: hasTeams ? assignItems : undefined,
      state: hasTeams ? 'done' : 'current',
    },
    {
      key: 'accepted',
      step: 2,
      label: 'Đội nhận việc',
      at: firstAcceptedAt,
      meta: acceptedMeta,
      metaTone: anyDeclined && !anyAccepted ? 'danger' : 'default',
      assignmentItems: hasTeams ? acceptItems : undefined,
      state: anyAccepted ? 'done' : hasTeams ? 'current' : 'pending',
    },
    {
      key: 'before',
      step: 3,
      label: 'Bắt đầu xử lý',
      at: latestUploadedAt(media.beforeImages),
      mediaLabel: 'Ảnh trước xử lý',
      mediaEmptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
      images: media.beforeImages,
      updatedByName: media.beforeImages.length > 0 ? mediaUpdatedBy : null,
      state: media.beforeImages.length > 0 ? 'done' : 'pending',
    },
    {
      key: 'progress',
      step: 4,
      label: 'Cập nhật tiến độ',
      at: null,
      mediaLabel: 'Cập nhật tiến độ',
      mediaEmptyHint: 'Chưa có cập nhật tiến độ từ các đội.',
      progressUpdates,
      state: progressUpdates.length > 0 ? 'done' : 'pending',
    },
    {
      key: 'after',
      step: 5,
      label: 'Nghiệm thu hiện trường',
      at: latestUploadedAt(media.afterImages),
      mediaLabel: 'Ảnh sau xử lý',
      mediaEmptyHint: 'Chưa có ảnh nghiệm thu.',
      images: media.afterImages,
      updatedByName: media.afterImages.length > 0 ? mediaUpdatedBy : null,
      state: media.afterImages.length > 0 ? 'done' : 'pending',
    },
    {
      key: 'resolved',
      step: 6,
      label: terminal ? reportStatusLabelVi(status) : 'Đã giải quyết',
      at: nullIso(data.resolvedAt) ?? nullIso(data.closedAt),
      meta: terminal ? `Báo cáo ${reportStatusLabelVi(status)}` : 'Chờ hoàn tất xử lý / nghiệm thu',
      state: terminal ? 'done' : 'pending',
    },
  ];

  const currentIdx = stages.findIndex(s => s.state !== 'done');
  return stages.map((stage, idx) => {
    if (stage.state === 'done') return stage;
    if (currentIdx < 0) return { ...stage, state: 'done' as const };
    if (idx === currentIdx) return { ...stage, state: 'current' as const };
    return { ...stage, state: 'pending' as const };
  });
}

/* ─── Left column: teams / activity / gallery ────────────────────────────── */

function TeamProgressRow({ team }: { team: CompanyAssignmentTeamDetail }) {
  const [expanded, setExpanded] = useState(false);
  const isDeclined = team.status === 'Declined';
  const members = useMemo(
    () => [...team.members].sort((a, b) => Number(b.isLeader) - Number(a.isLeader)),
    [team.members]
  );
  const percent = Math.max(0, Math.min(100, Math.round(team.progressPercent)));

  return (
    <li className="py-3.5 first:pt-1 last:pb-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
              hashColor(team.teamId)
            )}
            aria-hidden
          >
            {getInitials(team.teamName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-1.5">
              <p className="truncate text-sm font-semibold leading-5 text-slate-900">
                {team.teamName}
              </p>
              <span
                className={cn(
                  '-mt-1 inline-flex shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset',
                  ASSIGNMENT_STATUS_BADGE[team.status] ??
                    'bg-slate-100 text-slate-600 ring-slate-200/80'
                )}
              >
                {assignmentStatusLabel(team.status)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Trưởng nhóm: {teamLeaderName(team)}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {teamTaskAcceptanceText(team.status, team.startedAt)}
            </p>
            {!isDeclined ? (
              <div className="mt-2 sm:hidden">
                <TeamRowProgress percent={percent} />
              </div>
            ) : null}
          </div>

          {!isDeclined ? (
            <div className="hidden min-w-0 shrink-0 sm:block sm:w-40 md:w-44">
              <TeamRowProgress percent={percent} />
            </div>
          ) : null}

          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex shrink-0"
          >
            <ChevronDown className="size-4 text-slate-400" aria-hidden />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key={`${team.assignmentId}-members`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 ml-12 border-l border-slate-100 pl-3">
              {team.note ? (
                <p className="mb-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Ghi chú: </span>
                  {team.note}
                </p>
              ) : null}
              {team.progressNote ? (
                <p className="mb-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Tiến độ: </span>
                  {team.progressNote}
                  {team.progressUpdatedByName ? (
                    <span className="text-slate-400"> — {team.progressUpdatedByName}</span>
                  ) : null}
                </p>
              ) : null}
              {team.declineReason ? (
                <p className="mb-2 text-xs text-red-600">{team.declineReason}</p>
              ) : null}
              {members.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">Đội chưa có thành viên.</p>
              ) : (
                <ul className="space-y-2.5 py-1">
                  {members.map(member => (
                    <li key={member.userId} className="flex items-center gap-2.5">
                      {member.avatarUrl ? (
                        <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                          <Image
                            src={member.avatarUrl}
                            alt={member.fullName}
                            fill
                            className="object-cover"
                            sizes="32px"
                            unoptimized
                          />
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
                            hashColor(member.userId)
                          )}
                          aria-hidden
                        >
                          {getInitials(member.fullName)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-1.5">
                          <p className="truncate text-sm font-medium leading-5 text-slate-800">
                            {member.fullName}
                          </p>
                          {member.isLeader ? (
                            <span className="-mt-1 inline-flex shrink-0 rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-semibold leading-4 text-emerald-800 ring-1 ring-inset ring-emerald-200/80">
                              Trưởng nhóm
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

type HistoryActionKind = 'create' | 'update' | 'reject' | 'duplicate' | 'reopen' | 'close';

interface HistoryActionMeta {
  kind: HistoryActionKind;
  badge: string;
  Icon: LucideIcon;
  iconWrap: string;
  badgeClass: string;
}

function historyActionMeta(toStatus: string): HistoryActionMeta {
  switch (toStatus) {
    case 'Submitted':
      return {
        kind: 'create',
        badge: 'TẠO MỚI',
        Icon: FilePlus2,
        iconWrap: 'bg-emerald-50 text-emerald-600',
        badgeClass: 'bg-emerald-50 text-emerald-700',
      };
    case 'Rejected':
      return {
        kind: 'reject',
        badge: 'TỪ CHỐI',
        Icon: XCircle,
        iconWrap: 'bg-red-50 text-red-600',
        badgeClass: 'bg-red-50 text-red-700',
      };
    case 'Duplicate':
      return {
        kind: 'duplicate',
        badge: 'TRÙNG / GỘP',
        Icon: Copy,
        iconWrap: 'bg-red-50 text-red-600',
        badgeClass: 'bg-red-50 text-red-700',
      };
    case 'Reopened':
      return {
        kind: 'reopen',
        badge: 'MỞ LẠI',
        Icon: RotateCcw,
        iconWrap: 'bg-amber-50 text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800',
      };
    case 'Closed':
    case 'ClosedNoViolation':
      return {
        kind: 'close',
        badge: 'ĐÓNG',
        Icon: Check,
        iconWrap: 'bg-slate-100 text-slate-600',
        badgeClass: 'bg-slate-100 text-slate-700',
      };
    case 'Verified':
      return {
        kind: 'update',
        badge: 'CẬP NHẬT',
        Icon: Pencil,
        iconWrap: 'bg-sky-50 text-sky-600',
        badgeClass: 'bg-sky-50 text-sky-700',
      };
    default:
      return {
        kind: 'update',
        badge: 'CẬP NHẬT',
        Icon: RefreshCw,
        iconWrap: 'bg-sky-50 text-sky-600',
        badgeClass: 'bg-sky-50 text-sky-700',
      };
  }
}

function formatHistoryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return `${time} · ${date}`;
}

function ActivityEventRow({
  entry,
  isLast,
}: {
  entry: CompanyAssignmentTimelineEntry;
  isLast: boolean;
}) {
  const note = usefulReason(entry.reason) ?? '';
  const canExpand = note.length > 0;
  const [open, setOpen] = useState(false);
  const meta = historyActionMeta(entry.toStatus);
  const { Icon } = meta;
  const title = reportStatusLabelVi(entry.toStatus);

  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast ? (
        <span
          className="absolute top-8 left-4 z-0 h-[calc(100%-1.25rem)] w-px -translate-x-1/2 bg-slate-200"
          aria-hidden
        />
      ) : null}

      <span
        className={cn(
          'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
          meta.iconWrap
        )}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                  meta.badgeClass
                )}
              >
                {meta.badge}
              </span>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            </div>

            {canExpand && open ? (
              <div className="mt-2.5 space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                {entry.fromStatus ? (
                  <div className="flex justify-between gap-3">
                    <span className="shrink-0 text-slate-500">Từ</span>
                    <span className="text-right font-medium text-slate-800">
                      {reportStatusLabelVi(entry.fromStatus)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span className="shrink-0 text-slate-500">Sang</span>
                  <span className="text-right font-medium text-slate-800">
                    {reportStatusLabelVi(entry.toStatus)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="shrink-0 text-slate-500">Người đổi</span>
                  <span className="text-right font-medium text-slate-800">
                    {entry.changedByName?.trim() || 'Hệ thống'}
                  </span>
                </div>
                <div className="border-t border-slate-200/80 pt-1.5">
                  <p className="text-xs font-medium text-slate-500">Ghi chú</p>
                  <p className="mt-0.5 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-slate-800">
                    {note}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="mt-1.5 text-xs tabular-nums text-slate-500">
              {formatHistoryTime(entry.timestamp)}
              {!canExpand ? (
                <span className="text-slate-400">
                  {' '}
                  · {entry.changedByName?.trim() || 'Hệ thống'}
                </span>
              ) : null}
            </p>
          </div>

          {canExpand ? (
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-expanded={open}
              aria-label={open ? 'Thu gọn chi tiết' : 'Xem chi tiết ghi chú'}
            >
              <ChevronDown
                className={cn('size-4 transition-transform', open && 'rotate-180')}
                aria-hidden
              />
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ActivityTimeline({ items }: { items: CompanyAssignmentTimelineEntry[] }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [items]
  );

  if (sorted.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Chưa có hoạt động trạng thái.</p>;
  }

  return (
    <ol className="relative pt-1 pb-2">
      {sorted.map((entry, index) => (
        <ActivityEventRow
          key={`${entry.timestamp}-${entry.toStatus}-${index}`}
          entry={entry}
          isLast={index === sorted.length - 1}
        />
      ))}
    </ol>
  );
}

function SubmissionGallery({
  images,
  address,
  onPreview,
}: {
  images: CompanyAssignmentMediaItem[];
  address: string;
  onPreview: PreviewHandler;
}) {
  const [showAll, setShowAll] = useState(false);
  const total = images.length;
  const hasMore = total > GALLERY_PREVIEW_MAX;

  const galleryMetaAt = useMemo(() => {
    if (images.length === 0) return null;
    return (
      [...images].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))[0]?.uploadedAt ?? null
    );
  }, [images]);

  const cards = useMemo((): LayoutGridCard[] => {
    const preview = images.slice(0, GALLERY_PREVIEW_MAX);
    return preview.map((img, i) => {
      const isLastPreview = i === preview.length - 1;
      return {
        id: `${img.url}-${i}`,
        thumbnail: img.url,
        className: hero5CardClass(i, preview.length),
        content: (
          <div>
            <p className="text-xl font-bold text-white md:text-2xl">Ảnh {i + 1}</p>
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
              {galleryMetaAt ? (
                <span className="rounded-full bg-black/35 px-2 py-1 text-white/95">
                  {formatCompanyDateTime(galleryMetaAt)}
                </span>
              ) : null}
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
  }, [images, total, hasMore, galleryMetaAt]);

  if (total === 0) {
    return (
      <Card className="relative flex h-64 items-center justify-center overflow-hidden border-dashed shadow-none">
        <CardContent className="space-y-2 p-0 text-center text-sm text-muted-foreground">
          <ImageIcon className="mx-auto size-8 opacity-40" aria-hidden />
          <p>Không có hình ảnh gửi báo cáo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative h-[min(42vh,360px)] w-full overflow-hidden rounded-xl bg-white">
        <LayoutGrid cards={cards} variant="hero5" className="h-full gap-1 p-0" />
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="flex h-[92vh] max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogDescription className="sr-only">
            Hộp thoại xem tất cả hình ảnh gửi báo cáo theo dạng lưới.
          </DialogDescription>
          <DialogHeader className="shrink-0 space-y-0 border-b px-12 py-4 text-center">
            <DialogTitle className="truncate text-center text-sm font-semibold tracking-tight text-foreground md:text-base">
              {address?.trim() || 'Hình ảnh gửi báo cáo'}
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
                <ClickableImage
                  key={`${img.url}-${i}`}
                  url={img.url}
                  label={`Ảnh ${i + 1}`}
                  uploadedAt={img.uploadedAt}
                  onPreview={image => {
                    setShowAll(false);
                    onPreview(image);
                  }}
                  showTimestamp={false}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="aspect-4/3 w-full rounded-lg"
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportInfoCard({
  data,
  onPreview,
}: {
  data: CompanyAssignmentDetail;
  onPreview: PreviewHandler;
}) {
  const [declineDrawerOpen, setDeclineDrawerOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const assignment = data.assignment;
  const isDeclined = assignment?.status === 'Declined';
  const declineReason = usefulReason(assignment?.declineReason);
  const status = normalizeReportStatus(data.status) as ReportStatus;
  const statusBadge =
    REPORT_STATUS_BADGE_CLASSES[status] ?? 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80';

  const resolveDueAt = data.sla.resolveDueAt;
  const slaBreached = Boolean(nullIso(resolveDueAt)) && data.sla.isBreached;

  const hasCoords = hasValidCoords(data.latitude, data.longitude);
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    : null;

  const teamTooltipItems = useMemo(
    () =>
      data.teamAssignments.map((team, idx) => ({
        id: idx + 1,
        name: team.teamName,
        designation: `Trưởng nhóm: ${teamLeaderName(team)} · ${assignmentStatusLabel(team.status)}`,
        initials: getInitials(team.teamName),
        fallbackClassName: hashColor(team.teamId),
      })),
    [data.teamAssignments]
  );

  return (
    <div className="flex flex-col">
      <SubmissionGallery images={data.reportImages} address={data.address} onPreview={onPreview} />

      <div className="pt-5">
        <div className="flex min-w-0 items-start gap-1.5">
          <h1 className="min-w-0 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
            {data.categoryName || 'Báo cáo môi trường'}
          </h1>
          {data.severity ? (
            <span
              className={cn(
                '-mt-1 inline-flex shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset',
                queueSeverityClasses(data.severity)
              )}
            >
              {queueSeverityLabel(data.severity)}
            </span>
          ) : null}
        </div>
        {data.code ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">{data.code}</p>
        ) : null}

        <div className="mt-5 space-y-4">
          <MetaRow icon={CircleDot} label="Trạng thái">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                statusBadge
              )}
            >
              <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
              {reportStatusLabelVi(data.status)}
            </span>
          </MetaRow>

          <MetaRow icon={MapPin} label="Địa chỉ">
            {data.address?.trim() ? (
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-5 text-foreground">
                {data.address.trim()}
              </p>
            ) : (
              <p className="text-sm leading-5 text-muted-foreground">Chưa có địa chỉ</p>
            )}
          </MetaRow>

          <MetaRow icon={CalendarDays} label="Hạn xử lý">
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm font-medium tabular-nums',
                  slaBreached ? 'text-red-600' : 'text-foreground'
                )}
              >
                {nullIso(resolveDueAt) ? formatCompanyDateTime(resolveDueAt) : 'Không áp dụng'}
              </p>
              {nullIso(resolveDueAt) ? (
                <p
                  className={cn(
                    'mt-0.5 text-xs',
                    slaBreached ? 'font-medium text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {formatSlaRemaining(data.sla.hoursRemaining)}
                  {slaBreached ? ' · Đã vi phạm SLA' : ''}
                </p>
              ) : null}
            </div>
          </MetaRow>

          <MetaRow icon={Users} label="Đội phụ trách">
            {teamTooltipItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa phân công</p>
            ) : (
              <AnimatedTooltip items={teamTooltipItems} avatarClassName="size-8" />
            )}
          </MetaRow>

          {data.description?.trim() ? (
            <MetaRow icon={AlignLeft} label="Mô tả" align="start">
              <ExpandableDescription text={data.description} />
            </MetaRow>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="progress" className="mt-7 w-full overflow-visible">
        <TabsList className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {(
            [
              ['progress', 'Tiến độ'],
              ['activity', 'Lịch sử hoạt động'],
              ['map', 'Bản đồ'],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'relative h-auto rounded-none border-0 bg-transparent px-0 pb-2.5 pt-0 text-sm font-medium text-muted-foreground shadow-none',
                'data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:bg-brand after:transition-transform',
                'data-[state=active]:after:scale-x-100'
              )}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="progress" className="mt-5 focus-visible:ring-0">
          <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Tiến độ đội phụ trách</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {data.assignment?.assignedByName?.trim() ||
                data.teamAssignments[0]?.assignedByName?.trim() ? (
                  <>
                    Tiến độ và trạng thái xử lý của đội được phân công{' '}
                    <span className="font-semibold text-foreground/80">
                      bởi quản lý{' '}
                      {data.assignment?.assignedByName?.trim() ||
                        data.teamAssignments[0]?.assignedByName?.trim()}
                    </span>
                  </>
                ) : (
                  'Tiến độ và trạng thái xử lý của đội được phân công'
                )}
              </p>
            </div>
            {isDeclined ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeclineDrawerOpen(true)}
                className={cn(
                  'h-8 shrink-0 cursor-pointer gap-1.5 border-red-200 bg-red-50 px-2.5',
                  'text-[0.8125rem] font-semibold text-red-700',
                  'transition-colors duration-200',
                  'hover:border-red-300 hover:bg-red-100 hover:text-red-800',
                  'focus-visible:ring-2 focus-visible:ring-red-400/40'
                )}
                aria-haspopup="dialog"
                aria-expanded={declineDrawerOpen}
              >
                <MessageSquareWarning className="size-3.5" aria-hidden />
                Lý do từ chối
              </Button>
            ) : null}
          </div>
          {data.teamAssignments.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Chưa có đội được phân công.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {data.teamAssignments.map(team => (
                <TeamProgressRow key={team.assignmentId} team={team} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5 overflow-visible focus-visible:ring-0">
          <ActivityTimeline items={data.timeline} />
        </TabsContent>

        <TabsContent value="map" className="mt-5 focus-visible:ring-0">
          {hasCoords && googleMapsUrl ? (
            <div className="rounded-xl bg-muted/40 px-4 py-8 text-center">
              {data.address ? (
                <p className="mx-auto mb-3 flex max-w-md items-start justify-center gap-1.5 text-left text-sm text-foreground/85">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 whitespace-pre-wrap wrap-break-word">
                    {data.address}
                  </span>
                </p>
              ) : null}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand tabular-nums hover:underline"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Mở Google Maps · {data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}
              </a>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-muted/40 px-4 text-center">
              {data.address ? (
                <>
                  <p className="flex max-w-md items-start gap-1.5 text-left text-sm text-foreground/85">
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 whitespace-pre-wrap wrap-break-word">
                      {data.address}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chưa có tọa độ để hiển thị bản đồ.
                  </p>
                </>
              ) : (
                <>
                  <MapPin className="size-5 text-muted-foreground/50" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    Chưa có tọa độ để hiển thị bản đồ.
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DeclineReasonDrawer
        open={declineDrawerOpen}
        onOpenChange={setDeclineDrawerOpen}
        assignment={assignment}
        declineReason={declineReason}
        onReassign={() => {
          setDeclineDrawerOpen(false);
          setReassignOpen(true);
        }}
      />

      <CompanyAssignTeamDialog
        open={reassignOpen}
        reportId={data.reportId}
        reportCode={data.code}
        mode="reassign"
        oldTeamId={assignment?.teamId ?? null}
        oldTeamName={assignment?.teamName ?? null}
        onClose={() => setReassignOpen(false)}
        onSuccess={() => setReassignOpen(false)}
      />
    </div>
  );
}

/**
 * Drawer — manager xem lý do đội từ chối task trước khi phân công lại.
 * Bố cục: trạng thái → đội → memo lý do → meta → CTA.
 */
function DeclineReasonDrawer({
  open,
  onOpenChange,
  assignment,
  declineReason,
  onReassign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CompanyAssignmentTeamDetail | null;
  declineReason: string | null;
  onReassign: () => void;
}) {
  const teamName = assignment?.teamName?.trim() || '—';
  const leader = assignment ? teamLeaderName(assignment) : '—';
  const assignedBy = assignment?.assignedByName?.trim() || null;
  const assignedAt = assignment ? nullIso(assignment.assignedAt) : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full max-h-none w-full max-w-md flex-col border-l border-slate-200 bg-[#fffdfc]">
        <DrawerHeader className="space-y-0 border-b border-slate-200 px-0 py-0 text-left">
          <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-red-50 via-red-50/60 to-transparent px-5 pb-4 pt-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 ring-1 ring-red-200/80"
                  aria-hidden
                >
                  <MessageSquareWarning className="size-4" />
                </span>
                <div className="min-w-0">
                  <DrawerTitle className="text-base font-bold tracking-tight text-slate-900">
                    Lý do từ chối
                  </DrawerTitle>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">
                    Đội đã từ chối task — xem trước khi phân công lại
                  </p>
                </div>
              </div>
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Đóng"
                className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors duration-200 hover:bg-white/80 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
              >
                <X className="size-4" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="scrollbar-smooth min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Đội phụ trách */}
          <section>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Đội phụ trách
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                  hashColor(assignment?.teamId ?? teamName)
                )}
                aria-hidden
              >
                {getInitials(teamName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{teamName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">Trưởng nhóm: {leader}</p>
              </div>
            </div>
          </section>

          {/* Memo lý do — nội dung chính quản lý cần đọc */}
          <section role="note" aria-label="Nội dung lý do từ chối">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 shrink-0 text-red-600" aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
                Nội dung từ chối
              </p>
            </div>
            <blockquote className="mt-3 border-l-2 border-red-300 pl-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                {declineReason || 'Không có lý do được ghi nhận.'}
              </p>
            </blockquote>
          </section>

          {/* Meta phân công */}
          {(assignedBy || assignedAt) && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {assignedBy ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Phân công bởi
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-slate-800">{assignedBy}</p>
                </div>
              ) : null}
              {assignedAt ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Thời điểm phân công
                  </p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-slate-800">
                    {formatCompanyDateTime(assignedAt)}
                  </p>
                </div>
              ) : null}
            </section>
          )}
        </div>

        <DrawerFooter className="gap-2 border-t border-slate-200 bg-white px-5 py-4">
          <p className="text-xs leading-snug text-slate-500">
            Phân công lại sẽ chọn đội mới cho báo cáo này.
          </p>
          <Button
            type="button"
            className="h-11 cursor-pointer bg-emerald-600 text-white transition-colors duration-200 hover:bg-emerald-700"
            onClick={onReassign}
          >
            <UserPlus className="mr-1.5 size-4" aria-hidden />
            Phân công lại
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── Shell / scrollbar / skeleton ───────────────────────────────────────── */

function OuterRailScrollbar({
  scrollRef,
  visible,
}: {
  scrollRef: RefObject<HTMLElement | null>;
  visible: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ thumbH: 0, thumbTop: 0, needed: false });
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const { clientHeight, scrollHeight, scrollTop } = el;
      const needed = scrollHeight > clientHeight + 1;
      if (!needed) {
        setMetrics({ thumbH: 0, thumbTop: 0, needed: false });
        return;
      }
      const trackH = trackRef.current?.clientHeight ?? clientHeight;
      const ratio = clientHeight / scrollHeight;
      const thumbH = Math.max(28, Math.round(trackH * ratio));
      const maxTop = Math.max(0, trackH - thumbH);
      const maxScroll = scrollHeight - clientHeight;
      const thumbTop = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * maxTop) : 0;
      setMetrics({ thumbH, thumbTop, needed: true });
    };

    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => {
      el.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, [scrollRef, visible]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!drag || !el || !track) return;
      const trackH = track.clientHeight;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const thumbH = Math.max(28, Math.round(trackH * (el.clientHeight / el.scrollHeight)));
      const maxTop = Math.max(0, trackH - thumbH);
      if (maxTop <= 0 || maxScroll <= 0) return;
      const delta = e.clientY - drag.startY;
      el.scrollTop = drag.startScrollTop + (delta / maxTop) * maxScroll;
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [scrollRef]);

  const show = visible && metrics.needed;

  return (
    <div
      ref={trackRef}
      className={cn(
        'pointer-events-none absolute inset-y-2 right-0 z-30 hidden w-2.5 lg:block',
        'transition-opacity duration-200',
        show ? 'pointer-events-auto opacity-100' : 'opacity-0'
      )}
      aria-hidden={!show}
      onPointerDown={e => {
        if (!show) return;
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect = track.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const trackH = track.clientHeight;
        const thumbH = metrics.thumbH;
        const maxTop = Math.max(0, trackH - thumbH);
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (y < metrics.thumbTop || y > metrics.thumbTop + thumbH) {
          const ratio = maxTop > 0 ? (y - thumbH / 2) / maxTop : 0;
          el.scrollTop = Math.min(maxScroll, Math.max(0, ratio * maxScroll));
        }
      }}
    >
      <div
        role="presentation"
        className="absolute inset-x-0.5 cursor-pointer rounded-full bg-slate-300/80 hover:bg-slate-400/90"
        style={{ height: metrics.thumbH, transform: `translateY(${metrics.thumbTop}px)` }}
        onPointerDown={e => {
          e.stopPropagation();
          const el = scrollRef.current;
          if (!el) return;
          dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
      />
    </div>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pt-0 sm:px-6 lg:px-8"
      aria-busy
      aria-label="Đang tải chi tiết báo cáo"
    >
      <div className="-mx-4 -mt-1 mb-4 flex shrink-0 items-center gap-3 px-4 sm:-mx-6 sm:px-6 md:-mt-2 lg:-mx-8 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 cursor-pointer px-2 text-sm hover:bg-muted"
          onClick={onBack}
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Quay lại
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 sm:pb-14 lg:overflow-hidden lg:pb-0">
        <div className="grid h-full min-h-0 w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[6fr_1px_4fr] lg:gap-6">
          <aside className="min-w-0 space-y-5 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-8">
            <Skeleton className="h-[min(42vh,360px)] w-full rounded-xl" />
            <div className="space-y-3 pt-1">
              <Skeleton className="h-7 w-56 max-w-full sm:h-8 sm:w-72" />
              <Skeleton className="h-4 w-36 max-w-full" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-8 w-40 max-w-full rounded-full" />
            </div>
            <div className="flex gap-6 border-b border-border pb-2.5 pt-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="space-y-3 pt-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64 max-w-full" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </aside>

          <div className="hidden bg-border lg:block" aria-hidden />

          <div className="min-w-0 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-4 lg:pt-3 lg:pb-8">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailShell({ data, onBack }: { data: CompanyAssignmentDetail; onBack: () => void }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activePane, setActivePane] = useState<'left' | 'right'>('right');
  const leftScrollRef = useRef<HTMLElement | null>(null);

  const lifecycleStages = useMemo(() => buildCompanyLifecycleStages(data), [data]);

  const allImages = useMemo((): PreviewImage[] => {
    const map = (items: CompanyAssignmentMediaItem[], label: string) =>
      items.map(img => ({ url: img.url, label, uploadedAt: img.uploadedAt }));

    const assignments = data.assignment != null ? [data.assignment] : data.teamAssignments;
    const progressUpdateImages = assignments.flatMap(a =>
      (a.progressUpdates ?? []).flatMap(u =>
        u.images.map(img => ({
          url: img.url,
          label: 'Cập nhật tiến độ',
          uploadedAt: img.uploadedAt,
        }))
      )
    );

    return [
      ...map(data.reportImages, 'Ảnh gửi báo cáo'),
      ...map(data.media.beforeImages, 'Ảnh trước xử lý'),
      ...(progressUpdateImages.length > 0
        ? progressUpdateImages
        : map(data.media.progressImages, 'Cập nhật tiến độ')),
      ...map(data.media.afterImages, 'Nghiệm thu hiện trường'),
    ];
  }, [data.assignment, data.teamAssignments, data.reportImages, data.media]);

  const handlePreview = (image: PreviewImage) => {
    const idx = allImages.findIndex(
      item => item.url === image.url && item.uploadedAt === image.uploadedAt
    );
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pt-0 sm:px-6 lg:px-8">
      <ImagePreviewDialog
        images={allImages}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      <div className="-mx-4 -mt-1 mb-4 flex shrink-0 items-center gap-3 px-4 sm:-mx-6 sm:px-6 md:-mt-2 lg:-mx-8 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 cursor-pointer px-2 text-sm hover:bg-muted"
          onClick={onBack}
        >
          <ArrowLeft className="mr-1 size-3.5" />
          Quay lại
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 sm:pb-14 lg:overflow-hidden lg:pb-0">
        <div className="grid h-full min-h-0 w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[6fr_1px_4fr] lg:gap-6">
          <aside
            ref={leftScrollRef}
            onMouseEnter={() => setActivePane('left')}
            onFocusCapture={() => setActivePane('left')}
            onWheel={() => setActivePane('left')}
            className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-8 lg:scrollbar-hide"
          >
            <ReportInfoCard data={data} onPreview={handlePreview} />
          </aside>

          <div className="hidden bg-border lg:block" aria-hidden />

          <div
            onMouseEnter={() => setActivePane('right')}
            onFocusCapture={() => setActivePane('right')}
            onWheel={() => setActivePane('right')}
            className={cn(
              'min-w-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:px-4 lg:pt-3 lg:pb-8',
              activePane === 'right' ? 'lg:scrollbar-smooth' : 'lg:scrollbar-hide'
            )}
          >
            <SectionBlock title="Tiến trình xử lý">
              <div className="overflow-visible px-0.5 pt-1">
                <LifecycleSpine stages={lifecycleStages} onPreview={handlePreview} />
              </div>
            </SectionBlock>
          </div>
        </div>

        <OuterRailScrollbar scrollRef={leftScrollRef} visible={activePane === 'left'} />
      </div>
    </div>
  );
}

/* ─── Root export ────────────────────────────────────────────────────────── */

export function CompanyTrackingDetailTab({ reportId, onBack }: CompanyTrackingDetailTabProps) {
  const { data, isPending, isError, refetch, isFetching } = useCompanyAssignmentDetail(reportId);

  if (isPending) {
    return <DetailSkeleton onBack={onBack} />;
  }

  if (isError || !data) {
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-destructive">Không tải được chi tiết báo cáo.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-1.5 size-4" />
            Quay lại
          </Button>
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            <RefreshCw className={cn('mr-1.5 size-4', isFetching && 'animate-spin')} />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return <DetailShell data={data} onBack={onBack} />;
}
