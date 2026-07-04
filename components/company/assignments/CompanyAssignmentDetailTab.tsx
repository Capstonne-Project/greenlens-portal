'use client';

import { useCompanyAssignmentDetail } from '@/hooks/useCompany';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import {
  assignmentStatusClasses,
  assignmentStatusCompanyHint,
  assignmentStatusLabel,
  formatCompanyDateTime,
  formatSlaRemaining,
  queueSeverityClasses,
  queueSeverityLabel,
} from '@/utils/companyUi';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';

interface CompanyAssignmentDetailTabProps {
  reportId: string;
  onBack: () => void;
}

function ProgressRing({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative inline-flex size-24 items-center justify-center">
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-emerald-100"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-600 transition-all"
        />
      </svg>
      <span className="absolute text-lg font-bold tabular-nums text-emerald-800">{pct}%</span>
    </div>
  );
}

function MediaGallery({
  title,
  images,
}: {
  title: string;
  images: { url: string; uploadedAt: string }[];
}) {
  if (images.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img, idx) => (
          <div
            key={`${img.url}-${idx}`}
            className="relative aspect-video overflow-hidden rounded-md border border-emerald-100 bg-emerald-50/50"
          >
            <Image
              src={img.url}
              alt={`${title} ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 200px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyAssignmentDetailTab({ reportId, onBack }: CompanyAssignmentDetailTabProps) {
  const { data, isPending, isError, refetch } = useCompanyAssignmentDetail(reportId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-white py-24 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Đang tải chi tiết…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
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

  const hasResults =
    data.media.afterImages.length > 0 ||
    data.status === 'Resolved' ||
    data.status === 'Closed' ||
    data.summary.completedTeams > 0;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại danh sách
      </button>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm lg:col-span-2 dark:border-border dark:bg-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{data.code}</p>
              <h2 className="mt-1 text-xl font-bold text-emerald-950 dark:text-foreground">
                {data.categoryName}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{data.description || '—'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                {reportStatusLabelVi(data.status)}
              </span>
              <span
                className={cn(
                  'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                  queueSeverityClasses(data.severity)
                )}
              >
                {queueSeverityLabel(data.severity)}
              </span>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Địa chỉ</dt>
                <dd className="font-medium">{data.address}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Calendar className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Ngày tạo</dt>
                <dd>{formatCompanyDateTime(data.createdAt)}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <dt className="text-muted-foreground">Chuyển đến công ty</dt>
                <dd>{formatCompanyDateTime(data.dispatchedToCompanyAt)}</dd>
              </div>
            </div>
            <div>
              <dt className="text-muted-foreground">Tọa độ</dt>
              <dd className="tabular-nums">
                {data.latitude}, {data.longitude}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div
            className={cn(
              'rounded-lg border p-5 shadow-sm',
              data.sla.isBreached
                ? 'border-red-200 bg-red-50/80'
                : 'border-emerald-100 bg-white dark:border-border dark:bg-card'
            )}
          >
            <div className="flex items-start gap-2">
              {data.sla.isBreached && (
                <AlertTriangle className="size-5 shrink-0 text-red-600" aria-hidden />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SLA xử lý
                </p>
                <p className="mt-1 text-sm font-medium">{data.sla.severityLabel}</p>
                <p
                  className={cn(
                    'mt-1 text-lg font-bold',
                    data.sla.isBreached ? 'text-red-700' : 'text-emerald-800'
                  )}
                >
                  {formatSlaRemaining(data.sla.hoursRemaining)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hạn: {formatCompanyDateTime(data.sla.resolveDueAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-white p-5 text-center shadow-sm dark:border-border dark:bg-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tiến độ tổng
            </p>
            <div className="mt-3 flex justify-center">
              <ProgressRing value={data.summary.overallProgressPercent} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
              <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="text-muted-foreground">Tổng đội</span>
                <p className="font-bold tabular-nums">{data.summary.totalTeams}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="text-muted-foreground">Hoàn thành</span>
                <p className="font-bold tabular-nums">{data.summary.completedTeams}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="text-muted-foreground">Đang chờ</span>
                <p className="font-bold tabular-nums">{data.summary.pendingTeams}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                <span className="text-muted-foreground">Từ chối</span>
                <p className="font-bold tabular-nums">{data.summary.declinedTeams}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasResults && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
            Kết quả xử lý
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Trạng thái báo cáo:{' '}
            <span className="font-medium text-emerald-900">{reportStatusLabelVi(data.status)}</span>
            {data.resolvedAt && <> · Hoàn tất {formatCompanyDateTime(data.resolvedAt)}</>}
          </p>
          {data.media.afterImages.length > 0 ? (
            <div className="mt-4">
              <MediaGallery title="Ảnh sau xử lý" images={data.media.afterImages} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Chưa có ảnh sau xử lý — theo dõi khi đội upload minh chứng.
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
          <UsersRound className="size-4" aria-hidden />
          Đội được phân công
        </h3>
        <div className="space-y-3">
          {data.teamAssignments.map(team => (
            <div
              key={team.assignmentId}
              className="rounded-md border border-emerald-100 bg-emerald-50/30 p-4 dark:border-border"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{team.teamName}</p>
                  <p className="text-xs text-muted-foreground">
                    Phân công bởi {team.assignedByName} · {formatCompanyDateTime(team.assignedAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    assignmentStatusClasses(team.status)
                  )}
                >
                  {assignmentStatusLabel(team.status)}
                </span>
              </div>
              {assignmentStatusCompanyHint(team.status) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignmentStatusCompanyHint(team.status)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${team.progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums text-emerald-800">
                  {team.progressPercent}%
                </span>
              </div>
              {team.progressNote && (
                <p className="mt-2 text-xs text-muted-foreground">Ghi chú: {team.progressNote}</p>
              )}
              {team.declineReason && (
                <p className="mt-2 text-xs text-red-600">Lý do từ chối: {team.declineReason}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {team.members.map(member => (
                  <span
                    key={member.userId}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      member.isLeader
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-emerald-900 ring-1 ring-emerald-200'
                    )}
                  >
                    {member.fullName}
                    {member.isLeader ? ' · Trưởng đội' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
            <Clock className="size-4" aria-hidden />
            Timeline trạng thái
          </h3>
          <ol className="relative space-y-4 border-l-2 border-emerald-200 pl-5">
            {data.timeline.map((entry, idx) => (
              <li key={`${entry.timestamp}-${idx}`} className="relative">
                <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                <p className="text-xs text-muted-foreground">
                  {formatCompanyDateTime(entry.timestamp)}
                </p>
                <p className="text-sm font-medium">
                  {entry.fromStatus
                    ? `${reportStatusLabelVi(entry.fromStatus)} → ${reportStatusLabelVi(entry.toStatus)}`
                    : reportStatusLabelVi(entry.toStatus)}
                </p>
                {entry.changedByName && (
                  <p className="text-xs text-muted-foreground">bởi {entry.changedByName}</p>
                )}
                {entry.reason && (
                  <p className="text-xs text-muted-foreground">Lý do: {entry.reason}</p>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          {data.wasteTags.length > 0 && (
            <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
                <Tag className="size-4" aria-hidden />
                Waste tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.wasteTags.map(tag => (
                  <span
                    key={tag.tagId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200"
                  >
                    {tag.nameVi}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasMedia ? (
            <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
                <ImageIcon className="size-4" aria-hidden />
                Hình ảnh
              </h3>
              <div className="space-y-4">
                <MediaGallery title="Trước xử lý" images={data.media.beforeImages} />
                <MediaGallery title="Tiến độ" images={data.media.progressImages} />
                <MediaGallery title="Sau xử lý" images={data.media.afterImages} />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/30 p-8 text-center text-sm text-muted-foreground">
              Chưa có hình ảnh minh chứng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
