'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClickableReportImage,
  ReportImagePreviewDialog,
  type ReportPreviewHandler,
  type ReportPreviewImage,
} from '@/components/officer/shared/ReportImagePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useReportProgress } from '@/hooks/useReport';
import type {
  ReportProgress,
  ReportProgressAssignment,
  ReportProgressImage,
  ReportProgressStatusHistory,
} from '@/lib/api/models/reportProgress';
import { ASSIGNMENT_STATUS_LABEL } from '@/lib/constants/reportAssignment';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { TYPE_LABEL as TEAM_TYPE_LABEL_VI } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlignLeft,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useState, Fragment, useMemo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

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

function ProgressRing({
  percent,
  size = 'md',
  showValue = true,
  className,
}: {
  percent: number;
  size?: 'sm' | 'md' | 'lg';
  /** Ẩn % giữa vòng — dùng khi label/% nằm cạnh (style dashboard). */
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const dim = size === 'sm' ? 'size-9' : size === 'lg' ? 'size-20' : 'size-14';
  const text = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-lg' : 'text-xs';

  return (
    <div className={cn('relative flex items-center justify-center', dim, className)} aria-hidden>
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
      {showValue ? (
        <span className={cn('absolute font-bold tabular-nums text-foreground', text)}>
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}

function DonutChart({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div
        className="relative flex size-24 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(hsl(142 71% 45%) ${clamped * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
        aria-hidden
      >
        <div className="size-[4.5rem] rounded-full bg-background" />
      </div>
      <div className="flex h-24 min-w-0 flex-col justify-center gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold leading-none tabular-nums text-foreground">{clamped}%</p>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-border/50 py-3.5 sm:grid-cols-[148px_1fr] sm:gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-sm text-foreground">{children}</div>
    </div>
  );
}

function TeamAvatarStack({ assignments }: { assignments: ReportProgressAssignment[] }) {
  if (assignments.length === 0) {
    return <span className="text-muted-foreground">Chưa có đội được phân công</span>;
  }

  const visible = assignments.slice(0, 4);
  const extra = assignments.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex -space-x-2">
        {visible.map(a => (
          <Avatar key={a.assignmentId} className="size-8 ring-2 ring-card">
            <AvatarFallback className={cn('text-[10px] font-semibold', hashColor(a.teamId))}>
              {getInitials(a.teamName)}
            </AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
            +{extra}
          </span>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">{assignments.map(a => a.teamName).join(', ')}</p>
    </div>
  );
}

function AttachmentGrid({
  images,
  label,
  onPreview,
}: {
  images: ReportProgressImage[];
  label: string;
  onPreview: ReportPreviewHandler;
}) {
  if (images.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {images.slice(0, 6).map(img => (
        <ClickableReportImage
          key={`${img.url}-${img.uploadedAt}`}
          url={img.url}
          label={label}
          uploadedAt={img.uploadedAt}
          onPreview={onPreview}
          className="h-16 w-24 rounded-lg"
        />
      ))}
      {images.length > 6 ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          +{images.length - 6}
        </div>
      ) : null}
    </div>
  );
}

function TeamSubtaskRow({ assignment }: { assignment: ReportProgressAssignment }) {
  const done = assignment.status === 'Completed';
  const declined = assignment.status === 'Declined';
  const label = ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status;

  return (
    <li className="space-y-2">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border',
            done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : declined
                ? 'border-red-300 bg-red-50 text-red-500'
                : 'border-border bg-background'
          )}
        >
          {done ? <CheckCircle2 className="size-3.5" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-sm font-medium', done && 'text-muted-foreground line-through')}>
              {assignment.teamName}
            </p>
            <Badge variant="outline" className="rounded-full text-[10px]">
              {teamTypeLabelVi(assignment.teamType)}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {assignment.teamLeaderName} · {label}
          </p>
        </div>
        <ProgressRing percent={assignment.progressPercent} size="sm" />
      </div>
      {assignment.progressNote ? (
        <p className="ml-8 text-xs text-amber-800">
          <span className="font-medium">Ghi chú: </span>
          {assignment.progressNote}
        </p>
      ) : null}
      {assignment.declineReason ? (
        <p className="ml-8 text-xs text-red-600">
          <span className="font-medium">Từ chối: </span>
          {assignment.declineReason}
        </p>
      ) : null}
    </li>
  );
}

function ActivityFeed({ items }: { items: ReportProgressStatusHistory[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>;
  }

  return (
    <ul className="space-y-4 pb-2">
      {items.map((entry, idx) => (
        <li key={`${entry.changedAt}-${idx}`} className="flex gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-muted text-[10px] font-semibold">
              {getInitials(entry.changedByName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{entry.changedByName}</span> chuyển trạng thái{' '}
              <span className="font-medium">{reportStatusLabelVi(entry.fromStatus)}</span>
              {' → '}
              <span className="font-medium">{reportStatusLabelVi(entry.toStatus)}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(entry.changedAt)}
            </p>
            {entry.note ? <p className="mt-2 text-xs text-foreground/80">{entry.note}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function OverviewTab({
  data,
  onPreview,
}: {
  data: ReportProgress;
  onPreview: ReportPreviewHandler;
}) {
  const progress = Math.max(0, Math.min(100, Math.round(data.summary.overallProgressPercent)));
  const isMergedDuplicate = data.status === 'Duplicate';
  const resolveDueAt = data.sla.resolveDueAt;
  const slaText = formatSlaRemaining(data.sla.hoursRemaining);
  const attachmentCount =
    data.media.beforeImages.length +
    data.media.progressImages.length +
    data.media.afterImages.length;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {data.categoryName}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {data.address}
        </p>

        <div className="mt-6">
          <MetaRow icon={<Target className="size-4" />} label="Trạng thái">
            <span className="inline-flex items-center gap-2">
              <Circle className="size-2.5 fill-sky-500 text-sky-500" />
              {reportStatusLabelVi(data.status)}
            </span>
          </MetaRow>
          <MetaRow icon={<Calendar className="size-4" />} label="Hạn xử lý">
            {isMergedDuplicate || !resolveDueAt ? (
              <span className="text-muted-foreground">Không áp dụng · Đã gộp vào báo cáo gốc</span>
            ) : (
              <span className={cn(data.sla.isBreached && 'font-medium text-red-600')}>
                {formatDateOnly(resolveDueAt)} · {slaText}
              </span>
            )}
          </MetaRow>
          <MetaRow icon={<Users className="size-4" />} label="Đội được gán">
            <TeamAvatarStack assignments={data.assignments} />
          </MetaRow>
          <MetaRow icon={<AlignLeft className="size-4" />} label="Mô tả">
            <p className="leading-relaxed text-foreground/90">
              {data.description?.trim() || 'Không có mô tả chi tiết.'}
            </p>
          </MetaRow>
        </div>
      </section>

      <section className="border-t border-border/60 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex shrink-0 items-center gap-3">
            <ProgressRing percent={progress} size="md" showValue={false} />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tiến độ tổng</p>
              <p className="text-lg font-bold tabular-nums text-foreground">{progress}%</p>
            </div>
          </div>

          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {[
              { label: 'Tổng đội', value: data.summary.totalTeams },
              { label: 'Đã nhận', value: data.summary.acceptedTeams },
              { label: 'Hoàn thành', value: data.summary.completedTeams },
              { label: 'Từ chối', value: data.summary.declinedTeams },
              { label: 'Chờ xử lý', value: data.summary.pendingTeams },
            ].map(item => (
              <div key={item.label} className="min-w-0">
                <dd className="text-lg font-bold tabular-nums text-foreground">{item.value}</dd>
                <dt className="mt-0.5 text-xs text-muted-foreground">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-border/60 pt-6">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ImageIcon className="size-4" />
          Ảnh đính kèm ({attachmentCount})
        </p>
        <AttachmentGrid
          images={data.media.beforeImages}
          label="Trước xử lý"
          onPreview={onPreview}
        />
        {attachmentCount === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Chưa có ảnh minh chứng.</p>
        ) : null}
      </section>

      <div className="grid gap-8 border-t border-border/60 pt-6 pb-2 lg:grid-cols-2 lg:gap-x-8">
        <section className="min-w-0">
          <h3 className="text-sm font-semibold">Tiến trình các đội</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.summary.completedTeams}/{data.summary.totalTeams} đội hoàn thành
          </p>
          <ul className="mt-4 divide-y divide-border/60">
            {data.assignments.length === 0 ? (
              <li className="py-4 text-sm text-muted-foreground">Chưa có đội nào.</li>
            ) : (
              data.assignments.map(a => (
                <div key={a.assignmentId} className="py-4 first:pt-0">
                  <TeamSubtaskRow assignment={a} />
                </div>
              ))
            )}
          </ul>
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="size-4 text-emerald-600" />
            <h3 className="text-sm font-semibold">Hoạt động gần đây</h3>
          </div>
          <ActivityFeed items={data.statusHistory} />
        </section>
      </div>
    </div>
  );
}

function AssignmentTimeline({ assignment }: { assignment: ReportProgressAssignment }) {
  const steps = [
    { label: 'Phân công', at: assignment.assignedAt, done: true },
    { label: 'Chấp nhận', at: assignment.acceptedAt, done: Boolean(assignment.acceptedAt) },
    {
      label: 'Cập nhật tiến độ',
      at: assignment.progressUpdatedAt,
      done: Boolean(assignment.progressUpdatedAt),
    },
    { label: 'Hoàn thành', at: assignment.completedAt, done: Boolean(assignment.completedAt) },
  ];

  return (
    <ol className="mt-3 flex flex-wrap gap-2">
      {steps.map(step => (
        <li
          key={step.label}
          className={cn('text-[11px]', step.done ? 'text-emerald-800' : 'text-muted-foreground')}
        >
          <span className="font-medium">{step.label}</span>
          {step.at ? (
            <span className="mt-0.5 block tabular-nums opacity-80">{formatDateTime(step.at)}</span>
          ) : (
            <span className="mt-0.5 block">—</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function ProcessMediaTimeline({
  media,
  onPreview,
}: {
  media: ReportProgress['media'];
  onPreview: ReportPreviewHandler;
}) {
  const stages: Array<{
    key: string;
    step: number;
    title: string;
    subtitle: string;
    emptyHint: string;
    images: ReportProgressImage[];
    icon: LucideIcon;
  }> = [
    {
      key: 'before',
      step: 1,
      title: 'Ảnh trước xử lý',
      subtitle: 'Hiện trạng ban đầu khi tiếp nhận',
      emptyHint: 'Chưa có ảnh hiện trạng ban đầu.',
      images: media.beforeImages,
      icon: Camera,
    },
    {
      key: 'progress',
      step: 2,
      title: 'Ảnh tiến độ',
      subtitle: 'Cập nhật từ đội trong quá trình xử lý',
      emptyHint: 'Chưa có ảnh cập nhật từ các đội.',
      images: media.progressImages,
      icon: Sparkles,
    },
    {
      key: 'after',
      step: 3,
      title: 'Ảnh sau xử lý',
      subtitle: 'Minh chứng nghiệm thu / hoàn tất',
      emptyHint: 'Chưa có ảnh nghiệm thu.',
      images: media.afterImages,
      icon: CheckCircle2,
    },
  ];

  const doneCount = stages.filter(s => s.images.length > 0).length;

  return (
    <section aria-label="Minh chứng theo quy trình xử lý">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Minh chứng theo quy trình</h3>
          <p className="text-xs text-muted-foreground">
            Ba giai đoạn ảnh nối tiếp — theo dõi từ hiện trạng đến nghiệm thu
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          <span className="font-medium text-foreground">{doneCount}/3</span> giai đoạn có ảnh
        </p>
      </div>

      <ol className="relative">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const hasImages = stage.images.length > 0;
          const Icon = stage.icon;
          const latestAt = hasImages
            ? ([...stage.images].sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt)).at(-1)
                ?.uploadedAt ?? null)
            : null;

          return (
            <li key={stage.key} className="relative flex gap-4">
              {/* Rail: node + vertical connector */}
              <div className="relative flex w-9 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    'relative z-10 flex size-9 items-center justify-center rounded-full border-2 transition-colors',
                    hasImages
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-border bg-muted/60 text-muted-foreground'
                  )}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                {!isLast ? (
                  <span
                    className={cn(
                      'mt-1 w-px flex-1 min-h-10',
                      hasImages ? 'bg-emerald-300/80 dark:bg-emerald-700/60' : 'bg-border'
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>

              <div className={cn('min-w-0 flex-1', !isLast && 'pb-8')}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                      Bước {stage.step}
                    </p>
                    <h4 className="text-sm font-semibold text-foreground">
                      {stage.title}{' '}
                      <span className="font-normal text-muted-foreground">
                        ({stage.images.length})
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">{stage.subtitle}</p>
                  </div>
                  {latestAt ? (
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      Mới nhất · {formatDateTime(latestAt)}
                    </p>
                  ) : null}
                </div>

                {hasImages ? (
                  <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {stage.images.map(img => (
                      <li key={`${img.url}-${img.uploadedAt}`}>
                        <ClickableReportImage
                          url={img.url}
                          label={stage.title}
                          uploadedAt={img.uploadedAt}
                          onPreview={onPreview}
                          className="aspect-[4/3] w-full rounded-xl ring-1 ring-border/50 transition hover:ring-emerald-400/50"
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                    <ImageIcon className="size-4 shrink-0 opacity-60" aria-hidden />
                    <span>{stage.emptyHint}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ProgressTab({
  data,
  onPreview,
}: {
  data: ReportProgress;
  onPreview: ReportPreviewHandler;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(data.assignments[0]?.assignmentId ? [data.assignments[0].assignmentId] : [])
  );

  const toggleExpanded = (assignmentId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(assignmentId)) next.delete(assignmentId);
      else next.add(assignmentId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(data.assignments.map(a => a.assignmentId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const allExpanded =
    data.assignments.length > 0 && data.assignments.every(a => expandedIds.has(a.assignmentId));

  const progress = Math.max(0, Math.min(100, Math.round(data.summary.overallProgressPercent)));
  const isMergedDuplicate = data.status === 'Duplicate';
  const resolveDueAt = data.sla.resolveDueAt;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-6">
          <DonutChart percent={progress} label="Hoàn thành" />
          <div className="space-y-2 text-sm">
            <p>
              <span className="inline-block size-2 rounded-full bg-emerald-500" /> Hoàn thành:{' '}
              <strong>{data.summary.completedTeams}</strong>
            </p>
            <p>
              <span className="inline-block size-2 rounded-full bg-amber-400" /> Đang xử lý:{' '}
              <strong>{data.assignments.filter(a => a.status === 'InProgress').length}</strong>
            </p>
            <p>
              <span className="inline-block size-2 rounded-full bg-red-500" /> Quá hạn xử lý:{' '}
              <strong>
                {isMergedDuplicate || !resolveDueAt ? 0 : data.sla.isBreached ? 1 : 0}
              </strong>
            </p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 text-sm',
            !isMergedDuplicate && resolveDueAt && data.sla.isBreached
              ? 'text-red-600'
              : 'text-muted-foreground'
          )}
        >
          <Clock className="size-4 shrink-0" />
          <div>
            {isMergedDuplicate || !resolveDueAt ? (
              <>
                <p className="font-semibold text-foreground">Hạn xử lý · Không áp dụng</p>
                <p className="text-xs">Đã gộp vào báo cáo gốc</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">
                  Hạn xử lý · {formatSlaRemaining(data.sla.hoursRemaining)}
                </p>
                <p className="text-xs">Hạn: {formatDateTime(resolveDueAt)}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Chi tiết tiến độ từng đội</h3>
            <p className="text-xs text-muted-foreground">
              Bấm vào dòng để mở / thu gọn timeline, ghi chú và người phụ trách
            </p>
          </div>
          {data.assignments.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={allExpanded ? collapseAll : expandAll}
            >
              {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead className="min-w-[200px]">Đội / Trưởng nhóm</TableHead>
                <TableHead className="w-[120px]">Trạng thái</TableHead>
                <TableHead className="w-[90px] text-center">Tiến độ</TableHead>
                <TableHead className="min-w-[130px]">Phân công</TableHead>
                <TableHead className="min-w-[130px]">Cập nhật</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.assignments.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    Chưa có đội được phân công.
                  </TableCell>
                </TableRow>
              ) : (
                data.assignments.map(assignment => {
                  const isOpen = expandedIds.has(assignment.assignmentId);
                  const statusLabel =
                    ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status;

                  return (
                    <Fragment key={assignment.assignmentId}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/30"
                        aria-expanded={isOpen}
                        onClick={() => toggleExpanded(assignment.assignmentId)}
                      >
                        <TableCell className="w-10 pr-0">
                          <ChevronDown
                            className={cn(
                              'size-4 text-muted-foreground transition-transform duration-200',
                              isOpen && 'rotate-180'
                            )}
                            aria-hidden
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback
                                className={cn(
                                  'text-xs font-semibold',
                                  hashColor(assignment.teamId)
                                )}
                              >
                                {getInitials(assignment.teamName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{assignment.teamName}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {assignment.teamLeaderName} · {teamTypeLabelVi(assignment.teamType)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={cn(
                                'size-2 rounded-full',
                                ASSIGNMENT_DOT[assignment.status] ?? 'bg-slate-400'
                              )}
                            />
                            {statusLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <ProgressRing percent={assignment.progressPercent} size="sm" />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {formatDateTime(assignment.assignedAt)}
                        </TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {assignment.progressUpdatedAt
                            ? formatDateTime(assignment.progressUpdatedAt)
                            : '—'}
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="bg-muted/20 px-4 py-4">
                            <div className="space-y-3">
                              {assignment.progressNote ? (
                                <p className="text-sm">
                                  <span className="font-medium">Ghi chú: </span>
                                  {assignment.progressNote}
                                </p>
                              ) : null}
                              {assignment.declineReason ? (
                                <p className="text-sm text-red-600">
                                  Lý do từ chối: {assignment.declineReason}
                                </p>
                              ) : null}
                              <AssignmentTimeline assignment={assignment} />
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all"
                                  style={{ width: `${assignment.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <ProcessMediaTimeline media={data.media} onPreview={onPreview} />
    </div>
  );
}

function DetailShell({ data, onBack }: { data: ReportProgress; onBack: () => void }) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">
      <ReportImagePreviewDialog
        images={allImages}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChangeIndex={setPreviewIndex}
      />

      <div className="mb-3">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          Quay lại
        </Button>
      </div>

      <Tabs defaultValue="overview" className="min-h-0 flex-1">
        <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent px-3 py-2.5 first:pl-0 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4 sm:first:pl-0"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:px-4"
          >
            Tiến độ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 pb-6 focus-visible:outline-none sm:pb-8">
          <OverviewTab data={data} onPreview={handlePreview} />
        </TabsContent>
        <TabsContent value="progress" className="mt-6 pb-6 focus-visible:outline-none sm:pb-8">
          <ProgressTab data={data} onPreview={handlePreview} />
        </TabsContent>
      </Tabs>
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

  return <DetailShell data={data} onBack={onBack} />;
}
