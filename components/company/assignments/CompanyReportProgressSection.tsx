'use client';

import { useReportProgress } from '@/hooks/useReport';
import { reportStatusLabelVi } from '@/lib/constants/reportStatus';
import { cn } from '@/lib/utils';
import { formatCompanyDateTime } from '@/utils/companyUi';
import { AlertTriangle, Loader2, RefreshCw, TrendingUp } from 'lucide-react';

interface CompanyReportProgressSectionProps {
  reportId: string;
}

export function CompanyReportProgressSection({ reportId }: CompanyReportProgressSectionProps) {
  const { data, isPending, isError, refetch, isFetching } = useReportProgress(reportId);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Đang tải tiến trình báo cáo…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm dark:border-border dark:bg-red-950/20">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
        <div className="space-y-2">
          <p className="font-medium text-destructive">Không tải được tiến trình (GET /progress)</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:underline"
          >
            <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const assignment = data.assignment;
  const progressPercent = Math.min(100, Math.max(0, assignment?.progressPercent ?? 0));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            Tiến trình xử lý · {data.code}
          </p>
          <p className="text-sm text-muted-foreground">
            Trạng thái: {reportStatusLabelVi(data.status)} · {data.categoryName}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
          <TrendingUp className="size-3.5" aria-hidden />
          {progressPercent}%
        </span>
      </div>

      <div
        className="h-2.5 overflow-hidden rounded-full bg-emerald-100"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Đội phụ trách</dt>
          <dd className="font-semibold">{assignment?.teamName?.trim() || 'Chưa phân công'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">SLA</dt>
          <dd className={cn('font-semibold', data.sla.isBreached && 'text-red-600')}>
            {data.sla.severityLabel}
            {data.sla.isBreached ? ' · Quá hạn' : ''}
          </dd>
        </div>
      </dl>

      {assignment ? (
        <ul className="divide-y divide-emerald-50 rounded-lg border border-emerald-100 dark:divide-border dark:border-border">
          <li className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{assignment.teamName}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatCompanyDateTime(assignment.assignedAt)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-emerald-800">
              {assignment.progressPercent}%
            </span>
          </li>
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có đội được phân công.</p>
      )}
    </div>
  );
}
