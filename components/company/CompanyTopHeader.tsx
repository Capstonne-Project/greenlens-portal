'use client';

import { CompanyNotificationBell } from '@/components/company/notifications/CompanyNotificationBell';
import { getCompanyPageTitle } from '@/lib/constants/companyPageTitles';
import { useUiStore } from '@/lib/store/uiStore';
import { Globe, Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';

const iconButtonClass =
  'inline-flex size-10 items-center justify-center rounded-xl border border-emerald-100/80 bg-white/80 text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-border dark:bg-card';

export function CompanyTopHeader() {
  const pathname = usePathname();
  const title = getCompanyPageTitle(pathname);
  const isOverview = pathname === '/company';
  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const locale = useUiStore(s => s.locale);
  const toggleLocale = useUiStore(s => s.toggleLocale);

  const nextLocaleLabel = locale === 'vi' ? 'EN' : 'VN';

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-100/60 bg-white/70 backdrop-blur-md dark:border-border dark:bg-card/80">
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        {!isOverview ? (
          <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-emerald-950 dark:text-foreground md:text-base">
            {title}
          </h1>
        ) : (
          <span className="text-xs font-medium uppercase tracking-widest text-emerald-700/60">
            GreenLens Company
          </span>
        )}

        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <CompanyNotificationBell />
          <button
            type="button"
            onClick={toggleLocale}
            className={`${iconButtonClass} gap-1.5 px-2.5 text-xs font-semibold tracking-wide`}
            aria-label={`Đổi ngôn ngữ, hiện tại ${locale === 'vi' ? 'Tiếng Việt' : 'English'}`}
          >
            <Globe className="size-[18px]" aria-hidden />
            <span>{nextLocaleLabel}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
          >
            {theme === 'dark' ? (
              <Sun className="size-[18px]" aria-hidden />
            ) : (
              <Moon className="size-[18px]" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
