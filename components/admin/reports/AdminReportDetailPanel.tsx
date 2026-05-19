'use client';

import { ReportSeverityBars } from '@/components/admin/reports/ReportSeverityBars';
import { ReportStatusBadge } from '@/components/admin/reports/ReportStatusBadge';
import { useAdminReportDetail } from '@/hooks/useAdminReports';
import type { AdminReportListItem } from '@/lib/api/models/adminReport';
import { formatReportRelativeTime, reportListTitle } from '@/utils/adminReportUi';
import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AdminReportDetailPanelProps {
  reportId: string | null;
  onClose: () => void;
  listItem?: AdminReportListItem | null;
}

export function AdminReportDetailPanel({
  reportId,
  onClose,
  listItem,
}: AdminReportDetailPanelProps) {
  const { data, isPending, isError } = useAdminReportDetail(reportId);
  const report = data ?? listItem;

  if (!reportId) return null;

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

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {isPending && (
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            </div>
          )}

          {isError && <p className="text-sm text-destructive">Không tải được chi tiết báo cáo.</p>}

          {report && !isPending && (
            <>
              <div>
                <p className="font-mono text-xs text-muted-foreground">{report.code}</p>
                <p className="mt-1 text-lg font-semibold">{reportListTitle(report)}</p>
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
                  <dd>{report.address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Loại</dt>
                  <dd>{report.categoryName}</dd>
                </div>
                {data?.description && (
                  <div>
                    <dt className="text-muted-foreground">Mô tả</dt>
                    <dd className="whitespace-pre-wrap">{data.description}</dd>
                  </div>
                )}
                {data?.slaVerifyDueAt && (
                  <div>
                    <dt className="text-muted-foreground">Hạn xác minh SLA</dt>
                    <dd>{formatReportRelativeTime(data.slaVerifyDueAt)}</dd>
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
                        {m.mimeType?.startsWith('image/') ? (
                          <Image src={m.url} alt="" fill className="object-cover" sizes="200px" />
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
      </div>
    </div>
  );
}
