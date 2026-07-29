'use client';

import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { TYPE_LABEL as TEAM_TYPE_LABEL_VI } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReportDetail, useReportProgress } from '@/hooks/useReport';
import type {
  ReportProgress,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressStatusHistory,
} from '@/lib/api/models/reportProgress';
import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Camera,
  History,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useMemo, useState, type ReactNode } from 'react';

const ReportLocationMap = dynamic(
  () => import('@/components/officer/tracking/ReportLocationMap').then(m => m.ReportLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-60 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

interface LeoTrackingReportDetailProps {
  reportId: string;
  onBack: () => void;
}

const ASSIGNMENT_DOT: Record<string, string> = {
  Assigned: 'bg-slate-400',
  InProgress: 'bg-amber-400',
  Completed: 'bg-emerald-500',
  Declined: 'bg-red-500',
};

const AVATAR_COLORS = [
  'bg-sky-200 text-sky-800',
  'bg-violet-200 text-violet-800',
  'bg-emerald-200 text-emerald-800',
  'bg-amber-200 text-amber-800',
  'bg-rose-200 text-rose-800',
] as const;

type MediaStageKey = 'before' | 'progress' | 'after';

interface MediaStage {
  key: MediaStageKey;
  step: number;
  title: string;
  shortLabel: string;
  emptyHint: string;
  images: ReportProgressImage[];
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

function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function teamTypeLabelVi(teamType: string | null | undefined): string {
  const key = teamType?.trim();
  if (!key) return 'Đội xử lý';
  return TEAM_TYPE_LABEL_VI[key] ?? key;
}

function hashColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

function buildMediaStages(media: ReportProgress['media']): MediaStage[] {
  return [
    {
      key: 'before',
      step: 1,
      title: 'Ảnh trước xử lý',
      shortLabel: 'Trước xử lý',
      emptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
      images: media.beforeImages,
    },
    {
      key: 'progress',
      step: 2,
      title: 'Ảnh tiến độ',
      shortLabel: 'Đang xử lý',
      emptyHint: 'Chưa có ảnh cập nhật từ các đội.',
      images: media.progressImages,
    },
    {
      key: 'after',
      step: 3,
      title: 'Ảnh sau xử lý',
      shortLabel: 'Sau xử lý',
      emptyHint: 'Chưa có ảnh nghiệm thu.',
      images: media.afterImages,
    },
  ];
}

/** Circle tiến độ — % + nhãn nằm trong vòng (layout Order-card). */
function ProgressCircle({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className="relative flex size-28 shrink-0 items-center justify-center rounded-full sm:size-32"
      style={{
        background: `conic-gradient(hsl(142 71% 45%) ${clamped * 3.6}deg, hsl(var(--muted)) 0deg)`,
      }}
      role="img"
      aria-label={`Tiến độ hoàn thành: ${clamped}%`}
    >
      <div className="flex size-21 flex-col items-center justify-center rounded-full bg-background px-2 text-center sm:size-24">
        <span className="text-xl font-bold leading-none tabular-nums text-foreground sm:text-2xl">
          {clamped}%
        </span>
        <span className="mt-1 max-w-19 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
          Tiến độ hoàn thành
        </span>
      </div>
    </div>
  );
}

function ProgressRingSm({ percent, size = 'sm' }: { percent: number; size?: 'sm' | 'md' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const dim = size === 'md' ? 'size-14' : 'size-9';
  const text = size === 'md' ? 'text-xs' : 'text-[9px]';
  return (
    <div className={cn('relative flex shrink-0 items-center justify-center', dim)} aria-hidden>
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          className="stroke-emerald-500 transition-all duration-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${clamped} 100`}
          pathLength={100}
        />
      </svg>
      <span className={cn('absolute font-bold tabular-nums text-foreground', text)}>
        {clamped}%
      </span>
    </div>
  );
}

/** Section layout — spacing only, không bọc card/border. */
function SectionBlock({
  children,
  className,
  title,
  icon: Icon,
  description,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn('w-full min-w-0', className)}>
      {title ? (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
              {Icon ? <Icon className="size-4 shrink-0 text-foreground" aria-hidden /> : null}
              {title}
            </h2>
            {description ? (
              <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Timeline ngang 1–2–3: passed = xanh + số, active = pulse, upcoming = outline. */
function MediaProgressTimeline({
  stages,
  activeKey,
  onSelect,
}: {
  stages: MediaStage[];
  activeKey: MediaStageKey;
  onSelect: (key: MediaStageKey) => void;
}) {
  const activeIndex = Math.max(
    0,
    stages.findIndex(stage => stage.key === activeKey)
  );

  return (
    <ol className="relative mt-2 flex w-full items-start">
      {stages.map((stage, index) => {
        const isActive = index === activeIndex;
        const isPassed = index < activeIndex;
        const connectorFilled = index > 0 && index - 1 < activeIndex;

        return (
          <li key={stage.key} className="relative flex flex-1 flex-col items-center">
            {/* Line nối tâm bước trước → tâm bước này, nằm dưới vòng step */}
            {index > 0 ? (
              <span
                className={cn(
                  'pointer-events-none absolute top-4 right-1/2 left-[-50%] z-0 h-0.5 -translate-y-1/2',
                  connectorFilled ? 'bg-emerald-500' : 'bg-border'
                )}
                aria-hidden
              />
            ) : null}

            <button
              type="button"
              onClick={() => onSelect(stage.key)}
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors sm:size-9 sm:text-sm',
                isPassed && 'bg-emerald-500 text-white',
                isActive &&
                  'border-2 border-emerald-500 bg-background text-emerald-800 shadow-sm ring-4 ring-emerald-500/25 dark:text-emerald-300',
                !isPassed &&
                  !isActive &&
                  'border-2 border-border bg-background text-muted-foreground'
              )}
              aria-pressed={isActive}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Bước ${stage.step}: ${stage.shortLabel}${stage.images.length > 0 ? ` (${stage.images.length} ảnh)` : ''}`}
            >
              {isActive ? (
                <>
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-500/45 media-step-pulse-ring"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-500/35 media-step-pulse-ring [animation-delay:0.35s]"
                    aria-hidden
                  />
                  <span
                    className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-400/30 media-step-pulse-ring [animation-delay:0.7s]"
                    aria-hidden
                  />
                </>
              ) : null}
              <span className="relative z-10">{stage.step}</span>
            </button>

            <p
              className={cn(
                'mt-2 max-w-26 text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs',
                isActive
                  ? 'font-semibold text-emerald-800 dark:text-emerald-300'
                  : 'text-muted-foreground'
              )}
            >
              {stage.shortLabel}
            </p>
            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
              {stage.images.length} ảnh
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function MediaStageGallery({
  stage,
  onPreview,
}: {
  stage: MediaStage;
  onPreview: ReportPreviewHandler;
}) {
  if (stage.images.length === 0) {
    return (
      <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-2 py-10 text-center">
        <ImageIcon className="size-8 text-muted-foreground/45" aria-hidden />
        <p className="max-w-sm text-sm text-muted-foreground">{stage.emptyHint}</p>
      </div>
    );
  }

  const latestAt = [...stage.images]
    .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
    .at(-1)?.uploadedAt;

  return (
    <div className="mt-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {stage.title}{' '}
          <span className="font-normal text-muted-foreground">({stage.images.length})</span>
        </h3>
        {latestAt ? (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            Mới nhất · {formatDateTime(latestAt)}
          </p>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {stage.images.map(img => (
          <li key={`${img.url}-${img.uploadedAt}`}>
            <ClickableReportImage
              url={img.url}
              label={stage.title}
              uploadedAt={img.uploadedAt}
              onPreview={onPreview}
              className="aspect-4/3 w-full rounded-xl ring-1 ring-border/50 transition hover:ring-emerald-400/50"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: ReportProgressAssignment }) {
  const statusLabel = ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status;
  const done = assignment.status === 'Completed';

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0 self-start">
          <AvatarFallback className={cn('text-xs font-semibold', hashColor(assignment.teamId))}>
            {getInitials(assignment.teamName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('truncate text-sm font-semibold', done && 'text-muted-foreground')}>
              {assignment.teamName}
            </p>
            <Badge variant="outline" className="rounded-full text-[10px]">
              {teamTypeLabelVi(assignment.teamType)}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {assignment.teamLeaderName}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'size-2 rounded-full',
                  ASSIGNMENT_DOT[assignment.status] ?? 'bg-slate-400'
                )}
              />
              {statusLabel}
            </span>
            <span className="tabular-nums">Gán · {formatDateTime(assignment.assignedAt)}</span>
          </div>
          {assignment.progressNote ? (
            <p className="mt-2 text-xs text-amber-800">
              <span className="font-medium">Ghi chú: </span>
              {assignment.progressNote}
            </p>
          ) : null}
          {assignment.declineReason ? (
            <p className="mt-1 text-xs text-red-600">
              <span className="font-medium">Từ chối: </span>
              {assignment.declineReason}
            </p>
          ) : null}
        </div>

        <ProgressRingSm percent={assignment.progressPercent} size="md" />
      </div>
    </li>
  );
}

function StatusHistoryFeed({ items }: { items: ReportProgressStatusHistory[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có lịch sử trạng thái.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-border/70 pl-4">
      {items.map((entry, idx) => (
        <li key={`${entry.changedAt}-${idx}`} className="relative pb-5 last:pb-0">
          <span
            className="absolute -left-5.25 top-1 size-2.5 rounded-full border-2 border-card bg-emerald-500"
            aria-hidden
          />
          <div className="flex items-start gap-2">
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="bg-muted text-[9px] font-semibold">
                {getInitials(entry.changedByName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug text-foreground sm:text-sm">
                <span className="font-semibold">{entry.changedByName}</span>
                {' · '}
                <span className="text-muted-foreground">
                  {reportStatusLabelVi(entry.fromStatus)} → {reportStatusLabelVi(entry.toStatus)}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                {formatDateTime(entry.changedAt)}
              </p>
              {entry.note ? (
                <p className="mt-1.5 text-xs text-foreground/80">{entry.note}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
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
  const stages = useMemo(() => buildMediaStages(data.media), [data.media]);
  const [activeStage, setActiveStage] = useState<MediaStageKey>('before');

  const active = stages.find(s => s.key === activeStage) ?? stages[0]!;
  const progress = Math.max(0, Math.min(100, Math.round(data.summary.overallProgressPercent)));
  const isMergedDuplicate = data.status === 'Duplicate';
  const resolveDueAt = data.sla.resolveDueAt;

  const coordinatedAt = useMemo(() => {
    const dates = data.assignments
      .map(a => a.assignedAt)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return dates[0] ?? data.summary.startedAt ?? null;
  }, [data.assignments, data.summary.startedAt]);

  const teamTooltipItems = useMemo(
    () =>
      data.assignments.map((assignment, index) => ({
        id: index + 1,
        name: `${assignment.teamName} · ${teamTypeLabelVi(assignment.teamType)}`,
        designation: `Trưởng nhóm: ${assignment.teamLeaderName}`,
        initials: getInitials(assignment.teamName),
        fallbackClassName: hashColor(assignment.teamId),
      })),
    [data.assignments]
  );

  const { data: reportDetail, isPending: isDetailPending } = useReportDetail(reportId);
  const latitude = reportDetail?.latitude;
  const longitude = reportDetail?.longitude;
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const allImages = useMemo((): ReportPreviewImage[] => {
    const map = (items: ReportProgressImage[], label: string) =>
      items.map(img => ({ url: img.url, label, uploadedAt: img.uploadedAt }));
    return [
      ...map(data.media.beforeImages, 'Ảnh trước xử lý'),
      ...map(data.media.progressImages, 'Ảnh tiến độ'),
      ...map(data.media.afterImages, 'Ảnh sau xử lý'),
    ];
  }, [data.media]);

  const handlePreview = (image: ReportPreviewImage) => {
    const idx = allImages.findIndex(
      item => item.url === image.url && item.uploadedAt === image.uploadedAt
    );
    setPreviewIndex(idx >= 0 ? idx : 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">
      <ReportImagePreviewDialog
        images={allImages}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      <div className="mb-3 shrink-0">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Quay lại
        </Button>
      </div>

      <div className="flex w-full min-w-0 flex-col gap-8 sm:gap-10">
        {/* ── Section 1: header + circle progress + media timeline ── */}
        <SectionBlock>
          {/* 3 hàng trái/phải đối xứng cùng cao — circle giữa row-span-3 */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-10">
            {/* Hàng 1 — trái */}
            <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
              <p className="text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl">
                {data.categoryName}
                <span className="ml-2 align-middle text-[11px] font-normal tabular-nums text-muted-foreground/80">
                  #{data.code}
                </span>
              </p>
            </div>

            {/* Hàng 1 — phải */}
            <div
              className={cn(
                'order-5 min-w-0 lg:order-none lg:col-start-3 lg:row-start-1 lg:justify-self-end lg:text-right',
                !isMergedDuplicate && resolveDueAt && data.sla.isBreached && 'text-red-700'
              )}
            >
              <p className="text-sm font-bold leading-snug text-foreground sm:text-base">
                Hạn xử lý
              </p>
            </div>

            {/* Hàng 2 — trái */}
            <div className="order-2 min-w-0 lg:col-start-1 lg:row-start-2">
              <p className="text-sm leading-snug text-muted-foreground">
                Điều phối bởi:{' '}
                <span className="font-medium text-foreground/90">
                  {coordinatedAt ? formatDateTime(coordinatedAt) : 'Chưa điều phối'}
                </span>
              </p>
            </div>

            {/* Hàng 2 — phải */}
            <div
              className={cn(
                'order-6 min-w-0 lg:order-none lg:col-start-3 lg:row-start-2 lg:justify-self-end lg:text-right',
                !isMergedDuplicate && resolveDueAt && data.sla.isBreached && 'text-red-700'
              )}
            >
              <p className="text-lg font-bold leading-snug tabular-nums text-foreground sm:text-xl">
                {isMergedDuplicate || !resolveDueAt
                  ? 'Không áp dụng'
                  : formatDateOnly(resolveDueAt)}
              </p>
            </div>

            {/* Hàng 3 — trái */}
            <div className="order-3 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 lg:col-start-1 lg:row-start-3">
              <p className="shrink-0 text-sm leading-snug text-muted-foreground">Thực hiện bởi</p>
              {teamTooltipItems.length === 0 ? (
                <p className="text-sm leading-snug text-muted-foreground">
                  Chưa có đội được phân công
                </p>
              ) : (
                <AnimatedTooltip items={teamTooltipItems} avatarClassName="size-8" />
              )}
            </div>

            {/* Hàng 3 — phải */}
            <div
              className={cn(
                'order-7 min-w-0 lg:order-none lg:col-start-3 lg:row-start-3 lg:justify-self-end lg:text-right',
                !isMergedDuplicate && resolveDueAt && data.sla.isBreached
                  ? 'text-red-600'
                  : 'text-muted-foreground'
              )}
            >
              <p className="text-sm leading-snug">
                {isMergedDuplicate || !resolveDueAt
                  ? 'Đã gộp vào báo cáo gốc'
                  : formatSlaRemaining(data.sla.hoursRemaining)}
              </p>
            </div>

            {/* Circle giữa */}
            <div className="order-4 flex justify-center py-2 lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-center lg:py-0">
              <ProgressCircle percent={progress} />
            </div>
          </div>

          <div className="mt-11">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
                <Camera className="size-4 shrink-0 text-foreground" aria-hidden />
                Minh chứng hiện trường
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Theo dõi ảnh trước — đang xử lý — sau xử lý tại địa điểm này
              </p>
            </div>
            <MediaProgressTimeline
              stages={stages}
              activeKey={activeStage}
              onSelect={setActiveStage}
            />
            <MediaStageGallery stage={active} onPreview={handlePreview} />
          </div>
        </SectionBlock>

        {/* ── Section 2: Assignments 6 / Status history 4 ── */}
        <div className="grid w-full gap-8 lg:grid-cols-10 lg:gap-0">
          <SectionBlock
            className="lg:col-span-6 lg:pr-8"
            icon={Users}
            title="Đội được phân công"
            description={`${data.summary.completedTeams}/${data.summary.totalTeams} đội hoàn thành · ${data.summary.acceptedTeams} đã nhận · ${data.summary.pendingTeams} chờ`}
          >
            {data.assignments.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Chưa có đội được phân công.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.assignments.map(a => (
                  <AssignmentRow key={a.assignmentId} assignment={a} />
                ))}
              </ul>
            )}
          </SectionBlock>

          <SectionBlock
            className="lg:col-span-4 lg:border-l lg:border-border/60 lg:pl-8"
            icon={History}
            title="Lịch sử trạng thái"
            description="Theo dõi thay đổi trạng thái báo cáo"
          >
            <StatusHistoryFeed items={data.statusHistory} />
          </SectionBlock>
        </div>

        {/* ── Section 3: Map ── */}
        <SectionBlock title="Vị trí báo cáo" icon={MapPin} description={data.address}>
          {isDetailPending ? (
            <div className="flex h-56 items-center justify-center bg-muted/20">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasCoords ? (
            <div className="overflow-hidden">
              <ReportLocationMap
                latitude={latitude}
                longitude={longitude}
                className="h-56 w-full sm:h-72 lg:h-80"
              />
              <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-2 px-4 text-center">
              <MapPin className="size-6 text-muted-foreground/50" aria-hidden />
              <p className="text-sm text-muted-foreground">
                API progress chưa trả lat/lng và không tải được chi tiết báo cáo.
              </p>
              <p className="text-xs text-muted-foreground">
                Gợi ý BE: bổ sung <code className="rounded bg-muted px-1">latitude</code> /{' '}
                <code className="rounded bg-muted px-1">longitude</code> vào{' '}
                <code className="rounded bg-muted px-1">GET /v1/reports/{'{id}'}/progress</code> để
                map không cần gọi thêm endpoint detail.
              </p>
            </div>
          )}
        </SectionBlock>
      </div>
    </div>
  );
}

export function LeoTrackingReportDetail({ reportId, onBack }: LeoTrackingReportDetailProps) {
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
