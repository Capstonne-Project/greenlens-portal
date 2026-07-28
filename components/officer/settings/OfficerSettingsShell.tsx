'use client';

import { cn } from '@/lib/utils';
import { Bell, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type OfficerSettingsShellProps = {
  children: React.ReactNode;
};

const SETTINGS_NAV = [
  {
    id: 'notifications',
    label: 'Thông báo',
    href: '/officer/settings/notifications',
    Icon: Bell,
  },
  {
    id: 'account',
    label: 'Cài đặt tài khoản',
    href: '/officer/settings/account',
    Icon: UserRound,
  },
] as const;

export function OfficerSettingsShell({ children }: OfficerSettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-7rem)] min-w-0 flex-col overflow-hidden rounded-2xl bg-white md:flex-row">
      <aside className="w-full shrink-0 border-b border-border/70 bg-white px-4 py-5 md:w-72 md:border-r md:border-b-0 md:px-5">
        <h1 className="px-2 text-xl font-semibold tracking-tight text-black sm:text-2xl">
          Cài đặt
        </h1>

        <nav className="mt-5 flex flex-col gap-1.5" aria-label="Cài đặt tài khoản">
          {SETTINGS_NAV.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                <item.Icon className="size-4" aria-hidden />
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
