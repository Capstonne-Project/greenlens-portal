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
  roleHint: string;
  pageLabel?: string;
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
  roleHint,
  pageLabel,
  className,
}: AdminUserSummaryStripProps) {
  const totalHint = [roleHint, pageLabel].filter(Boolean).join(' · ');

  const items: AdminUserSummaryItem[] = [
    {
      key: 'total',
      label: 'Tổng người dùng',
      value: formatCount(totalItems),
      hint: totalHint,
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
      iconClassName: 'text-teal-700',
      accentClassName: 'bg-teal-500/10',
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
          <article key={item.key} className="flex items-center gap-2.5 bg-card px-2.5 py-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-md',
                item.accentClassName
              )}
              aria-hidden
            >
              <Icon className={cn('size-3.5', item.iconClassName)} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold tabular-nums leading-none tracking-tight">
                {item.value}
              </p>
              {item.hint ? (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">{item.hint}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
