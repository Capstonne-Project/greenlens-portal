'use client';

import { cn } from '@/lib/utils';
import { Bell, UserRound, Shield, Building2, Upload, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICON_MAP: Record<string, LucideIcon> = {
  bell: Bell,
  'user-round': UserRound,
  shield: Shield,
  building: Building2,
  upload: Upload,
};

export type SettingsNavItem = {
  id: string;
  label: string;
  href: string;
  /** Key into the icon registry — e.g. `"bell"`, `"user-round"`. */
  icon: string;
};

type SettingsShellProps = {
  title?: string;
  navItems: readonly SettingsNavItem[];
  children: React.ReactNode;
};

export function SettingsShell({ title = 'Cài đặt', navItems, children }: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-7rem)] min-w-0 flex-col overflow-hidden rounded-2xl bg-white md:flex-row">
      <aside className="w-full shrink-0 border-b border-border/70 bg-white px-4 py-5 md:w-72 md:border-r md:border-b-0 md:px-5">
        <h1 className="px-2 text-xl font-semibold tracking-tight text-black sm:text-2xl">
          {title}
        </h1>

        <nav className="mt-5 flex flex-col gap-1.5" aria-label={title}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICON_MAP[item.icon];
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-black transition-colors',
                  active ? 'bg-[#f3f5f7]' : 'hover:bg-[#f7f8fa]'
                )}
                aria-current={active ? 'page' : undefined}
              >
                {Icon ? <Icon className="size-4" aria-hidden /> : null}
                <span className="font-normal">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </section>
    </div>
  );
}
