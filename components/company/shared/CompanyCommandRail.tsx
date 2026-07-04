import { cn } from '@/lib/utils';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

export type CommandRailItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent?: boolean;
  badge?: string | number;
};

interface CompanyCommandRailProps {
  items: CommandRailItem[];
  className?: string;
}

export function CompanyCommandRail({ items, className }: CompanyCommandRailProps) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap', className)}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-3.5 transition',
              item.accent
                ? 'border-emerald-500/40 bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700'
                : 'border-emerald-100/80 bg-white/80 hover:border-emerald-300 hover:bg-white dark:border-border dark:bg-card/80'
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                item.accent
                  ? 'bg-white/15'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50'
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block text-sm font-semibold">{item.label}</span>
                {item.badge != null && Number(item.badge) > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                      item.accent ? 'bg-white/25' : 'bg-emerald-600 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'mt-0.5 block truncate text-xs',
                  item.accent ? 'text-emerald-50/85' : 'text-muted-foreground'
                )}
              >
                {item.description}
              </span>
            </span>
            <ArrowRight
              className={cn(
                'size-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100',
                item.accent ? 'text-white/80' : 'text-emerald-600'
              )}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
