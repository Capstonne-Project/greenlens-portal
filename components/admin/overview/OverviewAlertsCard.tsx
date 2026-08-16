import {
  alertTypeLabel,
  localizeDashboardText,
} from '@/components/admin/overview/adminDashboardFormat';
import type {
  AdminDashboardAlert,
  AdminDashboardAlertSeverity,
} from '@/lib/api/services/fetchAdminDashboard';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

function severityStyles(severity: AdminDashboardAlertSeverity): {
  dot: string;
  badge: string;
  label: string;
} {
  const key = String(severity).toLowerCase();
  if (key === 'critical') {
    return {
      dot: 'bg-red-600',
      badge: 'bg-red-50 text-red-900 ring-red-200/80',
      label: 'Nghiêm trọng',
    };
  }
  if (key === 'high') {
    return {
      dot: 'bg-red-500',
      badge: 'bg-red-50 text-red-800 ring-red-200/80',
      label: 'Cao',
    };
  }
  if (key === 'medium') {
    return {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-900 ring-amber-200/80',
      label: 'Trung bình',
    };
  }
  if (key === 'low') {
    return {
      dot: 'bg-emerald-500',
      badge: 'bg-sky-50 text-sky-800 ring-sky-200/80',
      label: 'Thấp',
    };
  }
  if (key === 'info' || key === 'information') {
    return {
      dot: 'bg-sky-500',
      badge: 'bg-sky-50 text-sky-800 ring-sky-200/80',
      label: 'Thông tin',
    };
  }
  return {
    dot: 'bg-slate-400',
    badge: 'bg-muted text-muted-foreground ring-border',
    label: localizeDashboardText(String(severity)),
  };
}

interface OverviewAlertsCardProps {
  alerts: AdminDashboardAlert[] | undefined;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function OverviewAlertsCard({
  alerts,
  isError = false,
  error = null,
  onRetry,
  className,
}: OverviewAlertsCardProps) {
  const list = alerts ?? [];

  return (
    <article
      className={cn(
        'flex h-full min-h-0 flex-col rounded-card border border-border bg-card p-3 shadow-sm',
        className
      )}
    >
      <header className="mb-2 flex shrink-0 items-center gap-2">
        <AlertTriangle className="size-3.5 text-amber-600" aria-hidden />
        <div>
          <h2 className="text-xs font-semibold text-foreground sm:text-sm">Cảnh báo hệ thống</h2>
          <p className="text-[10px] text-muted-foreground">Không phụ thuộc khoảng thời gian lọc</p>
        </div>
      </header>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs">
          <p className="font-medium text-destructive">Không tải được cảnh báo</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {error instanceof Error ? error.message : 'Vui lòng thử lại để tránh bỏ sót cảnh báo.'}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold transition hover:bg-muted"
            >
              <RefreshCw className="size-3" aria-hidden />
              Thử lại
            </button>
          ) : null}
        </div>
      ) : list.length === 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-2.5 py-2 text-xs">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" aria-hidden />
          <div>
            <p className="font-medium text-emerald-900">Hệ thống đang ổn định</p>
            <p className="mt-0.5 text-[10px] text-emerald-800/80">Không có cảnh báo đang mở.</p>
          </div>
        </div>
      ) : (
        <ul className="max-h-[min(280px,45vh)] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[160px]">
          {list.map((alert, index) => {
            const sev = severityStyles(alert.severity);
            return (
              <li
                key={`${alert.type}-${index}`}
                className="flex gap-2 rounded-lg border border-border/80 bg-muted/20 px-2 py-1.5"
              >
                <span className={cn('mt-1 size-1.5 shrink-0 rounded-full', sev.dot)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-foreground">
                      {alertTypeLabel(alert.type)}
                    </span>
                    <span
                      className={cn(
                        'inline-flex rounded px-1 py-0.5 text-[9px] font-semibold ring-1',
                        sev.badge
                      )}
                    >
                      {sev.label}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {localizeDashboardText(alert.message)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
