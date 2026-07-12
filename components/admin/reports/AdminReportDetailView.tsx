'use client';

import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import { useAdminReportDetail, useUnhideAdminReport } from '@/hooks/useAdminReports';
import { isAdminReportMarkedHidden } from '@/lib/storage/adminHiddenReports';
import { cn } from '@/lib/utils';
import { getAdminReportMutationError, isAdminReportNotFound } from '@/utils/adminReportErrors';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface AdminReportDetailViewProps {
  reportId: string;
}

export function AdminReportDetailView({ reportId }: AdminReportDetailViewProps) {
  const { data, isPending, isError, error, refetch, isFetching } = useAdminReportDetail(reportId);
  const unhideReport = useUnhideAdminReport();
  const [hiddenLocal, setHiddenLocal] = useState(() => isAdminReportMarkedHidden(reportId));

  const isHidden = hiddenLocal || Boolean(data?.isHidden);
  const isNotFound = isAdminReportNotFound(error);
  const showHiddenFallback = (isError || !data) && (isHidden || isNotFound);

  const onUnhide = () => {
    unhideReport.mutate(reportId, {
      onSuccess: env => {
        setHiddenLocal(false);
        toast.success(env.message || 'Đã hiện lại báo cáo.');
        void refetch();
      },
      onError: err => toast.error(getAdminReportMutationError(err, 'Không thể hiện lại báo cáo.')),
    });
  };

  if (isPending && !data) {
    return (
      <div className="w-full min-w-0 animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-40 rounded-card bg-muted" />
        <div className="h-64 rounded-card bg-muted" />
      </div>
    );
  }

  if (showHiddenFallback) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>

        <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center opacity-70">
          <p className="text-sm font-medium text-foreground">Báo cáo đang ẩn (làm xám)</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nội dung tạm không tải được từ máy chủ. Bạn vẫn có thể hiện lại từ đây hoặc từ danh
            sách.
          </p>
          <button
            type="button"
            onClick={onUnhide}
            disabled={unhideReport.isPending}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
          >
            {unhideReport.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            Hiện lại
          </button>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-sm text-destructive">
        Không tải được báo cáo.{' '}
        <button type="button" className="underline" onClick={() => refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const reporterLabel = data.isAnonymous
    ? 'Ẩn danh'
    : data.reporterId
      ? `Reporter ${data.reporterId.slice(0, 8)}…`
      : data.reporterCount > 0
        ? `${data.reporterCount} người gửi`
        : '—';

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách
        </Link>

        {isHidden ? (
          <button
            type="button"
            onClick={onUnhide}
            disabled={unhideReport.isPending || isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
          >
            {unhideReport.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
            Hiện lại
          </button>
        ) : null}
      </div>

      <header
        className={cn(
          'rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm transition-opacity',
          isHidden && 'bg-muted/40 opacity-60 grayscale'
        )}
      >
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {data.code}
            {isHidden ? ' · Đã ẩn' : ''}
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground">{reportListTitle(data)}</h1>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ReportStatusBadge status={data.status} />
          <ReportSeverityBars severity={data.severity} />
          <span className="text-sm text-muted-foreground">
            Nhận {formatReportRelativeTime(data.createdAt)}
          </span>
        </div>
      </header>

      <div
        className={cn(
          'grid gap-6 transition-opacity lg:grid-cols-2',
          isHidden && 'opacity-60 grayscale'
        )}
      >
        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Thông tin
          </h2>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Mô tả</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{data.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Địa chỉ</dt>
              <dd className="mt-0.5">{data.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tọa độ</dt>
              <dd className="mt-0.5 tabular-nums">
                {data.latitude}, {data.longitude}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Loại</dt>
              <dd className="mt-0.5">
                {data.categoryName} ({data.categoryCode})
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Người gửi</dt>
              <dd className="mt-0.5">{reporterLabel}</dd>
            </div>
            {data.priorityScore > 0 ? (
              <div>
                <dt className="text-muted-foreground">Điểm ưu tiên</dt>
                <dd className="mt-0.5 tabular-nums">{data.priorityScore.toFixed(2)}</dd>
              </div>
            ) : null}
            {data.slaVerifyDueAt && (
              <div>
                <dt className="text-muted-foreground">Hạn xác minh SLA</dt>
                <dd className="mt-0.5">{formatReportRelativeTime(data.slaVerifyDueAt)}</dd>
              </div>
            )}
            {data.slaResolveDueAt && (
              <div>
                <dt className="text-muted-foreground">Hạn giải quyết SLA</dt>
                <dd className="mt-0.5">{formatReportRelativeTime(data.slaResolveDueAt)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Phân công ({data.assignments.length})
          </h2>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phân công.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.assignments.map(a => (
                <li key={a.id} className="rounded-xl border border-border/80 bg-muted/20 p-3">
                  <p className="font-medium">{a.teamName ?? 'Đội chưa đặt tên'}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.teamType ? `${a.teamType} · ` : ''}
                    {a.status ?? '—'}
                    {a.progressPercent != null ? ` · ${a.progressPercent}%` : ''}
                  </p>
                  {a.progressNote ? (
                    <p className="mt-1 text-xs text-muted-foreground">{a.progressNote}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.wasteTags.length > 0 ? (
        <section
          className={cn(
            'rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-opacity',
            isHidden && 'opacity-60 grayscale'
          )}
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Thẻ rác thải
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.wasteTags.map(tag => (
              <span
                key={tag.tagId}
                className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900"
              >
                {tag.nameVi}
                <span className="ml-1 font-mono text-[10px] text-emerald-700/70">{tag.code}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {data.media.length > 0 && (
        <section
          className={cn(
            'rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition-opacity',
            isHidden && 'opacity-60 grayscale'
          )}
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Media
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.media.map(m => (
              <div
                key={m.id}
                className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted"
              >
                {m.mimeType?.startsWith('image/') || m.mediaType === 'Image' ? (
                  <Image
                    src={m.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="320px"
                    unoptimized
                  />
                ) : (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full items-center justify-center text-sm text-emerald-800 underline"
                  >
                    {m.mediaType}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
