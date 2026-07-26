'use client';

import { useCompanyAssignmentDetail } from '@/hooks/useCompany';
import type {
  CompanyAssignmentMediaItem,
  CompanyAssignmentTimelineEntry,
} from '@/lib/api/models/company';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  assignmentStatusClasses,
  assignmentStatusLabel,
  formatCompanyDateTime,
  formatSlaRemaining,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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

function MediaThumbnail({
  image,
  label,
  index,
}: {
  image: CompanyAssignmentMediaItem;
  label: string;
  index: number;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <a
      href={image.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block min-w-0"
      aria-label={`Mở ${label.toLowerCase()} ${index + 1}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50 dark:border-border dark:bg-muted">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-7" aria-hidden />
            <span className="text-[10px]">Không tải được ảnh</span>
          </div>
        ) : (
          <Image
            src={image.url}
            alt={`${label} ${index + 1}`}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">
        {formatCompanyDateTime(image.uploadedAt)}
      </p>
    </a>
  );
}

function MediaGroup({ label, images }: { label: string; images: CompanyAssignmentMediaItem[] }) {
  if (images.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-foreground">{label}</h4>
        <span className="text-[10px] tabular-nums text-muted-foreground">{images.length} ảnh</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <MediaThumbnail
            key={`${image.url}-${image.uploadedAt}-${index}`}
            image={image}
            label={label}
            index={index}
          />
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
                  {entry.fromStatus
                    ? `${reportStatusLabelVi(entry.fromStatus)} → ${reportStatusLabelVi(entry.toStatus)}`
                    : reportStatusLabelVi(entry.toStatus)}
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

  const hasMedia =
    data.media.beforeImages.length > 0 ||
    data.media.progressImages.length > 0 ||
    data.media.afterImages.length > 0;
  const progress = Math.min(100, Math.max(0, data.summary.overallProgressPercent));

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

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Section title="Thông tin báo cáo" icon={<Tag className="size-4" aria-hidden />}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] text-muted-foreground">{data.code}</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
                {data.categoryName}
              </h2>
              {data.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {data.description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-900">
                {reportStatusLabelVi(data.status)}
              </span>
              <span
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-semibold',
                  queueSeverityClasses(data.severity)
                )}
              >
                {queueSeverityLabel(data.severity)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div className="flex min-w-0 gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              <div className="min-w-0">
                <p className="text-muted-foreground">Địa điểm</p>
                <p className="truncate font-medium text-foreground" title={data.address}>
                  {data.address}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="text-muted-foreground">Tiếp nhận</p>
                <p className="font-medium text-foreground">
                  {formatCompanyDateTime(data.dispatchedToCompanyAt ?? data.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {data.wasteTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.wasteTags.map(tag => (
                <span
                  key={tag.tagId}
                  className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-foreground"
                >
                  {tag.nameVi}
                </span>
              ))}
            </div>
          ) : null}
        </Section>

        <Section
          title="SLA & tiến độ"
          icon={
            data.sla.isBreached ? (
              <AlertTriangle className="size-4 text-red-600" aria-hidden />
            ) : (
              <Clock3 className="size-4" aria-hidden />
            )
          }
          className={cn(data.sla.isBreached && 'border-red-200 bg-red-50/50 dark:bg-red-950/10')}
        >
          <p
            className={cn(
              'text-lg font-bold',
              data.sla.isBreached ? 'text-red-700 dark:text-red-400' : 'text-emerald-700'
            )}
          >
            {formatSlaRemaining(data.sla.hoursRemaining)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Hạn {formatCompanyDateTime(data.sla.resolveDueAt)} · {data.sla.severityLabel}
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tiến độ chung</span>
              <span className="font-bold tabular-nums text-emerald-800">{progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {data.summary.completedTeams}/{data.summary.totalTeams} đội hoàn thành
            {data.summary.pendingTeams > 0 ? ` · ${data.summary.pendingTeams} đang chờ` : ''}
            {data.summary.declinedTeams > 0 ? ` · ${data.summary.declinedTeams} từ chối` : ''}
          </p>
        </Section>
      </div>

      <Section title="Đội được phân công" icon={<UsersRound className="size-4" aria-hidden />}>
        {data.teamAssignments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Chưa có đội được phân công.
          </p>
        ) : (
          <div className={cn('grid gap-2', data.teamAssignments.length > 1 && 'md:grid-cols-2')}>
            {data.teamAssignments.map(team => {
              const teamProgress = Math.min(100, Math.max(0, team.progressPercent));

              return (
                <article
                  key={team.assignmentId}
                  className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 dark:border-border dark:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {team.teamName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Phân công bởi {team.assignedByName} ·{' '}
                        {formatCompanyDateTime(team.assignedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold',
                        assignmentStatusClasses(team.status)
                      )}
                    >
                      {assignmentStatusLabel(team.status)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
                      <span className="font-medium text-muted-foreground">Tiến độ</span>
                      <span className="rounded-md bg-white px-1.5 py-0.5 font-bold tabular-nums text-emerald-800 ring-1 ring-emerald-200 dark:bg-card">
                        {teamProgress}%
                      </span>
                    </div>
                    <div
                      className="relative h-3 overflow-hidden rounded-full bg-emerald-100/90 ring-1 ring-inset ring-emerald-200/80 dark:bg-emerald-950/40 dark:ring-emerald-800"
                      role="progressbar"
                      aria-valuenow={teamProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Tiến độ ${team.teamName}`}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-[width] duration-500 ease-out',
                          teamProgress === 0
                            ? 'bg-transparent'
                            : 'bg-linear-to-r from-emerald-500 to-emerald-600 shadow-[inset_0_1px_0_rgb(255_255_255/25%)]'
                        )}
                        style={{ width: `${teamProgress}%` }}
                      />
                      {teamProgress === 0 ? (
                        <span
                          className="absolute inset-y-0 left-0 w-1.5 rounded-full bg-emerald-300/80"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>

                  {team.members.length > 0 ? (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                        Thành viên ({team.members.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map(member => (
                          <span
                            key={member.userId}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
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
                    </div>
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

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Section title="Lịch sử trạng thái" icon={<Clock3 className="size-4" aria-hidden />}>
          <Timeline entries={data.timeline} />
        </Section>

        <Section title="Hình ảnh xử lý" icon={<ImageIcon className="size-4" aria-hidden />}>
          {hasMedia ? (
            <div className="space-y-4">
              <MediaGroup label="Trước xử lý" images={data.media.beforeImages} />
              <MediaGroup label="Trong quá trình" images={data.media.progressImages} />
              <MediaGroup label="Sau xử lý" images={data.media.afterImages} />
            </div>
          ) : (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/30 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-7 text-emerald-300" aria-hidden />
              Chưa có hình ảnh xử lý.
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
