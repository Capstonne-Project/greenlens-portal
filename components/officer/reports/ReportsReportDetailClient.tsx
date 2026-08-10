'use client';

import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  formatReportImageDateTime,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { ReassignTeamDialog } from '@/components/officer/tracking/ReassignTeamDialog';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReportDetail, useReportProgress } from '@/hooks/useReport';
import { useTeamDetail } from '@/hooks/useTeams';
import type {
  ReportProgress,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressStatusHistory,
} from '@/lib/api/models/reportProgress';
import type { ReportStatus } from '@/lib/api/models/report';
import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { REPORT_STATUS_BADGE_CLASSES, reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  AlignLeft,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Copy,
  ExternalLink,
  FilePlus2,
  ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  RotateCcw,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-56 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

interface ReportsReportDetailClientProps {
  reportId: string;
  onBack: () => void;
}

const AVATAR_COLORS = [
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-emerald-200 text-emerald-800',
  'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800',
] as const;

/** Thứ tự vòng đời báo cáo — dùng suy trạng thái spine (done / current / pending). */
const REPORT_STATUS_ORDER: ReportStatus[] = [
  'Submitted',
  'Verified',
  'Dispatched',
  'Assigned',
  'InProgress',
  'Resolved',
  'Closed',
];

type LifecycleState = 'done' | 'current' | 'pending';

interface MediaStageImage {
  url: string;
  uploadedAt?: string;
}

/**
 * Một mốc trên cột phải. `media` gắn minh chứng vào đúng giai đoạn sinh ra nó;
 * caption từng ảnh dùng `uploadedAt` (API progress không có mô tả text riêng).
 */
interface LifecycleStage {
  key: string;
  step: number;
  label: string;
  at: string | null;
  meta?: string | null;
  /** Step phân công / nhận việc: avatar + tên đội + dòng phụ (điều phối / thời gian). */
  assignmentItems?: {
    assignmentId: string;
    teamId: string;
    teamName: string;
    subtitle?: string | null;
  }[];
  mediaLabel?: string;
  mediaEmptyHint?: string;
  images?: MediaStageImage[];
  /** Ghi chú hiển thị dưới ảnh (step Cập nhật tiến độ). */
  noteBelowMedia?: string | null;
  state: LifecycleState;
}

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

function nullIso(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
}

function formatSlaRemaining(hours: number): string {
  if (hours < 0) return `Quá hạn ${Math.abs(hours)} giờ`;
  if (hours < 24) return `Còn ${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `Còn ${days} ngày`;
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

function latestUploadedAt(images: ReportProgressImage[]): string | null {
  if (images.length === 0) return null;
  return (
    [...images].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)).at(-1)?.uploadedAt ?? null
  );
}

function statusRank(status: ReportStatus): number {
  const idx = REPORT_STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : -1;
}

/** Thanh tiến độ ngang — dùng trong mỗi hàng đội (tab Tiến độ). */
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

/**
 * Mô tả giữ nguyên xuống dòng / khoảng trắng từ BE.
 * Mặc định 2 dòng; dài → «Xem thêm» với height slide + fade nhẹ.
 */
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
            className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words"
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

/**
 * Timeline tiến trình — typography + pulse mốc hiện tại đồng bộ InvestigationTimeline
 * (InspectionDetailClient): node size-8, rail brand, `media-step-pulse-ring`.
 */
function LifecycleSpine({
  stages,
  onPreview,
}: {
  stages: LifecycleStage[];
  onPreview: ReportPreviewHandler;
}) {
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
                  className="pointer-events-none absolute inset-0 z-0 rounded-full bg-brand/30 media-step-pulse-ring"
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
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h3
                    className={cn(
                      'text-sm font-semibold',
                      isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                    )}
                  >
                    {stage.label}
                  </h3>
                  {isCurrent ? (
                    <span className="inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                      Hiện tại
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums text-slate-500">
                  {stage.at ? (
                    formatDateTime(stage.at)
                  ) : isDone ? (
                    '—'
                  ) : (
                    <span className="italic text-slate-400">Chưa thực hiện</span>
                  )}
                </span>
              </div>

              {stage.meta ? (
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500">
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
                        {item.subtitle?.trim() ? (
                          <p className="mt-0.5 text-xs text-slate-500">{item.subtitle.trim()}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasMedia ? (
                <div className="mt-2.5">
                  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                    {stage.mediaLabel}
                    <span className="ml-1.5 tabular-nums">({images.length})</span>
                  </p>
                  {images.length === 0 ? (
                    <p className="mt-1.5 text-sm text-slate-400 italic">{stage.mediaEmptyHint}</p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {images.map(img => (
                        <li key={`${img.url}-${img.uploadedAt}`} className="w-20 sm:w-24">
                          <ClickableReportImage
                            url={img.url}
                            label={stage.mediaLabel ?? stage.label}
                            uploadedAt={img.uploadedAt}
                            onPreview={onPreview}
                            showTimestamp={false}
                            className="aspect-square w-full rounded-lg"
                          />
                          {img.uploadedAt ? (
                            <p className="mt-1 text-center text-[11px] leading-snug text-slate-500 tabular-nums">
                              {formatReportImageDateTime(img.uploadedAt)}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  {stage.noteBelowMedia?.trim() ? (
                    <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-600 whitespace-pre-wrap wrap-break-word">
                      <span className="font-semibold text-slate-700">Ghi chú: </span>
                      {stage.noteBelowMedia.trim()}
                    </p>
                  ) : null}
                </div>
              ) : stage.noteBelowMedia?.trim() ? (
                <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-600 whitespace-pre-wrap wrap-break-word">
                  <span className="font-semibold text-slate-700">Ghi chú: </span>
                  {stage.noteBelowMedia.trim()}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const ASSIGNMENT_STATUS_BADGE: Record<string, string> = {
  Assigned: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  InProgress: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  Completed: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  Declined: 'bg-red-50 text-red-700 ring-red-200/80',
};

/** Hàng đội — avatar + tên + trưởng nhóm · progress / phân công lại · chevron members. */
function TeamProgressRow({
  assignment,
  reportId,
  reportCode,
}: {
  assignment: ReportProgressAssignment;
  reportId: string;
  reportCode: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const isDeclined = assignment.status === 'Declined';
  const statusLabel = ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status;

  const {
    data: teamDetail,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useTeamDetail(expanded ? assignment.teamId : null);

  const members = useMemo(
    () => [...(teamDetail?.members ?? [])].sort((a, b) => Number(b.isLeader) - Number(a.isLeader)),
    [teamDetail?.members]
  );

  const percent = Math.max(0, Math.min(100, Math.round(assignment.progressPercent)));

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
              hashColor(assignment.teamId)
            )}
            aria-hidden
          >
            {getInitials(assignment.teamName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-1.5">
              <p className="truncate text-sm font-semibold leading-5 text-slate-900">
                {assignment.teamName}
              </p>
              <span
                className={cn(
                  '-mt-1 inline-flex shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset',
                  ASSIGNMENT_STATUS_BADGE[assignment.status] ??
                    'bg-slate-100 text-slate-600 ring-slate-200/80'
                )}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              Trưởng nhóm: {assignment.teamLeaderName?.trim() || '—'}
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

          {expanded ? (
            <ChevronUp className="size-4 shrink-0 text-slate-400" aria-hidden />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
          )}
        </button>

        {isDeclined ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 cursor-pointer border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={() => setReassignOpen(true)}
          >
            Phân công lại
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-3 ml-12 border-l border-slate-100 pl-3">
          {isPending ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Đang tải thành viên…
            </div>
          ) : isError ? (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <p className="text-xs text-destructive">Không tải được danh sách thành viên.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="text-xs font-medium text-brand hover:underline"
              >
                {isFetching ? 'Đang thử lại…' : 'Thử lại'}
              </button>
            </div>
          ) : members.length === 0 ? (
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
                    <p className="truncate text-sm font-medium text-slate-800">
                      {member.fullName}
                      {member.isLeader ? (
                        <span className="ml-1.5 text-[11px] font-semibold text-emerald-700">
                          Leader
                        </span>
                      ) : null}
                    </p>
                    {member.email ? (
                      <p className="truncate text-xs text-slate-500">{member.email}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <ReassignTeamDialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        reportId={reportId}
        reportCode={reportCode}
        oldTeam={{
          teamId: assignment.teamId,
          teamName: assignment.teamName,
          teamType: assignment.teamType,
        }}
      />
    </li>
  );
}

/**
 * Timeline tiến trình (cột phải) — không gồm statusHistory (lịch sử nằm cột trái).
 * Phân công (assignedAt) → Đội nhận (acceptedAt) → Ảnh trước → Tiến độ → Ảnh sau.
 */
function buildTrackingStages(data: ReportProgress): LifecycleStage[] {
  const { media, assignment, status } = data;
  const rank = statusRank(status);
  const terminal =
    status === 'Rejected' ||
    status === 'Duplicate' ||
    status === 'Closed' ||
    status === 'ClosedNoViolation' ||
    status === 'PenaltyIssued';

  const stateFor = (
    minRank: number,
    opts?: { forceDone?: boolean; forceCurrent?: boolean }
  ): LifecycleState => {
    if (opts?.forceDone) return 'done';
    if (opts?.forceCurrent) return 'current';
    if (terminal && rank >= minRank) return 'done';
    if (rank < 0) return 'pending';
    if (rank > minRank) return 'done';
    if (rank === minRank) return 'current';
    return 'pending';
  };

  const hasAssignment = Boolean(assignment);
  const firstAssignedAt = assignment?.assignedAt ?? null;
  const firstAcceptedAt = assignment?.acceptedAt ?? null;
  const anyAccepted = Boolean(assignment?.acceptedAt);

  const assignItems = assignment
    ? [
        {
          assignmentId: assignment.assignmentId,
          teamId: assignment.teamId,
          teamName: assignment.teamName,
          subtitle: assignment.assignedByName?.trim()
            ? `Điều phối bởi ${assignment.assignedByName.trim()}`
            : null,
        },
      ]
    : [];

  const acceptItems = assignment
    ? [
        {
          assignmentId: assignment.assignmentId,
          teamId: assignment.teamId,
          teamName: assignment.teamName,
          subtitle: assignment.acceptedAt
            ? assignment.teamLeaderName?.trim()
              ? `Được nhận bởi ${assignment.teamLeaderName.trim()}`
              : 'Đã nhận việc'
            : assignment.status === 'Declined'
              ? 'Đã từ chối'
              : 'Chưa nhận việc',
        },
      ]
    : [];

  const progressImages = assignment?.progressUpdates.flatMap(u => u.images) ?? [];
  const progressNotes = (assignment?.progressUpdates ?? [])
    .map(u => u.progressNote?.trim())
    .filter((n): n is string => Boolean(n));
  const latestProgressAt =
    progressImages.length > 0
      ? latestUploadedAt(progressImages)
      : (assignment?.progressUpdatedAt ?? null);

  const stages: LifecycleStage[] = [
    {
      key: 'assigned',
      step: 1,
      label: 'Phân công đội',
      at: nullIso(firstAssignedAt),
      meta: !hasAssignment ? 'Chưa có đội được phân công.' : null,
      assignmentItems: hasAssignment ? assignItems : undefined,
      state: stateFor(statusRank('Assigned'), {
        forceDone: hasAssignment,
        forceCurrent: !hasAssignment && status === 'Dispatched',
      }),
    },
    {
      key: 'accepted',
      step: 2,
      label: 'Đội nhận việc',
      at: nullIso(firstAcceptedAt),
      meta: !hasAssignment ? null : !anyAccepted ? 'Chưa có đội nào nhận việc.' : null,
      assignmentItems: hasAssignment ? acceptItems : undefined,
      state: stateFor(statusRank('Assigned'), {
        forceDone: anyAccepted,
        forceCurrent: hasAssignment && !anyAccepted,
      }),
    },
    {
      key: 'before',
      step: 3,
      label: 'Bắt đầu xử lý',
      at: latestUploadedAt(media.beforeImages),
      mediaLabel: 'Ảnh trước xử lý',
      mediaEmptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
      images: media.beforeImages,
      state:
        media.beforeImages.length > 0
          ? 'done'
          : stateFor(statusRank('Assigned'), {
              forceCurrent: status === 'Assigned' || status === 'InProgress',
            }),
    },
    {
      key: 'progress',
      step: 4,
      label: 'Cập nhật tiến độ',
      at: nullIso(latestProgressAt),
      noteBelowMedia: progressNotes.length > 0 ? progressNotes.join('\n') : null,
      mediaLabel: 'Ảnh tiến độ',
      mediaEmptyHint: 'Chưa có ảnh cập nhật từ các đội.',
      images: progressImages,
      state:
        progressImages.length > 0
          ? 'done'
          : stateFor(statusRank('InProgress'), {
              forceCurrent: status === 'InProgress',
            }),
    },
    {
      key: 'after',
      step: 5,
      label: 'Nghiệm thu hiện trường',
      at: latestUploadedAt(media.afterImages),
      mediaLabel: 'Ảnh sau xử lý',
      mediaEmptyHint: 'Chưa có ảnh nghiệm thu.',
      images: media.afterImages,
      state:
        media.afterImages.length > 0
          ? 'done'
          : stateFor(statusRank('Resolved'), {
              forceCurrent: status === 'Resolved',
            }),
    },
  ];

  // Một mốc "current" duy nhất — giống InspectionDetailClient (first pending).
  const currentIdx = stages.findIndex(s => s.state !== 'done');
  return stages.map((stage, idx) => {
    if (stage.state === 'done') return stage;
    if (currentIdx < 0) return { ...stage, state: 'done' as const };
    if (idx === currentIdx) return { ...stage, state: 'current' as const };
    return { ...stage, state: 'pending' as const };
  });
}

/**
 * Tab Hoạt động — audit timeline theo UI mẫu + statusHistory (mới nhất trước).
 * Active step KHÔNG suy từ history — chỉ render sự kiện from→to.
 *
 * Expand accordion chỉ khi có `note` (theo lựa chọn UX).
 */

type HistoryActionKind = 'create' | 'update' | 'reject' | 'duplicate' | 'reopen' | 'close';

interface HistoryActionMeta {
  kind: HistoryActionKind;
  badge: string;
  Icon: LucideIcon;
  iconWrap: string;
  badgeClass: string;
}

function historyActionMeta(toStatus: ReportStatus | string): HistoryActionMeta {
  const status = String(toStatus);
  switch (status) {
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
      // InProgress, Resolved, Dispatched, Assigned, PenaltyIssued, …
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
  entry: ReportProgressStatusHistory;
  isLast: boolean;
}) {
  const note = entry.note?.trim() ?? '';
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
                <div className="flex justify-between gap-3">
                  <span className="shrink-0 text-slate-500">Từ</span>
                  <span className="text-right font-medium text-slate-800">
                    {reportStatusLabelVi(entry.fromStatus)}
                  </span>
                </div>
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
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                    {note}
                  </p>
                </div>
              </div>
            ) : null}

            <p className="mt-1.5 text-xs tabular-nums text-slate-500">
              {formatHistoryTime(entry.changedAt)}
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

/**
 * Lịch sử sự kiện từ `statusHistory` — cũ nhất trước, tăng dần theo thời gian.
 * Không dùng history để suy active step.
 */
function ActivityTimeline({ items }: { items: ReportProgressStatusHistory[] }) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.changedAt.localeCompare(b.changedAt)),
    [items]
  );

  if (sorted.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Chưa có hoạt động trạng thái.</p>;
  }

  return (
    <ol className="relative pt-1 pb-2">
      {sorted.map((entry, index) => (
        <ActivityEventRow
          key={`${entry.changedAt}-${entry.toStatus}-${index}`}
          entry={entry}
          isLast={index === sorted.length - 1}
        />
      ))}
    </ol>
  );
}

function ReportInfoCard({
  data,
  mapLat,
  mapLng,
  hasCoords,
  isDetailPending,
  googleMapsUrl,
}: {
  data: ReportProgress;
  mapLat: number | undefined;
  mapLng: number | undefined;
  hasCoords: boolean;
  isDetailPending: boolean;
  googleMapsUrl: string | null;
}) {
  const heroUrl =
    data.media.submissionImages[0]?.url ??
    data.media.beforeImages[0]?.url ??
    data.media.afterImages[0]?.url ??
    null;

  const statusBadge =
    REPORT_STATUS_BADGE_CLASSES[data.status] ?? 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80';

  const isMergedDuplicate = data.status === 'Duplicate';
  const resolveDueAt = data.sla.resolveDueAt;
  const slaBreached = !isMergedDuplicate && Boolean(resolveDueAt) && data.sla.isBreached;

  const teamTooltipItems = useMemo(() => {
    const a = data.assignment;
    if (!a) return [];
    return [
      {
        id: 1,
        name: a.teamName,
        designation: `Trưởng nhóm: ${a.teamLeaderName}`,
        initials: getInitials(a.teamName),
        fallbackClassName: hashColor(a.teamId),
      },
    ];
  }, [data.assignment]);

  return (
    <div className="flex flex-col">
      {/* Hero — chỉ ảnh, không overlay code/ward */}
      <div className="relative aspect-video max-h-52 w-full overflow-hidden rounded-xl bg-muted">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={data.categoryName || 'Báo cáo'}
            fill
            sizes="(max-width: 1024px) 100vw, 58rem"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8 opacity-40" aria-hidden />
          </div>
        )}
      </div>

      <div className="pt-5">
        <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          {data.categoryName || 'Báo cáo môi trường'}
        </h1>

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

          {/* Địa chỉ — ngay sau trạng thái: định vị hiện trường trước hạn / đội */}
          <MetaRow icon={MapPin} label="Địa chỉ">
            {data.address?.trim() ? (
              <p className="text-sm leading-5 text-foreground whitespace-pre-wrap break-words">
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
                {isMergedDuplicate || !resolveDueAt
                  ? 'Không áp dụng'
                  : formatDateTime(resolveDueAt)}
              </p>
              {!isMergedDuplicate && resolveDueAt ? (
                <p
                  className={cn(
                    'mt-0.5 text-xs',
                    slaBreached ? 'font-medium text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {formatSlaRemaining(data.sla.hoursRemaining)}
                  {slaBreached ? ' · Đã vi phạm SLA' : ''}
                </p>
              ) : isMergedDuplicate ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Đã gộp vào báo cáo gốc</p>
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

      {/*
        IA 3 tab (enterprise):
        1. Tiến độ  ≈ Subtasks — checklist đội + note/blocker
        2. Hoạt động ≈ Activities — statusHistory
        3. Bản đồ — address + coords
        (Avatar đội đã ở meta; không có Comments API trên progress)
      */}
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
          <div className="mb-4 min-w-0">
            <p className="text-sm font-semibold text-foreground">Tiến độ các đội</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tiến độ và trạng thái xử lý của từng đội
            </p>
          </div>
          {!data.assignment ? (
            <p className="py-4 text-sm text-muted-foreground">Chưa có đội được phân công.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              <TeamProgressRow
                assignment={data.assignment}
                reportId={data.reportId}
                reportCode={data.code}
              />
            </ul>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5 overflow-visible focus-visible:ring-0">
          <ActivityTimeline items={data.statusHistory} />
        </TabsContent>

        <TabsContent value="map" className="mt-5 focus-visible:ring-0">
          {isDetailPending ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-muted/40">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : hasCoords && mapLat != null && mapLng != null ? (
            <div>
              <div className="overflow-hidden rounded-xl bg-muted/40">
                <ReportLocationMap latitude={mapLat} longitude={mapLng} className="h-52 w-full" />
              </div>
              {data.address ? (
                <p className="mt-2.5 flex items-start gap-1.5 text-sm leading-snug text-foreground/85">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 whitespace-pre-wrap break-words">{data.address}</span>
                </p>
              ) : null}
              {googleMapsUrl ? (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand tabular-nums hover:underline"
                >
                  <ExternalLink className="size-3" aria-hidden />
                  {mapLat.toFixed(5)}, {mapLng.toFixed(5)}
                </a>
              ) : null}
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
                    <span className="min-w-0 whitespace-pre-wrap break-words">{data.address}</span>
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
    </div>
  );
}

/**
 * Thanh scroll mép phải ngoài — sync với scrollport cột trái (desktop).
 * Ẩn khi đang tương tác cột phải để không double-bar.
 */
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
        // Click track (outside thumb): jump
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

function DetailShell({
  data,
  reportId,
  onBack,
}: {
  data: ReportProgress;
  reportId: string;
  onBack: () => void;
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  /** Desktop: pane đang tương tác — quyết định hiện rail scrollbar mép phải. */
  const [activePane, setActivePane] = useState<'left' | 'right'>('right');
  const leftScrollRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const lifecycleStages = useMemo(() => buildTrackingStages(data), [data]);

  const { data: reportDetail, isPending: isDetailPending } = useReportDetail(reportId);
  const latitude = reportDetail?.latitude;
  const longitude = reportDetail?.longitude;
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const googleMapsUrl = hasCoords ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;

  const allImages = useMemo((): ReportPreviewImage[] => {
    const map = (items: ReportProgressImage[], label: string) =>
      items.map(img => ({ url: img.url, label, uploadedAt: img.uploadedAt }));
    const progressUpdateImages = (data.assignment?.progressUpdates ?? []).flatMap(u =>
      u.images.map(img => ({
        url: img.url,
        label: 'Ảnh tiến độ',
        uploadedAt: img.uploadedAt,
      }))
    );
    return [
      ...map(data.media.submissionImages, 'Ảnh gửi báo cáo'),
      ...map(data.media.beforeImages, 'Ảnh trước xử lý'),
      ...progressUpdateImages,
      ...map(data.media.afterImages, 'Ảnh sau xử lý'),
    ];
  }, [data.assignment, data.media]);

  const handlePreview = (image: ReportPreviewImage) => {
    const idx = allImages.findIndex(
      item => item.url === image.url && item.uploadedAt === image.uploadedAt
    );
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden px-4 pt-0 sm:px-6 lg:px-8">
      <ReportImagePreviewDialog
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

      {/*
        Split-pane:
        - Trái: ẩn native scrollbar; khi active → rail custom mép phải ngoài cùng
        - Phải: scrollbar native; khi scroll/hover phải → ẩn rail trái
      */}
      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 sm:pb-14 lg:overflow-hidden lg:pb-0">
        <div className="grid h-full min-h-0 w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-[6fr_1px_4fr] lg:gap-6">
          <aside
            ref={leftScrollRef}
            onMouseEnter={() => setActivePane('left')}
            onFocusCapture={() => setActivePane('left')}
            onWheel={() => setActivePane('left')}
            className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-8 lg:scrollbar-hide"
          >
            <ReportInfoCard
              data={data}
              mapLat={latitude}
              mapLng={longitude}
              hasCoords={hasCoords}
              isDetailPending={isDetailPending}
              googleMapsUrl={googleMapsUrl}
            />
          </aside>

          <div className="hidden bg-border lg:block" aria-hidden />

          <div
            ref={rightScrollRef}
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

/**
 * Chi tiết báo cáo tra cứu (`/officer/reports/[id]`).
 * UI đồng bộ Leo tracking progress — file riêng để URL browser có `/id`.
 * Data: GET /v1/reports/{id}/progress (+ detail lat/lng).
 */
export function ReportsReportDetailClient({ reportId, onBack }: ReportsReportDetailClientProps) {
  const { data, isPending, isError, refetch, isFetching } = useReportProgress(reportId);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center sm:px-6">
        <p className="text-sm text-destructive">Không tải được tiến trình báo cáo.</p>
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

  return <DetailShell data={data} reportId={reportId} onBack={onBack} />;
}
