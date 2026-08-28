import { ADMIN_SUMMARY_LABEL, ADMIN_SUMMARY_VALUE } from '@/components/admin/shared/adminUiTokens';
import { cn } from '@/lib/utils';
import { Clock, EyeOff, Files, Inbox, type LucideIcon } from 'lucide-react';

type AdminReportSummaryItem = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

type AdminReportSummaryStripProps = {
  /** Tổng toàn hệ thống (không đổi khi lọc). */
  totalItems: number | null;
  /** Có bộ lọc/search đang áp dụng. */
  hasActiveFilters?: boolean;
  /** Số bản ghi khớp bộ lọc — `undefined` khi đang tải. */
  matchedCount?: number | null;
  openOnPage: number;
  submittedOnPage: number;
  anonymousOnPage: number;
  className?: string;
};

function formatCount(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString('vi-VN');
}

export function AdminReportSummaryStrip({
  totalItems,
  hasActiveFilters = false,
  matchedCount,
  openOnPage,
  submittedOnPage,
  anonymousOnPage,
  className,
}: AdminReportSummaryStripProps) {
  const items: AdminReportSummaryItem[] = [
    {
      key: 'total',
      label: 'Tổng báo cáo',
      value: formatCount(totalItems),
      hint: hasActiveFilters
        ? matchedCount != null
          ? `${formatCount(matchedCount)} khớp bộ lọc hiện tại`
          : 'Đang lọc…'
        : 'Toàn hệ thống',
      icon: Files,
      iconClassName: 'text-emerald-700',
      accentClassName: 'bg-emerald-500/10',
    },
    {
      key: 'open',
      label: 'Đang mở',
      value: String(openOnPage),
      hint: 'Chưa đóng · trang hiện tại',
      icon: Inbox,
      iconClassName: 'text-sky-700',
      accentClassName: 'bg-sky-500/10',
    },
    {
      key: 'submitted',
      label: 'Chờ xác minh',
      value: String(submittedOnPage),
      hint: 'Trạng thái đã gửi · trang hiện tại',
      icon: Clock,
      iconClassName: 'text-amber-700',
      accentClassName: 'bg-amber-500/10',
    },
    {
      key: 'anonymous',
      label: 'Ẩn danh',
      value: String(anonymousOnPage),
      hint: 'Trang hiện tại',
      icon: EyeOff,
      iconClassName: 'text-violet-700',
      accentClassName: 'bg-violet-500/10',
    },
  ];

  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/60 sm:grid-cols-2 xl:grid-cols-4',
        className
      )}
      aria-label="Tóm tắt báo cáo"
    >
      {items.map(item => {
        const Icon = item.icon;
        return (
          <article key={item.key} className="flex items-center gap-3 bg-card px-3.5 py-3">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                item.accentClassName
              )}
              aria-hidden
            >
              <Icon className={cn('size-4', item.iconClassName)} />
            </div>
            <div className="min-w-0">
              <p className={ADMIN_SUMMARY_LABEL}>{item.label}</p>
              <p className={ADMIN_SUMMARY_VALUE}>{item.value}</p>
              <p className="truncate text-xs text-muted-foreground/80">{item.hint}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
