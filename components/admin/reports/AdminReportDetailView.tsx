'use client';

import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import { useAdminReportDetail } from '@/hooks/useAdminReports';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AdminReportDetailViewProps {
  reportId: string;
}

export function AdminReportDetailView({ reportId }: AdminReportDetailViewProps) {
  const { data, isPending, isError, refetch } = useAdminReportDetail(reportId);

  if (isPending) {
    return (
      <div className="w-full min-w-0 animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-40 rounded-card bg-muted" />
        <div className="h-64 rounded-card bg-muted" />
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

  return (
    <div className="w-full min-w-0 space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Quay lại danh sách
      </Link>

      <header className="rounded-card border border-border bg-card p-6 shadow-sm">
        <p className="font-mono text-xs text-muted-foreground">{data.code}</p>
        <h1 className="mt-1 text-xl font-bold">{reportListTitle(data)}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ReportStatusBadge status={data.status} />
          <ReportSeverityBars severity={data.severity} />
          <span className="text-sm text-muted-foreground">
            Nhận {formatReportRelativeTime(data.createdAt)}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-card p-5 shadow-sm">
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
              <dd className="mt-0.5">
                {data.isAnonymous ? 'Ẩn danh' : `Reporter #${data.reporterCount}`}
              </dd>
            </div>
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

        <section className="rounded-card border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Phân công ({data.assignments.length})
          </h2>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có phân công.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.assignments.map(a => (
                <li key={a.id} className="rounded-lg border border-border p-3">
                  <p className="font-medium">{a.teamName ?? 'Đội chưa đặt tên'}</p>
                  <p className="text-xs text-muted-foreground">{a.status ?? '—'}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.media.length > 0 && (
        <section className="rounded-card border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Media
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.media.map(m => (
              <div
                key={m.id}
                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
              >
                {m.mimeType?.startsWith('image/') ? (
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
