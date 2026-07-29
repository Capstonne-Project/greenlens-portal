'use client';

import { useCompanyAssignmentDetail } from '@/hooks/useCompany';
import type {
  CompanyAssignmentDetail,
  CompanyAssignmentMediaItem,
  CompanyAssignmentTimelineEntry,
} from '@/lib/api/models/company';
import { reportStatusLabelVi, normalizeReportStatus } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  formatCompanyDateTime,
  formatSlaRemaining,
  teamTaskAcceptanceClasses,
  teamTaskAcceptanceText,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import {
  ArrowLeft,
  Check,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import { Fragment, useState } from 'react';

interface CompanyAssignmentDetailTabProps {
  reportId: string;
  onBack: () => void;
}

function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-xl border border-emerald-100 bg-white p-4 dark:border-border dark:bg-card',
        className
      )}
    >
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-400">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

const MEDIA_PHASE_GROUPS = [
  { id: 'before', title: 'Trước xử lý', imagesKey: 'beforeImages' as const },
  { id: 'progress', title: 'Trong quá trình', imagesKey: 'progressImages' as const },
  { id: 'after', title: 'Sau xử lý', imagesKey: 'afterImages' as const },
];

function CompactMediaThumb({
  image,
  title,
  index,
}: {
  image: CompanyAssignmentMediaItem;
  title: string;
  index: number;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <figure className="w-[4.5rem] shrink-0 sm:w-20">
      <a
        href={image.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        title={`${title} · ${formatCompanyDateTime(image.uploadedAt)}`}
        aria-label={`Mở ${title.toLowerCase()} ${index + 1}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-md border border-emerald-100 bg-emerald-50 dark:border-border dark:bg-muted">
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageIcon className="size-4" aria-hidden />
            </div>
          ) : (
            <Image
              src={image.url}
              alt={title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="80px"
              onError={() => setHasError(true)}
            />
          )}
        </div>
      </a>
      <figcaption className="mt-1 space-y-0.5">
        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground">
          {title}
        </p>
        <time
          dateTime={image.uploadedAt}
          className="block text-[9px] tabular-nums text-muted-foreground"
        >
          {formatCompanyDateTime(image.uploadedAt)}
        </time>
      </figcaption>
    </figure>
  );
}

function CompactMediaStrip({ media }: { media: CompanyAssignmentDetail['media'] }) {
  const groups = MEDIA_PHASE_GROUPS.map(phase => ({
    ...phase,
    images: media[phase.imagesKey],
  })).filter(group => group.images.length > 0);

  const totalCount = groups.reduce((sum, g) => sum + g.images.length, 0);
  if (totalCount === 0) return null;

  return (
    <div className="mt-4 border-t border-emerald-100 pt-4 dark:border-border">
      <div className="mb-3 flex items-center gap-1.5">
        <ImageIcon className="size-3.5 text-emerald-700" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
          Hình ảnh minh chứng
        </p>
        <span className="text-[10px] tabular-nums text-muted-foreground">({totalCount})</span>
      </div>

      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.id}>
            <h4 className="mb-1.5 text-[11px] font-semibold text-foreground">{group.title}</h4>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-smooth">
              {group.images.map((image, index) => (
                <CompactMediaThumb
                  key={`${group.id}-${image.url}-${index}`}
                  image={image}
                  title={group.images.length > 1 ? `${group.title} · ${index + 1}` : group.title}
                  index={index}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function usefulReason(reason?: string | null): string | null {
  const value = reason?.trim();
  if (!value || value === 'string' || value === '[ADMIN] string') return null;
  return value;
}

function Timeline({ entries }: { entries: CompanyAssignmentTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">Chưa có lịch sử trạng thái.</p>
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const reason = usefulReason(entry.reason);

        return (
          <li key={`${entry.timestamp}-${index}`} className="flex gap-3">
            <div className="relative flex w-4 shrink-0 justify-center">
              {!isLast ? (
                <span
                  className="absolute top-4 bottom-0 w-px bg-emerald-200 dark:bg-emerald-800"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'relative mt-1.5 size-2.5 rounded-full ring-4 ring-white dark:ring-card',
                  isLast ? 'bg-emerald-600' : 'bg-emerald-300'
                )}
                aria-hidden
              />
            </div>

            <div className={cn('min-w-0 flex-1 pb-5', isLast && 'pb-0')}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  {reportStatusLabelVi(entry.toStatus)}
                </p>
                <time
                  dateTime={entry.timestamp}
                  className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                >
                  {formatCompanyDateTime(entry.timestamp)}
                </time>
              </div>
              {entry.changedByName ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.changedByName}</p>
              ) : null}
              {reason ? (
                <p className="mt-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                  {reason}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type StepState = 'done' | 'current' | 'pending';

type ProgressStep = {
  id: string;
  label: string;
  hint: string;
  at: string | null;
  state: StepState;
};

function buildProgressSteps(data: CompanyAssignmentDetail): ProgressStep[] {
  const hasTeams = data.teamAssignments.length > 0;
  const hasStarted = data.teamAssignments.some(
    t =>
      Boolean(t.startedAt) ||
      t.progressPercent > 0 ||
      t.status === 'InProgress' ||
      t.status === 'Completed'
  );
  const normalized = normalizeReportStatus(data.status);
  const isComplete = ['Resolved', 'Closed', 'ClosedNoViolation'].includes(normalized);
  const progress = Math.min(100, Math.max(0, data.summary.overallProgressPercent));

  const raw: Omit<ProgressStep, 'state'>[] = [
    {
      id: 'receive',
      label: 'Tiếp nhận',
      hint: 'Điều phối tới công ty',
      at: data.dispatchedToCompanyAt ?? data.createdAt,
    },
    {
      id: 'assign',
      label: 'Phân công',
      hint: hasTeams ? `${data.summary.totalTeams} đội được giao` : 'Chưa phân công đội',
      at: data.teamAssignments[0]?.assignedAt ?? null,
    },
    {
      id: 'process',
      label: 'Đang xử lý',
      hint: `${data.summary.completedTeams}/${data.summary.totalTeams || '—'} đội hoàn thành`,
      at:
        data.summary.startedAt ??
        data.teamAssignments.find(t => t.startedAt)?.startedAt ??
        data.teamAssignments.find(t => t.progressUpdatedAt)?.progressUpdatedAt ??
        null,
    },
    {
      id: 'complete',
      label: 'Hoàn thành',
      hint: isComplete ? reportStatusLabelVi(data.status) : 'Chờ nghiệm thu',
      at: data.resolvedAt ?? data.closedAt ?? null,
    },
  ];

  const doneFlags = [true, hasTeams, isComplete || (hasStarted && progress > 0), isComplete];

  let markedCurrent = false;
  return raw.map((step, index) => {
    const done = doneFlags[index] ?? false;
    if (done) return { ...step, state: 'done' as const };
    if (!markedCurrent) {
      markedCurrent = true;
      return { ...step, state: 'current' as const };
    }
    return { ...step, state: 'pending' as const };
  });
}

function StepConnector({
  segmentStep,
  completedThrough,
  currentStep,
}: {
  segmentStep: number;
  completedThrough: number;
  currentStep: number;
}) {
  const isComplete = completedThrough >= segmentStep;
  const isActive = !isComplete && currentStep === segmentStep;

  return (
    <div
      className="relative mt-4 h-1 min-w-6 flex-1 overflow-hidden rounded-full bg-emerald-100"
      aria-hidden
    >
      {isComplete ? <span className="absolute inset-0 rounded-full bg-emerald-600" /> : null}
      {isActive ? (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="stepper-line-shuttle absolute inset-y-0 left-0 w-2/5 rounded-full bg-emerald-600 motion-reduce:animate-none" />
        </span>
      ) : null}
    </div>
  );
}

function ProgressStepper({ steps }: { steps: ProgressStep[] }) {
  let completedThrough = 0;
  for (const step of steps) {
    if (step.state === 'done') completedThrough += 1;
    else break;
  }

  const currentIndex = steps.findIndex(s => s.state === 'current');
  const currentStep =
    currentIndex >= 0 ? currentIndex + 1 : Math.min(completedThrough + 1, steps.length);

  return (
    <ol className="flex items-start overflow-x-auto pb-1 scrollbar-smooth">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isDone = step.state === 'done';
        const isCurrent = step.state === 'current';

        return (
          <Fragment key={step.id}>
            <li className="flex w-[5.25rem] shrink-0 flex-col items-center gap-2 text-center sm:w-28 sm:items-start sm:text-left">
              <span
                className={cn(
                  'relative z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums transition-colors sm:size-10',
                  isDone && 'border-emerald-600 bg-emerald-600 text-white',
                  isCurrent &&
                    'border-emerald-600 bg-white text-emerald-800 ring-4 ring-emerald-100',
                  step.state === 'pending' && 'border-emerald-200 bg-white text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : stepNum}
              </span>

              <div className="min-w-0">
                <p
                  className={cn(
                    'text-xs font-semibold leading-tight sm:text-sm',
                    isCurrent
                      ? 'text-emerald-900'
                      : isDone
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground sm:line-clamp-none">
                  {step.hint}
                </p>
                {step.at ? (
                  <time
                    dateTime={step.at}
                    className="mt-1 block text-[10px] tabular-nums text-emerald-800/80"
                  >
                    {formatCompanyDateTime(step.at)}
                  </time>
                ) : (
                  <span className="mt-1 block text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </li>

            {index < steps.length - 1 ? (
              <StepConnector
                segmentStep={stepNum}
                completedThrough={completedThrough}
                currentStep={currentStep}
              />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

export function CompanyAssignmentDetailTab({ reportId, onBack }: CompanyAssignmentDetailTabProps) {
  const { data, isPending, isError, refetch } = useCompanyAssignmentDetail(reportId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-white py-24 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Đang tải chi tiết…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="text-destructive">Không tải được chi tiết báo cáo.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 underline">
          Thử lại
        </button>
      </div>
    );
  }

  const progress = Math.min(100, Math.max(0, data.summary.overallProgressPercent));
  const progressSteps = buildProgressSteps(data);

  return (
    <div className="space-y-3 pb-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-900"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Quay lại danh sách
      </button>

      <section
        className={cn(
          'rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5 dark:border-border dark:bg-card',
          data.sla.isBreached && 'border-red-200 bg-red-50/30 dark:bg-red-950/10'
        )}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-foreground sm:text-base">{data.code}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{data.categoryName}</p>
          </div>
          <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-900">
            {reportStatusLabelVi(data.status)}
          </span>
        </div>

        <ProgressStepper steps={progressSteps} />

        <CompactMediaStrip media={data.media} />

        <div className="mt-4 grid gap-4 border-t border-emerald-100 pt-4 sm:grid-cols-2 dark:border-border">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              SLA xử lý
            </p>
            <p
              className={cn(
                'mt-1 text-xl font-bold tabular-nums',
                data.sla.isBreached ? 'text-red-700' : 'text-emerald-700'
              )}
            >
              {formatSlaRemaining(data.sla.hoursRemaining)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Hạn {formatCompanyDateTime(data.sla.resolveDueAt)} · {data.sla.severityLabel}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                Tiến độ chung
              </span>
              <span className="text-lg font-bold tabular-nums text-emerald-800">{progress}%</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-emerald-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <Section title="Thông tin báo cáo" icon={<Tag className="size-4" aria-hidden />}>
        {data.description ? (
          <p className="mb-3 text-sm leading-relaxed text-foreground">{data.description}</p>
        ) : null}

        <div className="flex min-w-0 gap-2 text-xs">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-foreground">{data.address}</p>
            {data.wardCode ? (
              <p className="mt-0.5 text-muted-foreground">Phường/xã: {data.wardCode}</p>
            ) : null}
            {Number.isFinite(data.latitude) && Number.isFinite(data.longitude) ? (
              <a
                href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex text-[11px] font-medium text-emerald-700 hover:underline"
              >
                Xem trên bản đồ
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span
            className={cn(
              'rounded-md px-2 py-1 text-[10px] font-semibold',
              queueSeverityClasses(data.severity)
            )}
          >
            {queueSeverityLabel(data.severity)}
          </span>
          {data.reopenedCount > 0 ? (
            <span className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900">
              Mở lại {data.reopenedCount} lần
            </span>
          ) : null}
          {data.wasteTags.map(tag => (
            <span
              key={tag.tagId}
              className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-foreground"
            >
              {tag.nameVi}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Đội được phân công" icon={<UsersRound className="size-4" aria-hidden />}>
        {data.teamAssignments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có đội được phân công.
          </p>
        ) : (
          <div className={cn('grid gap-2', data.teamAssignments.length > 1 && 'md:grid-cols-2')}>
            {data.teamAssignments.map(team => {
              const teamProgress = Math.min(100, Math.max(0, team.progressPercent));
              const leader = team.members.find(m => m.isLeader);

              return (
                <article
                  key={team.assignmentId}
                  className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 dark:border-border dark:bg-muted/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {team.teamName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {team.assignedByName} · {formatCompanyDateTime(team.assignedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset',
                        teamTaskAcceptanceClasses(team.status, team.startedAt)
                      )}
                    >
                      {teamTaskAcceptanceText(team.status, team.startedAt)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-medium text-muted-foreground">Tiến độ</span>
                      <span className="font-bold tabular-nums text-emerald-800">
                        {teamProgress}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-emerald-100"
                      role="progressbar"
                      aria-valuenow={teamProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Tiến độ ${team.teamName}`}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
                        style={{ width: `${teamProgress}%` }}
                      />
                    </div>
                  </div>

                  {team.members.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {team.members.map(member => (
                        <span
                          key={member.userId}
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                            member.isLeader
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-emerald-900 ring-1 ring-emerald-200 dark:bg-card dark:text-foreground dark:ring-border'
                          )}
                        >
                          {member.fullName}
                          {member.isLeader ? ' · Trưởng đội' : ''}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {!leader && team.members.length > 0 ? (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Chưa chỉ định trưởng đội
                    </p>
                  ) : null}

                  {team.progressNote ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {team.progressNote}
                    </p>
                  ) : null}
                  {team.declineReason ? (
                    <p className="mt-2 text-xs text-red-600">{team.declineReason}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Lịch sử trạng thái" icon={<Clock3 className="size-4" aria-hidden />}>
        <Timeline entries={data.timeline} />
      </Section>
    </div>
  );
}
