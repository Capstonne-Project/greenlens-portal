import { ADMIN_SUMMARY_LABEL, ADMIN_SUMMARY_VALUE } from '@/components/admin/shared/adminUiTokens';
import { cn } from '@/lib/utils';
import { MailCheck, MailX, Rows3, Users, type LucideIcon } from 'lucide-react';

type AdminUserSummaryItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

type AdminUserSummaryStripProps = {
  totalItems: number | null;
  onPageCount: number;
  verifiedOnPage: number;
  unverifiedOnPage: number;
  className?: string;
};

function formatCount(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString('vi-VN');
}

export function AdminUserSummaryStrip({
  totalItems,
  onPageCount,
  verifiedOnPage,
  unverifiedOnPage,
  className,
}: AdminUserSummaryStripProps) {
  const items: AdminUserSummaryItem[] = [
    {
      key: 'total',
      label: 'Tổng người dùng',
      value: formatCount(totalItems),
      icon: Users,
      iconClassName: 'text-emerald-700',
      accentClassName: 'bg-emerald-500/10',
    },
    {
      key: 'page',
      label: 'Trên trang này',
      value: String(onPageCount),
      icon: Rows3,
      iconClassName: 'text-sky-700',
      accentClassName: 'bg-sky-500/10',
    },
    {
      key: 'verified',
      label: 'Đã xác minh',
      value: String(verifiedOnPage),
      icon: MailCheck,
      iconClassName: 'text-emerald-600',
      accentClassName: 'bg-emerald-500/10',
    },
    {
      key: 'unverified',
      label: 'Chưa xác minh',
      value: String(unverifiedOnPage),
      icon: MailX,
      iconClassName: 'text-amber-700',
      accentClassName: 'bg-amber-500/10',
    },
  ];

  return (
    <div
      className={cn(
        'grid gap-px overflow-hidden rounded-lg border border-border/70 bg-border/60 sm:grid-cols-2 xl:grid-cols-4',
        className
      )}
      aria-label="Tóm tắt người dùng"
    >
      {items.map(item => {
        const Icon = item.icon;
        return (
          <article key={item.key} className="flex items-center gap-3 bg-card px-4 py-3.5">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md',
                item.accentClassName
              )}
              aria-hidden
            >
              <Icon className={cn('size-4', item.iconClassName)} />
            </div>
            <div className="min-w-0">
              <p className={ADMIN_SUMMARY_LABEL}>{item.label}</p>
              <p className={cn('mt-0.5', ADMIN_SUMMARY_VALUE)}>{item.value}</p>
              {item.hint ? (
                <p className="mt-1 truncate text-xs text-muted-foreground/80">{item.hint}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
