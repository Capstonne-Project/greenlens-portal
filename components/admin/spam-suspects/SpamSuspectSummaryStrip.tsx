import { cn } from '@/lib/utils';
import { Bot, Lock, Rows3, ShieldAlert, type LucideIcon } from 'lucide-react';

type SpamSummaryItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClassName: string;
  accentClassName: string;
};

type SpamSuspectSummaryStripProps = {
  totalItems: number;
  onPageCount: number;
  bannedOnPage: number;
  highAiFlagOnPage: number;
  aiThreshold: number;
  pageSize: number;
  className?: string;
};

export function SpamSuspectSummaryStrip({
  totalItems,
  onPageCount,
  bannedOnPage,
  highAiFlagOnPage,
  aiThreshold,
  pageSize,
  className,
}: SpamSuspectSummaryStripProps) {
  const items: SpamSummaryItem[] = [
    {
      key: 'total',
      label: 'Tổng nghi spam',
      value: totalItems.toLocaleString('vi-VN'),
      hint: 'Theo bộ lọc ngưỡng',
      icon: ShieldAlert,
      iconClassName: 'text-amber-700',
      accentClassName: 'bg-amber-500/10',
    },
    {
      key: 'page',
      label: 'Trên trang này',
      value: String(onPageCount),
      hint: `Tối đa ${pageSize} dòng`,
      icon: Rows3,
      iconClassName: 'text-sky-700',
      accentClassName: 'bg-sky-500/10',
    },
    {
      key: 'banned',
      label: 'Đã khóa',
      value: String(bannedOnPage),
      hint: 'Chỉ tính trang hiện tại',
      icon: Lock,
      iconClassName: 'text-rose-700',
      accentClassName: 'bg-rose-500/10',
    },
    {
      key: 'ai',
      label: 'AI cờ cao',
      value: String(highAiFlagOnPage),
      hint: `≥ ${aiThreshold} cờ AI`,
      icon: Bot,
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
      aria-label="Tóm tắt nghi spam"
    >
      {items.map(item => {
        const Icon = item.icon;
        return (
          <article key={item.key} className="flex items-center gap-2.5 bg-card px-2.5 py-2.5">
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
