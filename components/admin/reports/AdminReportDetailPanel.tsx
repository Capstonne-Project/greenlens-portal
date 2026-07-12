'use client';

import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import { useAdminReportDetail, useUnhideAdminReport } from '@/hooks/useAdminReports';
import type { AdminReportListItem } from '@/lib/api/models/adminReport';
import { isAdminReportMarkedHidden } from '@/lib/storage/adminHiddenReports';
import { cn } from '@/lib/utils';
import { getAdminReportMutationError } from '@/utils/adminReportErrors';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import { Eye, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface AdminReportDetailPanelProps {
  reportId: string | null;
  onClose: () => void;
  listItem?: AdminReportListItem | null;
  onHiddenChange?: (id: string, hidden: boolean) => void;
}

export function AdminReportDetailPanel({
  reportId,
  onClose,
  listItem,
  onHiddenChange,
}: AdminReportDetailPanelProps) {
  const { data, isPending, isError } = useAdminReportDetail(reportId);
  const unhideReport = useUnhideAdminReport();
  const [hiddenLocal, setHiddenLocal] = useState(() =>
    reportId ? isAdminReportMarkedHidden(reportId) : false
  );

  const report = data ?? listItem;
  if (!reportId) return null;

  const isHidden = hiddenLocal || Boolean(report?.isHidden) || isAdminReportMarkedHidden(reportId);

  const onUnhide = () => {
    unhideReport.mutate(reportId, {
      onSuccess: env => {
        setHiddenLocal(false);
        onHiddenChange?.(reportId, false);
        toast.success(env.message || 'Đã hiện lại báo cáo.');
      },
      onError: err => toast.error(getAdminReportMutationError(err, 'Không thể hiện lại báo cáo.')),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-detail-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl md:rounded-card md:border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="report-detail-title" className="text-sm font-semibold">
            Chi tiết báo cáo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          className={cn(
            'flex-1 space-y-4 overflow-y-auto p-4',
            isHidden && 'bg-muted/20 opacity-60 grayscale'
          )}
        >
          {isPending && !report && (
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            </div>
          )}

          {isError && !report && (
            <p className="text-sm text-destructive">Không tải được chi tiết báo cáo.</p>
          )}

          {report && (
            <>
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {report.code}
                  {isHidden ? ' · Đã ẩn' : ''}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {reportListTitle(report)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ReportStatusBadge status={report.status} />
                  <ReportSeverityBars severity={report.severity} />
                  <span className="text-xs text-muted-foreground">
                    {formatReportRelativeTime(report.createdAt)}
                  </span>
                </div>
              </div>

              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Khu vực</dt>
                  <dd className="text-foreground">{report.address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Loại</dt>
                  <dd className="text-foreground">{report.categoryName}</dd>
                </div>
                {data?.description && (
                  <div>
                    <dt className="text-muted-foreground">Mô tả</dt>
                    <dd className="whitespace-pre-wrap text-foreground">{data.description}</dd>
                  </div>
                )}
              </dl>

              {data?.media && data.media.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Ảnh / video</p>
                  <div className="grid grid-cols-2 gap-2">
                    {data.media.map(m => (
                      <div
                        key={m.id}
                        className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        {m.mimeType?.startsWith('image/') || m.mediaType === 'Image' ? (
                          <Image
                            src={m.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                            unoptimized
                          />
                        ) : (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-full items-center justify-center text-xs text-emerald-800 underline"
                          >
                            {m.mediaType}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/admin/reports/${report.id}`}
                className="inline-block text-sm text-emerald-800 underline-offset-4 hover:underline"
              >
                Mở trang chi tiết đầy đủ
              </Link>
            </>
          )}
        </div>

        {isHidden ? (
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={onUnhide}
              disabled={unhideReport.isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
            >
              {unhideReport.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
              Hiện lại
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
